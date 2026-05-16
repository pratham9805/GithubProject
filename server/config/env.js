/**
 * Environment Configuration Validator
 * Validates all required environment variables at startup.
 * Throws a clear error if any required variable is missing.
 */

const REQUIRED_VARS = [
  "OPENAI_API_KEY",
  "PINECONE_API_KEY",
  "GITHUB_TOKEN",
];

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("\n❌  Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\n   Please copy server/.env.example → server/.env and fill in your keys.\n");
    process.exit(1);
  }
};

const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  // OpenAI model defaults (can be overridden per-request)
  DEFAULT_CHAT_MODEL: process.env.DEFAULT_CHAT_MODEL || "gpt-4.1-mini",
  DEFAULT_EMBEDDING_MODEL: process.env.DEFAULT_EMBEDDING_MODEL || "text-embedding-3-small",
  // Pinecone
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || "github-qa-bot",
};

module.exports = { validateEnv, env };
