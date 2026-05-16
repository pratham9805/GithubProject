/**
 * GitHub Service
 * Fetches all indexable files from a GitHub repository recursively.
 * Uses the GitHub Contents API with authentication.
 *
 * Improvements over original:
 * - No arbitrary file limit (fetches ALL files)
 * - Expanded allowed extensions
 * - Retry on rate-limit (429) with exponential backoff
 * - Returns richer metadata per file
 */

const axios = require("axios");
const { env } = require("../config/env");
const logger = require("../utils/logger");

// All file extensions we want to index
const ALLOWED_EXTENSIONS = [
  // Web
  ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".scss", ".sass", ".less",
  // Backend
  ".py", ".go", ".java", ".rb", ".php", ".cs", ".cpp", ".c", ".rs", ".swift",
  // Config / DevOps
  ".json", ".yaml", ".yml", ".toml", ".ini", ".env.example", ".sh", ".bash",
  // Docs
  ".md", ".mdx", ".txt", ".rst",
  // Data
  ".graphql", ".sql",
];

const MAX_FILE_SIZE_BYTES = 500_000; // Skip files larger than 500 KB

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Makes an authenticated GitHub API GET request with retry on rate limit.
 * @param {string} url
 * @param {number} [retries=3]
 */
const githubGet = async (url, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        timeout: 20000,
      });
      return response;
    } catch (error) {
      const status = error.response?.status;

      if (status === 403 || status === 429) {
        // GitHub rate limit hit — wait and retry
        const retryAfter = parseInt(error.response?.headers?.["retry-after"] || "10", 10);
        const waitMs = retryAfter * 1000 * (attempt + 1);
        logger.warn(`GitHub rate limit hit. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${retries}`);
        await sleep(waitMs);
        continue;
      }

      if (status === 404) {
        throw new Error(`Repository not found. Check the URL and ensure your GitHub token has access.`);
      }

      throw error;
    }
  }
  throw new Error("GitHub API rate limit exceeded after retries. Try again later.");
};

/**
 * Recursively fetches all allowed files from a GitHub directory.
 * @param {string} url - GitHub Contents API URL for a directory
 * @param {string[]} allFiles - Accumulator array
 * @returns {Promise<object[]>}
 */
const getAllFiles = async (url, allFiles = []) => {
  try {
    const response = await githubGet(url);
    const items = response.data;

    for (const item of items) {
      if (item.type === "dir") {
        // Skip common large/non-code directories
        const skipDirs = ["node_modules", ".git", "dist", "build", ".next", "coverage", "vendor", "__pycache__", ".cache"];
        const dirName = item.name.toLowerCase();
        if (skipDirs.includes(dirName)) {
          logger.debug(`Skipping directory: ${item.path}`);
          continue;
        }
        await getAllFiles(item.url, allFiles);
      } else if (item.type === "file") {
        // Check extension
        const isAllowed = ALLOWED_EXTENSIONS.some((ext) =>
          item.name.toLowerCase().endsWith(ext)
        );

        // Skip oversized files
        if (item.size > MAX_FILE_SIZE_BYTES) {
          logger.debug(`Skipping large file: ${item.path} (${item.size} bytes)`);
          continue;
        }

        if (isAllowed && item.download_url) {
          allFiles.push({
            name: item.name,
            path: item.path,
            download_url: item.download_url,
            size: item.size,
            sha: item.sha,
          });
        }
      }
    }

    return allFiles;
  } catch (error) {
    logger.error(`Error fetching directory ${url}: ${error.message}`);
    return allFiles;
  }
};

/**
 * Fetches repository metadata (stars, description, language, etc.)
 * @param {string} owner
 * @param {string} repo
 */
const getRepoMetadata = async (owner, repo) => {
  try {
    const response = await githubGet(
      `https://api.github.com/repos/${owner}/${repo}`
    );
    const data = response.data;
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      updatedAt: data.updated_at,
      topics: data.topics || [],
      license: data.license?.name || null,
      isPrivate: data.private,
      htmlUrl: data.html_url,
    };
  } catch (error) {
    logger.warn(`Could not fetch repo metadata: ${error.message}`);
    return null;
  }
};

/**
 * Main entry point: fetches all indexable files from a repo URL.
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<object[]>} Array of file objects
 */
const getRepoContents = async (owner, repo) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
  logger.info(`Fetching repo contents: ${owner}/${repo}`);
  const files = await getAllFiles(apiUrl);
  logger.success(`Found ${files.length} indexable files in ${owner}/${repo}`);
  return files;
};

module.exports = { getRepoContents, getRepoMetadata };