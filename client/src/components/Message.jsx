function Message({ text, isUser }) {
  return (
    <div
      className={`max-w-3xl ${
        isUser ? "ml-auto bg-white text-black" : "mr-auto bg-[#111]"
      } px-5 py-4 rounded-2xl mb-4`}
    >
      <p>{text}</p>
    </div>
  );
}

export default Message;