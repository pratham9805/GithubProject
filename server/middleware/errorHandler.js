/**
 * Global Error Handler Middleware
 * Catches all errors passed via next(err) or thrown in asyncWrapper.
 * Returns structured JSON errors — no stack traces in production.
 */

const logger = require("../utils/logger");
const { env } = require("../config/env");

/**
 * Creates a structured error object.
 * @param {string} message
 * @param {number} [statusCode=500]
 */
const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Express global error handler — must have 4 parameters.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`[${req.method}] ${req.path} → ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler, createError };
