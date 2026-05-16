/**
 * Server Entry Point
 * Configures middleware, routes, error handling, and starts the HTTP server.
 */

// ⚠️  MUST be first — loads .env before any config module reads process.env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");

// ─── Route Imports ─────────────────────────────────────────────────────────────
const repoRoutes = require("./routes/repoRoutes");
const chatRoutes = require("./routes/chatRoutes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

// ─── Security & Performance Middleware ────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
// Compression — explicitly disabled for SSE routes (text/event-stream).
// gzip would buffer the entire stream before sending, breaking streaming UX.
app.use(
  compression({
    filter: (req, res) => {
      // Skip compression for Server-Sent Events
      if (req.path.includes("/chat/ask") || req.path.includes("/repo/analyze")) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─── General Rate Limiter ──────────────────────────────────────────────────────
app.use("/api", generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/repo", repoRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/health", healthRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "GitHub QA Bot API",
    version: "2.0.0",
    status: "running",
    docs: {
      analyze: "POST /api/repo/analyze",
      ask: "POST /api/chat/ask",
      health: "GET /api/health",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

const { env } = require("./config/env");
const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  logger.success(`\n🚀 GitHub QA Bot API running on http://localhost:${PORT}`);
  logger.info(`   Environment : ${env.NODE_ENV}`);
  logger.info(`   Health check: http://localhost:${PORT}/api/health`);
  logger.info(`   Analyze     : POST http://localhost:${PORT}/api/repo/analyze`);
  logger.info(`   Ask         : POST http://localhost:${PORT}/api/chat/ask\n`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err.message);
  process.exit(1);
});
