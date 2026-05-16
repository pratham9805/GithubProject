/**
 * Rate Limiter Middleware
 * Protects expensive endpoints (analyze, ask) from abuse.
 * Uses express-rate-limit — install with: npm install express-rate-limit
 */

const rateLimit = require("express-rate-limit");

/** General API limiter — 200 requests per 15 minutes */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please wait a few minutes and try again.",
  },
});

/** Strict limiter for repo ingestion — 10 analyses per 15 minutes */
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many repository analyses. Please wait before analyzing another repository.",
  },
});

/** Chat limiter — 60 questions per 15 minutes */
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many questions. Please slow down.",
  },
});

module.exports = { generalLimiter, analyzeLimiter, chatLimiter };
