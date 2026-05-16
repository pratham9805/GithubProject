import Message from "./Message";

function ChatBox() {
  return (
    <div className="max-w-4xl mx-auto mt-12">
      <Message
        text="Hello! Ask me anything about your GitHub repository."
        isUser={false}
      />

      <Message
        text="How authentication works in this project?"
        isUser={true}
      />

      <Message
        text="This project uses JWT authentication middleware for user verification."
        isUser={false}
      />
    </div>
  );
}

export default ChatBox;