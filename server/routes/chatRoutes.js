/**
 * Chat Routes
 * All routes related to AI Q&A.
 */

const router = require("express").Router();
const { askQuestion } = require("../controllers/chatController");
const { validateQuestion } = require("../middleware/validateRequest");
const { chatLimiter } = require("../middleware/rateLimiter");

// POST /api/chat/ask — Ask a question (SSE stream)
router.post("/ask", chatLimiter, validateQuestion, askQuestion);

module.exports = router;
