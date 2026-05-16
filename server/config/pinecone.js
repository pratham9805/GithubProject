/**
 * Pinecone Client Singleton
 * Provides the Pinecone client and a helper to get a namespace-scoped index.
 */

const { Pinecone } = require("@pinecone-database/pinecone");
const { env } = require("./env");

// Create a single Pinecone client instance
const pineconeClient = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

/**
 * Returns the Pinecone index. Optionally scoped to a namespace.
 * @param {string} [namespace] - Pinecone namespace (one per repo)
 */
const getIndex = (namespace) => {
  const index = pineconeClient.Index(env.PINECONE_INDEX_NAME);
  if (namespace) {
    return index.namespace(namespace);
  }
  return index;
};

module.exports = { pineconeClient, getIndex };
