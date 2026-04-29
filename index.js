const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");

const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("start");
});

app.post("/home", (req, res) => {
  const usrnm = req.body.name;
  const room = req.body.room;

  res.render("home", { usrnm, room });
});

const users = {};
const typingUsers = {};

io.on("connection", (socket) => {
  socket.on("join-room", ({ username, room }) => {
    socket.username = username;
    socket.room = room;

    socket.join(room);

    if (!users[room]) users[room] = [];
    users[room].push(username);

    if (!typingUsers[room]) typingUsers[room] = new Set();

    io.to(room).emit("room-users", users[room]);

    socket.to(room).emit("user-connected", `${username} joined`);
  });

  socket.on("chat message", (msg) => {
    io.to(socket.room).emit("chat message", {
      user: socket.username,
      message: msg,
    });
  });

  // 🔥 FIXED TYPING
  socket.on("typing", () => {
    typingUsers[socket.room].add(socket.username);
    socket.to(socket.room).emit("typing", socket.username);
  });

  socket.on("stop-typing", () => {
    typingUsers[socket.room].delete(socket.username);
    socket.to(socket.room).emit("stop-typing", socket.username);
  });

  socket.to(socket.room).emit("user-connected", `${socket.username} joined room ${socket.room}`);

  socket.to(socket.room)
    .emit("user-disconnected", `${socket.username} left room ${socket.room}`);
  socket.on("disconnect", () => {
    if (socket.room) {
      users[socket.room] = users[socket.room].filter(
        (u) => u !== socket.username,
      );
      typingUsers[socket.room].delete(socket.username);

      io.to(socket.room).emit("room-users", users[socket.room]);

      socket
        .to(socket.room)
        .emit("user-disconnected", `${socket.username} left`);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
