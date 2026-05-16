/**
 * Repository Routes
 * All routes related to repository ingestion and management.
 */

const router = require("express").Router();
const { analyzeRepo, getRepoStats, deleteRepo } = require("../controllers/repoController");
const { validateRepoUrl } = require("../middleware/validateRequest");
const { analyzeLimiter } = require("../middleware/rateLimiter");

// POST /api/repo/analyze — Ingest a repository (SSE stream)
router.post("/analyze", analyzeLimiter, validateRepoUrl, analyzeRepo);

// GET /api/repo/stats/:namespace — Get vector count for a repo
router.get("/stats/:namespace", getRepoStats);

// DELETE /api/repo/:namespace — Remove a repo from the index
router.delete("/:namespace", deleteRepo);

module.exports = router;
