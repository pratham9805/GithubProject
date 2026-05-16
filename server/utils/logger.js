/**
 * Logger Utility
 * Simple structured logger using console with timestamps and log levels.
 * Keeps it dependency-free (no winston needed for this scale).
 */

const { env } = require("../config/env");

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL = env.NODE_ENV === "production" ? LOG_LEVELS.info : LOG_LEVELS.debug;

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  grey: "\x1b[90m",
  green: "\x1b[32m",
};

const timestamp = () => new Date().toISOString();

const format = (level, color, ...args) => {
  const prefix = `${colors.grey}[${timestamp()}]${colors.reset} ${color}[${level.toUpperCase()}]${colors.reset}`;
  return [prefix, ...args];
};

const logger = {
  error: (...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.error)
      console.error(...format("error", colors.red, ...args));
  },
  warn: (...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn)
      console.warn(...format("warn", colors.yellow, ...args));
  },
  info: (...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info)
      console.log(...format("info", colors.cyan, ...args));
  },
  debug: (...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug)
      console.log(...format("debug", colors.grey, ...args));
  },
  success: (...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info)
      console.log(...format("ok", colors.green, ...args));
  },
};

module.exports = logger;
