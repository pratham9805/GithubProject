/**
 * Chat Controller
 *
 * RAG pipeline (v2 — Smart Retrieval):
 *
 *   1. Embed question
 *   2. Hybrid retrieve (vector + keyword scoring)  ← NEW
 *   3. LLM rerank top candidates                   ← NEW
 *   4. Deduplicate chunks                          ← NEW
 *   5. Build rich context with file headers        ← NEW
 *   6. Inject repo map for global context          ← NEW
 *   7. Stream GPT answer via SSE
 */

const asyncWrapper     = require("../middleware/asyncWrapper");
const { createError }  = require("../middleware/errorHandler");
const { streamChatResponse } = require("../services/openaiService");
const { hybridRetrieve, buildContext } = require("../services/retrievalService");
const { getRepoMap }   = require("../utils/repoMapCache");
const logger           = require("../utils/logger");

// ─── Ask Question (Streaming SSE) ────────────────────────────────────────────

/**
 * POST /api/chat/ask
 *
 * Body:
 *   question            {string}   The user's question
 *   namespace           {string}   Pinecone namespace (repo slug)
 *   repoName            {string}   "owner/repo" display name
 *   conversationHistory {object[]} Previous messages [{role, content}]
 *   settings            {object}   { model, temperature, topK, maxTokens }
 *
 * Streams SSE events:
 *   { type: 'chunk',   content: '...' }
 *   { type: 'done',    sources: [...], fullAnswer: '...' }
 *   { type: 'error',   message: '...' }
 */
const askQuestion = asyncWrapper(async (req, res) => {
  const {
    question,
    namespace,
    repoName        = "",
    conversationHistory = [],
    settings        = {},
  } = req.body;

  // ── Validate inputs ──────────────────────────────────────────────────────
  if (!question?.trim()) {
    return res.status(400).json({ error: "question is required" });
  }
  if (!namespace?.trim()) {
    return res.status(400).json({ error: "namespace is required" });
  }

  // ── Set SSE headers ──────────────────────────────────────────────────────
  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const topK   = typeof settings.topK === "number" ? settings.topK : 5;
    const fetchK = Math.max(topK * 2, 10); // fetch more for reranking

    // ── Step 1 + 2 + 3 + 4: Hybrid retrieve + rerank ────────────────────
    logger.info(`RAG: "${question.slice(0, 70)}" | ns=${namespace} | topK=${topK}`);

    const { matches, queryTerms } = await hybridRetrieve(question, namespace, {
      topK,
      fetchK,
      alpha:  0.72,
      rerank: true,
    });

    // Emit phase event — frontend advances UI pipeline steps
    res.write(`data: ${JSON.stringify({ type: "thinking", phase: "generating" })}\n\n`);
    if (typeof res.flush === "function") res.flush();

    if (matches.length === 0) {
      res.write(
        `data: ${JSON.stringify({
          type:    "error",
          message: "No relevant context found in this repository. The question may be outside the codebase scope, or try rephrasing.",
        })}\n\n`
      );
      return res.end();
    }

    // ── Step 5: Build rich context string ────────────────────────────────
    const { context, sources } = buildContext(matches, repoName);

    logger.info(`Context built: ${matches.length} chunks | Sources: ${sources.join(", ")}`);

    // ── Step 6: Inject repo map (global context) ─────────────────────────
    const repoMap = getRepoMap(namespace); // null if not generated yet

    // ── Step 7: Stream answer ─────────────────────────────────────────────
    await streamChatResponse(
      res,
      question,
      context,
      sources,
      conversationHistory,
      settings,
      repoName,
      repoMap
    );

  } catch (error) {
    logger.error(`Chat error: ${error.message}`);
    res.write(
      `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
    );
    res.end();
  }
});

module.exports = { askQuestion };
