/**
 * Health Check Routes
 * GET /api/health — Returns overall service status.
 * Useful for monitoring and the frontend's settings panel.
 */

const router = require("express").Router();
const asyncWrapper = require("../middleware/asyncWrapper");
const openaiClient = require("../config/openai");
const { getIndex } = require("../config/pinecone");
const logger = require("../utils/logger");

router.get(
  "/",
  asyncWrapper(async (req, res) => {
    const results = { openai: "unknown", pinecone: "unknown", github: "ok" };

    // Check OpenAI
    try {
      await openaiClient.models.list({ limit: 1 });
      results.openai = "ok";
    } catch {
      results.openai = "error";
    }

    // Check Pinecone
    try {
      const index = getIndex();
      await index.describeIndexStats();
      results.pinecone = "ok";
    } catch {
      results.pinecone = "error";
    }

    const allHealthy = Object.values(results).every((v) => v === "ok");

    logger.info(`Health check: ${JSON.stringify(results)}`);

    res.status(allHealthy ? 200 : 207).json({
      success: allHealthy,
      status: allHealthy ? "healthy" : "degraded",
      services: results,
      timestamp: new Date().toISOString(),
    });
  })
);

module.exports = router;
