/**
 * Namespace Slug Utility
 * Converts a GitHub repository URL into a deterministic Pinecone namespace.
 * Example: "https://github.com/facebook/react" → "facebook-react"
 */

/**
 * @param {string} repoUrl - Full GitHub repository URL
 * @returns {string} Sanitized namespace slug (e.g., "owner-repo")
 */
const getNamespaceFromUrl = (repoUrl) => {
  try {
    const clean = repoUrl.trim().replace(/\/$/, "");
    const parts = clean.split("/");
    const owner = parts[3];
    const repo = parts[4];

    if (!owner || !repo) {
      throw new Error("Could not extract owner/repo from URL");
    }

    // Sanitize: lowercase, replace non-alphanumeric with dash
    const slug = `${owner}-${repo}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 45); // Pinecone namespace max length

    return slug;
  } catch {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }
};

/**
 * Extracts owner and repo name from URL
 * @param {string} repoUrl
 * @returns {{ owner: string, repo: string }}
 */
const parseRepoUrl = (repoUrl) => {
  const clean = repoUrl.trim().replace(/\/$/, "");
  const parts = clean.split("/");
  const owner = parts[3];
  const repo = parts[4];

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL format. Expected: https://github.com/owner/repo");
  }

  return { owner, repo };
};

module.exports = { getNamespaceFromUrl, parseRepoUrl };
