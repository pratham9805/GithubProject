/**
 * API Layer
 * All HTTP calls to the backend in one place.
 * Uses the Fetch API for streaming (SSE) and axios-style abstractions.
 */

const BASE_URL = "http://localhost:5000";

// ─── Health ───────────────────────────────────────────────────────────────────

export const checkHealth = async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
};

// ─── Repository Ingestion (SSE Stream) ───────────────────────────────────────

/**
 * Analyzes a repository and streams progress events.
 *
 * @param {string} repoUrl
 * @param {object} callbacks
 * @param {function} callbacks.onStatus        — { message }
 * @param {function} callbacks.onStart         — { namespace, repoName, metadata }
 * @param {function} callbacks.onFilesFound    — { count }
 * @param {function} callbacks.onFile          — { fileName, filesProcessed, totalFiles, chunksCreated }
 * @param {function} callbacks.onVectorsUpserted — { vectorsStored }
 * @param {function} callbacks.onSummary       — { summary }
 * @param {function} callbacks.onComplete      — { stats, namespace, summary, metadata }
 * @param {function} callbacks.onError         — { message }
 */
export const analyzeRepository = async (repoUrl, callbacks = {}) => {
  const response = await fetch(`${BASE_URL}/api/repo/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop(); // Keep incomplete last chunk

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        const handler = {
          status: callbacks.onStatus,
          start: callbacks.onStart,
          files_found: callbacks.onFilesFound,
          file: callbacks.onFile,
          vectors_upserted: callbacks.onVectorsUpserted,
          summary: callbacks.onSummary,
          complete: callbacks.onComplete,
          error: callbacks.onError,
        }[data.type];

        if (handler) handler(data);
      } catch {
        // Skip malformed SSE lines
      }
    }
  }
};

// ─── Chat (SSE Stream) ────────────────────────────────────────────────────────

/**
 * Sends a question and streams the AI response.
 *
 * @param {object} params
 * @param {string} params.question
 * @param {string} params.namespace
 * @param {object[]} params.conversationHistory
 * @param {object} params.settings
 * @param {object} callbacks
 * @param {function} callbacks.onChunk   — { content: string }
 * @param {function} callbacks.onDone    — { sources, fullAnswer }
 * @param {function} callbacks.onError   — { message }
 */
export const askQuestion = async (params, callbacks = {}) => {
  const response = await fetch(`${BASE_URL}/api/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "chunk"    && callbacks.onChunk)    callbacks.onChunk(data);
        if (data.type === "done"     && callbacks.onDone)     callbacks.onDone(data);
        if (data.type === "thinking" && callbacks.onThinking) callbacks.onThinking(data);
        if (data.type === "error"    && callbacks.onError)    callbacks.onError(data);
      } catch {
        // Skip malformed SSE lines
      }
    }
  }
};

// ─── Repo Management ──────────────────────────────────────────────────────────

export const getRepoStats = async (namespace) => {
  const res = await fetch(`${BASE_URL}/api/repo/stats/${namespace}`);
  if (!res.ok) throw new Error("Failed to fetch repo stats");
  return res.json();
};

export const deleteRepository = async (namespace) => {
  const res = await fetch(`${BASE_URL}/api/repo/${namespace}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete repository");
  return res.json();
};
