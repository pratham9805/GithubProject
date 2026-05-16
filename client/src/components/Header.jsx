function Header() {
  return (
    <div className="w-full border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-white">
        GitHub QA Bot
      </h1>

      <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:scale-105 transition">
        New Chat
      </button>
    </div>
  );
}

export default Header;