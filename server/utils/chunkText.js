/**
 * Smart Code Chunker
 *
 * Implements structure-aware chunking that:
 * 1. Detects language from file extension
 * 2. Splits by function/class boundaries for code files
 * 3. Uses paragraph-aware splitting for prose/markdown
 * 4. Preserves file path + header context in every chunk
 * 5. Adds overlap between chunks for continuity
 *
 * Each returned chunk is a rich object (not just a string):
 *   { text, header, startLine, chunkIndex, language, type }
 */

const DEFAULT_CHUNK_SIZE = 2800; // chars ≈ 700 tokens
const DEFAULT_OVERLAP    = 180;  // chars carried into next chunk

// ── Language detection by extension ─────────────────────────────────────────

const LANG_MAP = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", go: "go", java: "java", rb: "ruby", php: "php",
  cs: "csharp", cpp: "cpp", c: "c", rs: "rust", swift: "swift",
  sh: "bash", bash: "bash",
  md: "markdown", mdx: "markdown", txt: "text", rst: "text",
  json: "json", yaml: "yaml", yml: "yaml", toml: "toml",
  html: "html", css: "css", scss: "css",
  graphql: "graphql", sql: "sql",
};

const getLanguage = (filePath = "") => {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || "text";
};

// ── Code-aware split patterns ────────────────────────────────────────────────

/**
 * Returns regex patterns for splitting code into logical blocks.
 * Each pattern marks the START of a new semantic unit.
 */
const getCodeSplitPatterns = (language) => {
  switch (language) {
    case "javascript":
    case "typescript":
      return [
        // ES6 export functions/classes
        /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+\w+/m,
        /^(?:export\s+(?:default\s+)?)?class\s+\w+/m,
        /^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?\(/m,
        /^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?\w+\s*=>/m,
        // React component
        /^(?:export\s+(?:default\s+)?)?function\s+[A-Z]\w*/m,
        // Method definitions
        /^\s{0,4}(?:async\s+)?\w+\s*\([^)]*\)\s*\{/m,
      ];
    case "python":
      return [
        /^(?:async\s+)?def\s+\w+/m,
        /^class\s+\w+/m,
        /^@\w+/m, // decorators
      ];
    case "go":
      return [
        /^func\s+(?:\(\w+\s+\*?\w+\)\s*)?\w+/m,
        /^type\s+\w+\s+(?:struct|interface)/m,
      ];
    case "java":
    case "csharp":
      return [
        /^\s{0,8}(?:public|private|protected|static|abstract|override)[\s\w<>[\]]+\s+\w+\s*\(/m,
        /^\s{0,4}(?:public|private|protected)?\s*class\s+\w+/m,
        /^\s{0,4}(?:public|private|protected)?\s*interface\s+\w+/m,
      ];
    case "ruby":
      return [/^def\s+\w+/m, /^class\s+\w+/m, /^module\s+\w+/m];
    default:
      return null; // fall back to paragraph-based splitting
  }
};

// ── Core splitting logic ─────────────────────────────────────────────────────

/**
 * Splits a string into chunks using pattern-based boundaries.
 * @param {string} text
 * @param {RegExp[]} patterns - list of patterns that mark block starts
 * @param {number} chunkSize
 * @param {number} overlap
 * @returns {string[]}
 */
const splitByPatterns = (text, patterns, chunkSize, overlap) => {
  // Build a combined pattern that matches any boundary line
  const combined = new RegExp(
    patterns.map((p) => p.source).join("|"),
    "m"
  );

  const lines = text.split("\n");
  const blocks = [];
  let currentBlock = [];

  for (const line of lines) {
    if (combined.test(line) && currentBlock.length > 0) {
      blocks.push(currentBlock.join("\n"));
      // Carry last few lines as overlap into next block
      const overlapLines = currentBlock.slice(-3);
      currentBlock = [...overlapLines, line];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock.join("\n"));

  // Merge very small blocks and split very large ones
  const result = [];
  let pending = "";

  for (const block of blocks) {
    const candidate = pending ? pending + "\n\n" + block : block;
    if (candidate.length <= chunkSize) {
      pending = candidate;
    } else {
      if (pending.trim()) result.push(pending.trim());
      // If single block is too large, fall back to paragraph split
      if (block.length > chunkSize) {
        const sub = splitByParagraphs(block, chunkSize, overlap);
        result.push(...sub);
        pending = "";
      } else {
        pending = block;
      }
    }
  }
  if (pending.trim()) result.push(pending.trim());

  return result;
};

/**
 * Paragraph-aware recursive splitter (fallback).
 */
const splitByParagraphs = (text, chunkSize, overlap) => {
  if (!text || text.trim().length === 0) return [];

  const chunks = [];
  const separators = ["\n\n", "\n", " ", ""];

  const splitRecursive = (str, sepIdx) => {
    if (str.length <= chunkSize) {
      if (str.trim().length > 10) chunks.push(str.trim());
      return;
    }

    const sep = separators[sepIdx];
    if (sep === "") {
      for (let i = 0; i < str.length; i += chunkSize - overlap) {
        const sl = str.slice(i, i + chunkSize);
        if (sl.trim()) chunks.push(sl.trim());
      }
      return;
    }

    const parts = str.split(sep);
    let current = "";

    for (const part of parts) {
      const candidate = current ? current + sep + part : part;
      if (candidate.length <= chunkSize) {
        current = candidate;
      } else {
        if (current.trim()) {
          current.length <= chunkSize
            ? chunks.push(current.trim())
            : splitRecursive(current, sepIdx + 1);
        }
        const overlapText = current.slice(-overlap);
        current = overlapText ? overlapText + sep + part : part;
      }
    }
    if (current.trim()) {
      current.length <= chunkSize
        ? chunks.push(current.trim())
        : splitRecursive(current, sepIdx + 1);
    }
  };

  splitRecursive(text, 0);
  return chunks.filter((c) => c.length > 10);
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main chunking function.
 * Returns rich chunk objects with full context header.
 *
 * @param {string} content - Raw file content
 * @param {string} filePath - e.g. "src/utils/auth.js"
 * @param {string} repoName - e.g. "owner/repo"
 * @param {object} [options]
 * @param {number} [options.chunkSize]
 * @param {number} [options.overlap]
 * @returns {{ text: string, header: string, language: string, chunkIndex: number }[]}
 */
const chunkFile = (content, filePath = "", repoName = "", options = {}) => {
  const { chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP } = options;

  if (!content || content.trim().length === 0) return [];

  const language = getLanguage(filePath);
  const patterns = getCodeSplitPatterns(language);

  // Choose splitting strategy
  let rawChunks;
  const isCodeFile = !["markdown", "text", "json", "yaml", "toml"].includes(language);

  if (isCodeFile && patterns) {
    rawChunks = splitByPatterns(content, patterns, chunkSize, overlap);
  } else {
    rawChunks = splitByParagraphs(content, chunkSize, overlap);
  }

  // Prefix every chunk with a rich context header
  const header = `[Repository: ${repoName}] [File: ${filePath}] [Language: ${language}]`;

  return rawChunks.map((text, idx) => ({
    text,
    header,
    language,
    chunkIndex: idx,
    // Full text that gets embedded = header + body
    embeddingText: `${header}\n\n${text}`,
  }));
};

// ── Backward-compat export (plain text array) ─────────────────────────────────
/**
 * Legacy wrapper — returns plain string array (used by old code).
 * New code should call chunkFile() for rich objects.
 */
const chunkText = (text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP) => {
  const chunks = splitByParagraphs(text, chunkSize, overlap);
  return chunks;
};

module.exports = { chunkFile, chunkText, getLanguage };