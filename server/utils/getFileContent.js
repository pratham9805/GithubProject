/**
 * File Content Fetcher
 * Downloads raw file content from a GitHub download_url.
 * Adds timeout, skips binary files, and validates content type.
 */

const axios = require("axios");

// File extensions we consider "binary" and should skip
const BINARY_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp",
  ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z",
  ".mp3", ".mp4", ".wav", ".mov", ".avi",
  ".ttf", ".woff", ".woff2", ".eot",
  ".pyc", ".class", ".o", ".so", ".dll", ".exe",
  ".lock",
];

/**
 * Returns true if the file is binary based on its extension.
 * @param {string} fileName
 */
const isBinaryFile = (fileName) => {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
};

/**
 * Fetches the raw text content of a file from a URL.
 * @param {string} downloadUrl
 * @param {string} [fileName] - Used to pre-screen binary files
 * @returns {Promise<string>} File content or empty string
 */
const getFileContent = async (downloadUrl, fileName = "") => {
  try {
    if (!downloadUrl) return "";
    if (fileName && isBinaryFile(fileName)) return "";

    const response = await axios.get(downloadUrl, {
      timeout: 15000, // 15-second timeout per file
      responseType: "text",
      headers: {
        Accept: "application/vnd.github.v3.raw",
      },
    });

    // Guard: if the response is not a string (e.g., binary object), skip
    if (typeof response.data !== "string") return "";

    return response.data;
  } catch (error) {
    // Don't throw — just skip files that can't be fetched
    return "";
  }
};

module.exports = { getFileContent, isBinaryFile };