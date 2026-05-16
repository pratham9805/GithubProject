/**
 * Pinecone Service
 * Namespace-aware vector database operations.
 */

const { getIndex } = require("../config/pinecone");
const logger = require("../utils/logger");

const UPSERT_BATCH_SIZE = 100;

// ─── Upsert ──────────────────────────────────────────────────────────────────

/**
 * Upserts vectors into a specific namespace in batches.
 * @param {object[]} vectors - Array of { id, values, metadata }
 * @param {string} namespace - Pinecone namespace (repo slug)
 */
const upsertVectors = async (vectors, namespace) => {
  if (!vectors || vectors.length === 0) return;

  const index = getIndex(); // base index
  const nsIndex = index.namespace(namespace);

  let upserted = 0;

  for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
    const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);

    await nsIndex.upsert({
      records: batch,
    });

    upserted += batch.length;
    logger.debug(`Upserted ${upserted}/${vectors.length}`);
  }

  logger.success(`Upsert complete: ${upserted} vectors in ${namespace}`);
  return upserted;
};

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * Queries a namespace for similar vectors.
 */
const queryNamespace = async (vector, namespace, topK = 5) => {
  const index = getIndex();
  const nsIndex = index.namespace(namespace);

  const result = await nsIndex.query({
    vector,
    topK,
    includeMetadata: true,
  });

  logger.debug(
    `Query returned ${result.matches?.length || 0} matches from '${namespace}'`
  );

  return result;
};

// ─── Namespace Stats ──────────────────────────────────────────────────────────

/**
 * Returns vector count in a namespace.
 */
const getNamespaceStats = async (namespace) => {
  try {
    const index = getIndex();

    const stats = await index.describeIndexStats();
    const nsData = stats.namespaces?.[namespace];

    return {
      vectorCount: nsData?.recordCount || 0,
      totalVectors: stats.totalRecordCount || 0,
    };
  } catch (error) {
    logger.error(`Could not fetch namespace stats: ${error.message}`);
    return { vectorCount: 0, totalVectors: 0 };
  }
};

// ─── Delete Namespace ─────────────────────────────────────────────────────────

/**
 * Deletes all vectors in a namespace.
 */
const deleteNamespace = async (namespace) => {
  try {
    const index = getIndex();
    const nsIndex = index.namespace(namespace);

    await nsIndex.deleteAll();

    logger.success(`Deleted all vectors in namespace '${namespace}'`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete namespace '${namespace}': ${error.message}`);
    throw error;
  }
};

module.exports = {
  upsertVectors,
  queryNamespace,
  getNamespaceStats,
  deleteNamespace,
};