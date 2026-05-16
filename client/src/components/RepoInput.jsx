import { useState } from "react";
import axios from "axios";

function RepoInput() {
  const [repoUrl, setRepoUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  // Analyze repository
  const handleAnalyze = async () => {
    try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/analyze",
        {
          repoUrl,
        }
      );

      alert("Repository analyzed successfully!");
    } catch (error) {
      console.log(error);
      alert("Analyze failed");
    } finally {
      setLoading(false);
    }
  };

  // Ask question
  const handleAsk = async () => {
    try {
      if (!question.trim()) {
        alert("Enter a question");
        return;
      }

      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/ask",
        {
          question,
        }
      );

      console.log(response.data);

      setAnswer(response.data.answer);
    } catch (error) {
      console.log(error);

      alert("Question failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 text-white px-4">
      <h1 className="text-5xl font-bold text-center mb-10">
        GitHub QA Bot
      </h1>

      {/* Repo Input */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Paste GitHub repository URL..."
          value={repoUrl}
          onChange={(e) =>
            setRepoUrl(e.target.value)
          }
          className="flex-1 px-5 py-4 rounded-xl bg-[#111] border border-gray-700 outline-none"
        />

        <button
          onClick={handleAnalyze}
          className="bg-white text-black px-6 rounded-xl font-semibold"
        >
          {loading ? "Loading..." : "Analyze"}
        </button>
      </div>

      {/* Question Input */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Ask question about repository..."
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          className="flex-1 px-5 py-4 rounded-xl bg-[#111] border border-gray-700 outline-none"
        />

        <button
          onClick={handleAsk}
          className="bg-blue-500 px-6 rounded-xl font-semibold"
        >
          Ask
        </button>
      </div>

      {/* AI Answer */}
      {answer && (
        <div className="bg-[#111] border border-gray-700 p-6 rounded-2xl whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}

export default RepoInput;