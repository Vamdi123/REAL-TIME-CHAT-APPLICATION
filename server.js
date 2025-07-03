const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let onlineUsers = {}; 

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    onlineUsers[socket.id] = { username, room };

    const usersInRoom = Object.values(onlineUsers)
      .filter((u) => u.room === room)
      .map((u) => u.username);

    io.to(room).emit("online_users", usersInRoom);
  });

  socket.emit("send_message", messageData);

  socket.on("typing", (data) => {
    socket.to(data.room).emit("typing", data);
  });

  socket.on("disconnect", () => {
    const user = onlineUsers[socket.id];
    delete onlineUsers[socket.id];

    if (user?.room) {
      const usersInRoom = Object.values(onlineUsers)
        .filter((u) => u.room === user.room)
        .map((u) => u.username);

      io.to(user.room).emit("online_users", usersInRoom);
    }
  });
});

server.listen(3001, () => {
  console.log("✅ Server running at http://localhost:3001");
});
