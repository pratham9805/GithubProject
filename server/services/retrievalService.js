/**
 * Retrieval Service — Advanced RAG Retrieval Layer
 *
 * Implements:
 * 1. Hybrid search  — vector similarity + BM25-style keyword scoring
 * 2. LLM Reranking  — GPT-4o-mini reranks top-N results for relevance
 * 3. Deduplication  — removes near-duplicate chunks before LLM call
 * 4. Context window — builds rich context strings with file headers
 */

const { createEmbedding } = require("./openaiService");
const { queryNamespace }  = require("./pineconeService");
const openaiClient        = require("../config/openai");
const { env }             = require("../config/env");
const logger              = require("../utils/logger");

// ── BM25-style keyword scorer ─────────────────────────────────────────────────

/**
 * Simple TF-based keyword score.
 * Counts how many query terms appear in the chunk text (case-insensitive).
 * Normalised by chunk length to avoid favouring huge chunks.
 *
 * @param {string} chunkText
 * @param {string[]} queryTerms
 * @returns {number} score in [0, 1]
 */
const keywordScore = (chunkText, queryTerms) => {
  if (!queryTerms.length) return 0;
  const lower = chunkText.toLowerCase();
  const hits = queryTerms.filter((t) => lower.includes(t)).length;
  return hits / queryTerms.length;
};

/**
 * Tokenise a query into meaningful terms (removes stop words).
 */
const STOP_WORDS = new Set([
  "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
  "with","this","that","how","what","why","where","when","does","do","can",
  "could","would","should","will","from","are","was","were","has","have","be",
]);

const tokenise = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

// ── LLM Reranker ──────────────────────────────────────────────────────────────

/**
 * Uses GPT-4o-mini to rerank retrieved chunks by relevance.
 * Takes up to RERANK_INPUT chunks, returns top RERANK_OUTPUT.
 *
 * The LLM outputs a JSON array of chunk indices ordered by relevance.
 */
const RERANK_INPUT  = 12; // Max chunks sent to reranker
const RERANK_OUTPUT =  5; // How many we keep after reranking

const rerank = async (question, chunks) => {
  if (chunks.length <= RERANK_OUTPUT) return chunks;

  try {
    const chunkList = chunks
      .slice(0, RERANK_INPUT)
      .map((c, i) => `[${i}] File: ${c.metadata.path}\n${c.metadata.text.slice(0, 400)}`)
      .join("\n\n---\n\n");

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a code retrieval reranker. Given a question and code chunks, " +
            "return ONLY a JSON array of chunk indices (0-based) sorted from MOST to LEAST relevant. " +
            `Return exactly ${RERANK_OUTPUT} indices. Example: [3,0,7,2,5]`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nChunks:\n${chunkList}`,
        },
      ],
      temperature: 0,
      max_tokens: 60,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0].message.content;
    // Try to parse {"indices": [...]} or just [...]
    let indices;
    try {
      const parsed = JSON.parse(raw);
      indices = Array.isArray(parsed) ? parsed : (parsed.indices || parsed.ranked || Object.values(parsed)[0]);
    } catch {
      // Fallback: extract numbers from response
      indices = raw.match(/\d+/g)?.map(Number) || [];
    }

    // Validate and de-dup
    const valid = [...new Set(indices)]
      .filter((i) => typeof i === "number" && i >= 0 && i < chunks.length)
      .slice(0, RERANK_OUTPUT);

    if (valid.length === 0) throw new Error("No valid indices returned");

    logger.debug(`Reranker order: [${valid.join(",")}]`);
    return valid.map((i) => chunks[i]);
  } catch (err) {
    logger.warn(`Reranking failed (${err.message}), using hybrid scores instead`);
    return chunks.slice(0, RERANK_OUTPUT);
  }
};

// ── Deduplication ─────────────────────────────────────────────────────────────

/**
 * Removes chunks that are near-duplicates (share >80% of content).
 * Uses a simple fingerprint — first 120 chars of text.
 */
const deduplicate = (chunks) => {
  const seen = new Set();
  return chunks.filter((c) => {
    const key = c.metadata.text.slice(0, 120).replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ── Hybrid Retrieve ───────────────────────────────────────────────────────────

/**
 * Full hybrid retrieval pipeline:
 *
 *   1. Embed question → query Pinecone (topK=RERANK_INPUT)
 *   2. Score each result with hybrid: α * vectorScore + (1-α) * keywordScore
 *   3. Sort by hybrid score
 *   4. Deduplicate
 *   5. LLM rerank top RERANK_INPUT → keep RERANK_OUTPUT
 *
 * @param {string} question
 * @param {string} namespace
 * @param {object} [opts]
 * @param {number} [opts.topK=5]     - Final number of chunks returned
 * @param {number} [opts.fetchK=12]  - How many to fetch from Pinecone initially
 * @param {number} [opts.alpha=0.7]  - Weight of vector score vs keyword score
 * @param {boolean}[opts.rerank=true]- Whether to apply LLM reranker
 * @returns {Promise<{matches: object[], queryTerms: string[]}>}
 */
const hybridRetrieve = async (question, namespace, opts = {}) => {
  const {
    topK    = 5,
    fetchK  = RERANK_INPUT,
    alpha   = 0.7,
    rerank: doRerank = true,
  } = opts;

  // 1. Embed question
  const questionEmbedding = await createEmbedding(question);
  if (!questionEmbedding) throw new Error("Failed to create question embedding.");

  // 2. Fetch more candidates from Pinecone than we need
  const searchResult = await queryNamespace(questionEmbedding, namespace, fetchK);
  let matches = searchResult.matches || [];

  if (matches.length === 0) return { matches: [], queryTerms: [] };

  // 3. Hybrid scoring
  const queryTerms = tokenise(question);

  matches = matches.map((m) => {
    const vecScore = m.score || 0; // cosine similarity [0,1]
    const kwScore  = keywordScore(m.metadata?.text || "", queryTerms);
    const hybrid   = alpha * vecScore + (1 - alpha) * kwScore;
    return { ...m, hybridScore: hybrid };
  });

  // 4. Sort by hybrid score descending
  matches.sort((a, b) => b.hybridScore - a.hybridScore);

  // 5. Deduplicate
  matches = deduplicate(matches);

  logger.debug(
    `Hybrid retrieval: ${matches.length} candidates for "${question.slice(0, 50)}"`
  );

  // 6. LLM Rerank
  if (doRerank && matches.length > topK) {
    matches = await rerank(question, matches);
  } else {
    matches = matches.slice(0, topK);
  }

  return { matches, queryTerms };
};

// ── Context Builder ───────────────────────────────────────────────────────────

/**
 * Builds the rich context string passed to the LLM.
 * Each chunk gets a structured header: repo, file path, language, score.
 *
 * @param {object[]} matches - reranked Pinecone matches
 * @param {string} repoName
 * @returns {{ context: string, sources: string[] }}
 */
const buildContext = (matches, repoName = "") => {
  const sources = [...new Set(matches.map((m) => m.metadata?.fileName || m.metadata?.path || "unknown"))];

  const context = matches
    .map((m, i) => {
      const meta = m.metadata || {};
      const score = m.hybridScore ? ` | relevance: ${(m.hybridScore * 100).toFixed(0)}%` : "";
      return [
        `── Chunk ${i + 1} ──────────────────────────────────────`,
        `Repository : ${repoName}`,
        `File       : ${meta.path || meta.fileName || "unknown"}`,
        `Language   : ${meta.language || "unknown"}`,
        score ? `Score      :${score}` : "",
        ``,
        meta.text || "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return { context, sources };
};

module.exports = { hybridRetrieve, buildContext, tokenise };
