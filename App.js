import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import "./App.css";

const socket = io("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room] = useState("global");
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  const [joined, setJoined] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const joinRoom = () => {
    if (username.trim() !== "") {
      socket.emit("join_room", { username, room });
      setJoined(true);
    }
  };

  const sendMessage = () => {
  if (currentMessage.trim() !== "") {
    const messageData = {
      room,
      author: username,
      message: currentMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
    socket.emit("send_message", messageData);
    setCurrentMessage("");
    setShowEmoji(false);
  }
};


  const handleTyping = () => {
    socket.emit("typing", { username, room });
  };

  const leaveChat = () => {
    window.location.reload();
  };

  const addEmoji = (emoji) => {
    setCurrentMessage((prev) => prev + emoji.native);
  };

  useEffect(() => {
    if (joined) {
      socket.on("receive_message", (data) => {
        setMessageList((prev) => [...prev, data]);
      });

      socket.on("typing", (data) => {
        setTypingStatus(`${data.username} is typing...`);
        setTimeout(() => setTypingStatus(""), 2000);
      });

      socket.on("online_users", (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socket.off("receive_message");
        socket.off("typing");
        socket.off("online_users");
      };
    }
  }, [joined]);

  return (
    <div className="App">
      {!joined ? (
        <div className="join-container">
          <div className="join-box">
            <h1>👋 Welcome to Group Chat</h1>
            <input
              type="text"
              placeholder="Enter your name"
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={joinRoom}>Join</button>
          </div>
        </div>
      ) : (
        <div className="chat-container">
          <header>
            💬 Room: {room}
            <button className="leave-btn" onClick={leaveChat}>
              Leave
            </button>
          </header>

          <div className="online-users">
            🟢 Online: {onlineUsers.length > 0 ? onlineUsers.join(", ") : "None"}
          </div>

          <div className="chat-box">
            <div className="messages">
              {messageList.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${msg.author === username ? "self" : ""}`}
                >
                  <div className="message-meta">
                    <b>{msg.author}</b> 🕒 {msg.time}
                  </div>
                  <div className="message-text">{msg.message}</div>
                </div>
              ))}
              {typingStatus && <div className="typing">{typingStatus}</div>}
            </div>

            <div className="input-area">
              <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>
              {showEmoji && (
                <div className="emoji-picker">
                  <Picker data={data} onEmojiSelect={addEmoji} />
                </div>
              )}
              <input
                type="text"
                value={currentMessage}
                placeholder="Type a message..."
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                  handleTyping();
                }}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
