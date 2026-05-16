/**
 * Request Validation Middleware
 * Validates incoming request bodies before they reach controllers.
 * Returns a 400 error immediately if validation fails.
 */

const { createError } = require("./errorHandler");

/** Validates that repoUrl is a proper GitHub URL */
const validateRepoUrl = (req, res, next) => {
  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== "string" || !repoUrl.trim()) {
    return next(createError("repoUrl is required", 400));
  }

  const trimmed = repoUrl.trim();
  const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

  if (!githubUrlPattern.test(trimmed)) {
    return next(
      createError(
        "Invalid GitHub URL. Expected format: https://github.com/owner/repo",
        400
      )
    );
  }

  // Normalise URL on req.body
  req.body.repoUrl = trimmed.replace(/\/$/, "");
  next();
};

/** Validates that a question is present and not too long */
const validateQuestion = (req, res, next) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return next(createError("question is required", 400));
  }

  if (question.trim().length > 2000) {
    return next(createError("Question is too long (max 2000 characters)", 400));
  }

  if (!req.body.namespace || typeof req.body.namespace !== "string") {
    return next(createError("namespace is required — analyze a repository first", 400));
  }

  req.body.question = question.trim();
  next();
};

module.exports = { validateRepoUrl, validateQuestion };
