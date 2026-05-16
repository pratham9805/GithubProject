/**
 * Repo Map Cache
 *
 * In-memory store for LLM-generated repo maps.
 * Keyed by Pinecone namespace.
 *
 * In production, replace with Redis or a database.
 */

const logger = require("./logger");

const _cache = new Map();

/**
 * Store a repo map for a namespace.
 * @param {string} namespace
 * @param {string} repoMap
 */
const setRepoMap = (namespace, repoMap) => {
  _cache.set(namespace, repoMap);
  logger.debug(`Repo map cached for namespace: ${namespace}`);
};

/**
 * Retrieve a repo map by namespace.
 * Returns null if not yet generated.
 * @param {string} namespace
 * @returns {string|null}
 */
const getRepoMap = (namespace) => {
  return _cache.get(namespace) || null;
};

/**
 * Clear a repo map (e.g. when repo is deleted).
 * @param {string} namespace
 */
const clearRepoMap = (namespace) => {
  _cache.delete(namespace);
};

module.exports = { setRepoMap, getRepoMap, clearRepoMap };
