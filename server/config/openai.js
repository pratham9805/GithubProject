/**
 * OpenAI Client Singleton
 * Initialised once at startup. Import this wherever OpenAI is needed.
 */

const OpenAI = require("openai");
const { env } = require("./env");

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

module.exports = openaiClient;
