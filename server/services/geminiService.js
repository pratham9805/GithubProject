const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

// Chat model
const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Generate AI response
const askGemini = async (prompt) => {
  try {
    const result = await chatModel.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.log(error.message);

    return "Something went wrong";
  }
};

// Generate embeddings
const createEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const result = await model.embedContent(text);

    return result.embedding.values;
  } catch (error) {
    console.log(error.message);

    return [];
  }
};

module.exports = {
  askGemini,
  createEmbedding,
};