/**
 * OpenAI Service
 *
 * Handles all OpenAI API interactions:
 *  - Text embeddings      (text-embedding-3-small)
 *  - Streaming chat       (gpt-4.1-mini by default)
 *  - Repo summarization   (generates LLM repo map)
 *  - Repo map generation  (structured index of the entire repo)
 */

const openaiClient = require("../config/openai");
const { env }      = require("../config/env");
const logger       = require("../utils/logger");

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert software engineer and code analyst. \
You help developers understand GitHub repositories by answering questions about code, architecture, and implementation details.

RULES:
1. Answer ONLY from the repository context provided in the user message.
2. If the context doesn't have enough information, say: "The retrieved context doesn't cover this fully — try rephrasing or asking about a specific file."
3. Always cite the specific file path when referencing code (e.g., \`src/utils/auth.js\`).
4. Use markdown formatting: code blocks with language tags, bold for key terms, bullet lists for steps.
5. For code questions, show the relevant code snippet from the context, then explain it.
6. Be precise and technical — assume the user is a developer.
7. If multiple files are relevant, structure your answer by file/component.

You have access to a repository map (high-level index) and specific code chunks retrieved for this question.`;

// ─── Embeddings ───────────────────────────────────────────────────────────────

/**
 * Generates an embedding vector for text.
 * Returns null on failure so callers can skip gracefully.
 *
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
const createEmbedding = async (text) => {
  try {
    if (!text || text.trim().length === 0) return null;

    const response = await openaiClient.embeddings.create({
      model: env.DEFAULT_EMBEDDING_MODEL || "text-embedding-3-small",
      // Slightly trim to avoid hard token-limit errors
      input: text.slice(0, 8000),
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error(`Embedding failed: ${error.message}`);
    return null;
  }
};

// ─── User Message Builder ─────────────────────────────────────────────────────

/**
 * Builds a rich user message combining:
 *  - Repo map (if available)
 *  - Retrieved code chunks with headers
 *  - The user's question
 *
 * @param {string} question
 * @param {string} context    - Formatted chunks from retrievalService.buildContext()
 * @param {string[]} sources  - Source file paths
 * @param {string} repoName
 * @param {string|null} repoMap - LLM-generated repo summary/map
 */
const buildUserMessage = (question, context, sources, repoName = "", repoMap = null) => {
  const parts = [];

  // 1. Repo identity
  parts.push(`## Repository: ${repoName || "Unknown"}`);

  // 2. Repo map (high-level index) if available
  if (repoMap) {
    parts.push(`## Repository Map (High-Level Index)\n${repoMap}`);
  }

  // 3. Retrieved code chunks
  parts.push(`## Retrieved Code Context\n${context}`);

  // 4. Source list
  if (sources.length > 0) {
    parts.push(`## Source Files Referenced\n${sources.map((s) => `- \`${s}\``).join("\n")}`);
  }

  // 5. Question
  parts.push(`## Question\n${question}`);

  parts.push(
    `**Instructions:** Answer the question using ONLY the context above. ` +
    `Cite exact file paths. Format code with markdown code blocks.`
  );

  return parts.join("\n\n");
};

// ─── Streaming Chat ───────────────────────────────────────────────────────────

/**
 * Streams a chat response to the Express res object via SSE.
 *
 * SSE events written:
 *   { type: 'chunk',  content: '...' }      — incremental tokens
 *   { type: 'done',   sources: [...], fullAnswer: '...' }
 *
 * @param {object} res               - Express response (already SSE-headered)
 * @param {string} question
 * @param {string} context           - Built by retrievalService.buildContext()
 * @param {string[]} sources
 * @param {object[]} conversationHistory
 * @param {object}  settings         - { model, temperature, maxTokens }
 * @param {string}  repoName
 * @param {string|null} repoMap
 */
const streamChatResponse = async (
  res,
  question,
  context,
  sources,
  conversationHistory = [],
  settings = {},
  repoName = "",
  repoMap  = null
) => {
  const model       = settings.model       || env.DEFAULT_CHAT_MODEL || "gpt-4o-mini";
  const temperature = typeof settings.temperature === "number" ? settings.temperature : 0.25;
  const maxTokens   = settings.maxTokens   || 2000;

  const userMessage = buildUserMessage(question, context, sources, repoName, repoMap);

  // Keep at most last 4 turns (8 messages) to save tokens
  const history = conversationHistory.slice(-8);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage },
  ];

  const stream = await openaiClient.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  let fullAnswer = "";

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullAnswer += content;
      res.write(`data: ${JSON.stringify({ type: "chunk", content })}\n\n`);
      // Flush immediately — critical for real-time streaming.
      // Without this, Express/Node buffers chunks and sends them in batches.
      if (typeof res.flush === "function") res.flush();
    }
  }

  res.write(
    `data: ${JSON.stringify({ type: "done", sources, fullAnswer })}\n\n`
  );
  if (typeof res.flush === "function") res.flush();
  res.end();
};

// ─── Repo Map Generator ───────────────────────────────────────────────────────

/**
 * Generates a structured "repo map" — a high-level LLM-written index of
 * the entire repository. Stored per-namespace and passed to every chat call.
 *
 * The map covers:
 *  - Purpose and domain
 *  - Key directories and what they contain
 *  - Main entry points
 *  - Technologies & patterns
 *  - Key files to know about
 *
 * @param {string} repoName       - "owner/repo"
 * @param {object[]} allChunks    - Sample of ingested chunks { fileName, path, text }
 * @param {object|null} metadata  - GitHub repo metadata
 * @returns {Promise<string>}
 */
const generateRepoMap = async (repoName, allChunks, metadata = null) => {
  try {
    // Pick a diverse sample: prefer key files like index, main, README, package.json
    const priorityFiles = ["readme", "index", "main", "app", "package.json", "setup.py", "go.mod"];

    const sorted = [...allChunks].sort((a, b) => {
      const aKey = priorityFiles.some((k) => a.fileName?.toLowerCase().includes(k)) ? 0 : 1;
      const bKey = priorityFiles.some((k) => b.fileName?.toLowerCase().includes(k)) ? 0 : 1;
      return aKey - bKey;
    });

    // Take up to 15 chunks, truncated to 300 chars each
    const sample = sorted.slice(0, 15)
      .map((c) => `### ${c.path || c.fileName}\n${(c.text || "").slice(0, 300)}`)
      .join("\n\n---\n\n");

    const metaBlock = metadata
      ? `Stars: ${metadata.stars} | Language: ${metadata.language} | Topics: ${(metadata.topics || []).join(", ")}\nDescription: ${metadata.description || "N/A"}`
      : "";

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior software architect. Analyze the provided repository samples and generate a concise, structured repository map. " +
            "Be precise and technical. Output plain markdown, no fluff.",
        },
        {
          role: "user",
          content: `Repository: ${repoName}\n${metaBlock}\n\nCode Samples:\n---\n${sample}\n---\n\n` +
            `Generate a structured repo map covering:\n` +
            `1. **Purpose** — what this repo does in 2 sentences\n` +
            `2. **Tech Stack** — frameworks, languages, key libraries\n` +
            `3. **Architecture** — high-level structure (monolith, microservices, MVC, etc.)\n` +
            `4. **Key Directories** — what each important folder contains\n` +
            `5. **Entry Points** — where the app starts\n` +
            `6. **Key Files** — most important files to understand the codebase\n\n` +
            `Keep it under 400 words. Be specific, not generic.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error(`Repo map generation failed: ${error.message}`);
    return null;
  }
};

// ─── Repo Summary (short) ─────────────────────────────────────────────────────

/**
 * Short 3-sentence summary shown in the UI sidebar.
 * Faster / cheaper than the full repo map.
 *
 * @param {string} repoName
 * @param {object[]} sampleChunks
 * @returns {Promise<string>}
 */
const generateRepoSummary = async (repoName, sampleChunks) => {
  try {
    const sampleText = sampleChunks
      .slice(0, 8)
      .map((c) => `[${c.fileName}]\n${c.text}`)
      .join("\n\n---\n\n");

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a technical writer. Write a concise repository summary.",
        },
        {
          role: "user",
          content: `Repository: ${repoName}\n\nSamples:\n${sampleText}\n\n` +
            `Write a 2-3 sentence technical summary covering what this repo does, ` +
            `the main tech stack, and the primary architecture pattern.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error(`Repo summary generation failed: ${error.message}`);
    return "Repository summary could not be generated.";
  }
};

module.exports = {
  createEmbedding,
  streamChatResponse,
  generateRepoSummary,
  generateRepoMap,
};