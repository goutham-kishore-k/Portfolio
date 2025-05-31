import React, { useState } from 'react';

const ChatBot = () => {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const newChat = [...chat, { type: "user", text: input }];
    setChat(newChat);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();
    setChat([...newChat, { type: "bot", text: data.reply }]);
  };

  return (
    <div style={{ padding: 10 }}>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {chat.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.type === "user" ? "right" : "left" }}>
            <strong>{msg.type === "user" ? "You" : "Bot"}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me something..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatBot;
