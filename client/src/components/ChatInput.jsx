function ChatInput() {
  return (
    <div className="fixed bottom-0 left-0 w-full border-t border-gray-800 bg-black/70 backdrop-blur-lg p-4">
      <div className="max-w-4xl mx-auto flex gap-3">
        <input
          type="text"
          placeholder="Ask a question..."
          className="flex-1 bg-[#111] border border-gray-700 rounded-xl px-5 py-4 text-white outline-none"
        />

        <button className="bg-white text-black px-6 rounded-xl font-semibold hover:scale-105 transition">
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInput;