/**
 * Repository Controller (v2)
 *
 * Ingestion pipeline upgrades:
 *  1. Uses chunkFile() — structure-aware chunker (splits by function/class)
 *  2. Embeds the enriched "embeddingText" (header + body) for better retrieval
 *  3. Stores richer metadata per vector: language, chunkIndex, header
 *  4. Generates LLM repo map after indexing → stored in repoMapCache
 *  5. Streams granular SSE progress
 */

const asyncWrapper    = require("../middleware/asyncWrapper");
const { createError } = require("../middleware/errorHandler");
const { getRepoContents, getRepoMetadata } = require("../services/githubService");
const { getFileContent }  = require("../utils/getFileContent");
const { chunkFile }       = require("../utils/chunkText");
const { createEmbedding, generateRepoSummary, generateRepoMap } = require("../services/openaiService");
const { upsertVectors, getNamespaceStats, deleteNamespace }      = require("../services/pineconeService");
const { getNamespaceFromUrl, parseRepoUrl } = require("../utils/namespaceSlug");
const { setRepoMap, clearRepoMap }          = require("../utils/repoMapCache");
const logger = require("../utils/logger");

// ─── SSE Helper ───────────────────────────────────────────────────────────────

const sendEvent = (res, type, data) => {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  if (typeof res.flush === "function") res.flush();
};

// ─── Analyze Repository ───────────────────────────────────────────────────────

/**
 * POST /api/repo/analyze
 *
 * SSE event types:
 *   start           → { namespace, repoName, metadata }
 *   status          → { message }
 *   files_found     → { count }
 *   file            → { fileName, path, chunksCreated, filesProcessed, totalFiles }
 *   vectors_upserted→ { vectorsStored }
 *   summary         → { summary }
 *   complete        → { stats, repoName, namespace, summary, metadata }
 *   error           → { message }
 */
const analyzeRepo = asyncWrapper(async (req, res) => {
  const { repoUrl } = req.body;

  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const namespace        = getNamespaceFromUrl(repoUrl);
    const repoName         = `${owner}/${repo}`;

    // 1. Fetch metadata
    sendEvent(res, "status", { message: `Fetching metadata for ${repoName}...` });
    const metadata = await getRepoMetadata(owner, repo);

    // 2. Fast-path: already indexed
    const existingStats = await getNamespaceStats(namespace);
    if (existingStats?.vectorCount > 0) {
      logger.info(`Repo ${namespace} already indexed (${existingStats.vectorCount} vectors). Fast-pathing.`);
      sendEvent(res, "start",    { namespace, repoName, repoUrl, metadata });
      sendEvent(res, "status",   { message: "Repository already indexed! Loading context..." });
      sendEvent(res, "complete", {
        status: "existing",
        repoName,
        namespace,
        summary: "This repository was previously indexed and is ready for AI-powered queries.",
        metadata,
        stats: {
          filesProcessed: 0,
          chunksCreated:  0,
          vectorsStored:  existingStats.vectorCount,
          namespace,
        },
      });
      return res.end();
    }

    sendEvent(res, "start", { namespace, repoName, repoUrl, metadata });

    // 3. Fetch all files
    sendEvent(res, "status", { message: "Scanning repository files..." });
    const files = await getRepoContents(owner, repo);

    if (files.length === 0) {
      sendEvent(res, "error", { message: "No indexable files found in this repository." });
      return res.end();
    }
    sendEvent(res, "files_found", { count: files.length });

    // 4. Process each file
    let filesProcessed = 0;
    let chunksCreated  = 0;
    let vectorsStored  = 0;

    // For summary/map generation
    const sampleChunks = [];   // { fileName, path, text } — first 20 chunks
    const vectorBatch  = [];
    const BATCH_SIZE   = 100;

    for (const file of files) {
      const content = await getFileContent(file.download_url, file.name);
      if (!content || content.trim().length === 0) continue;

      // ── Smart code chunking ──────────────────────────────────────────
      const richChunks = chunkFile(content, file.path, repoName);
      if (richChunks.length === 0) continue;

      filesProcessed++;
      chunksCreated += richChunks.length;

      sendEvent(res, "file", {
        fileName:     file.name,
        path:         file.path,
        chunksCreated: richChunks.length,
        filesProcessed,
        totalFiles:   files.length,
      });

      // ── Embed each chunk ─────────────────────────────────────────────
      for (let i = 0; i < richChunks.length; i++) {
        const chunk = richChunks[i];

        // Embed the enriched text (header + body) for better retrieval
        const embedding = await createEmbedding(chunk.embeddingText);
        if (!embedding) continue;

        const vectorId = `${namespace}--${file.path.replace(/\//g, "_")}--${i}--${Date.now()}`;

        vectorBatch.push({
          id:     vectorId,
          values: embedding,
          metadata: {
            // Core retrieval fields
            text:       chunk.text,          // actual chunk body (shown in context)
            header:     chunk.header,        // context header
            fileName:   file.name,
            path:       file.path,
            language:   chunk.language,
            chunkIndex: chunk.chunkIndex,
            // Repo context
            repoName,
            repoUrl,
            namespace,
          },
        });

        // Collect diverse sample for repo map generation
        if (sampleChunks.length < 20) {
          sampleChunks.push({
            fileName: file.name,
            path:     file.path,
            text:     chunk.text,
          });
        }

        // Upsert in batches
        if (vectorBatch.length >= BATCH_SIZE) {
          await upsertVectors(vectorBatch, namespace);
          vectorsStored += vectorBatch.length;
          sendEvent(res, "vectors_upserted", { vectorsStored });
          vectorBatch.length = 0;
        }
      }
    }

    // Flush remaining vectors
    if (vectorBatch.length > 0) {
      await upsertVectors(vectorBatch, namespace);
      vectorsStored += vectorBatch.length;
    }

    // 5. Generate short summary (for UI)
    sendEvent(res, "status", { message: "Generating repository summary..." });
    const summary = await generateRepoSummary(repoName, sampleChunks);
    sendEvent(res, "summary", { summary });

    // 6. Generate full repo map (for RAG context injection)
    sendEvent(res, "status", { message: "Building repository intelligence map..." });
    const repoMap = await generateRepoMap(repoName, sampleChunks, metadata);
    if (repoMap) {
      setRepoMap(namespace, repoMap);
      logger.success(`Repo map generated and cached for ${namespace}`);
    }

    // 7. Done
    const finalStats = { filesProcessed, chunksCreated, vectorsStored, namespace };

    logger.success(
      `Ingestion complete: ${repoName} | Files: ${filesProcessed} | Chunks: ${chunksCreated} | Vectors: ${vectorsStored}`
    );

    sendEvent(res, "complete", {
      stats:     finalStats,
      repoName,
      namespace,
      summary,
      metadata,
    });

    res.end();
  } catch (error) {
    logger.error(`Ingestion error: ${error.message}`);
    sendEvent(res, "error", { message: error.message });
    res.end();
  }
});

// ─── Repo Stats ───────────────────────────────────────────────────────────────

const getRepoStats = asyncWrapper(async (req, res) => {
  const { namespace } = req.params;
  if (!namespace) throw createError("namespace is required", 400);

  const stats = await getNamespaceStats(namespace);
  res.json({ success: true, namespace, ...stats });
});

// ─── Delete Repository ────────────────────────────────────────────────────────

const deleteRepo = asyncWrapper(async (req, res) => {
  const { namespace } = req.params;
  if (!namespace) throw createError("namespace is required", 400);

  await deleteNamespace(namespace);
  clearRepoMap(namespace); // also clear cached map

  res.json({
    success: true,
    message: `Repository '${namespace}' has been removed from the index.`,
  });
});

module.exports = { analyzeRepo, getRepoStats, deleteRepo };
