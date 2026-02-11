const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// MongoDB connection with error handling
mongoose.connect("mongodb://127.0.0.1:27017/chatapp")
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use("/views", express.static("views"));

// Use auth routes
app.use(authRoutes);

// Socket.io connection handling
io.on("connection", socket => {
    console.log("User connected:", socket.id);

    // Join room
    socket.on("joinRoom", room => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on("leaveRoom", room => {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
    });

    // Handle chat messages
    socket.on("chatMessage", async data => {
        try {
            await GroupMessage.create(data);
            io.to(data.room).emit("message", data);
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    // Handle typing indicator
    socket.on("typing", data => {
        socket.to(data.room).emit("typing", data.username);
    });

    // Handle private messages (optional)
    socket.on("privateMessage", async data => {
        try {
            await PrivateMessage.create(data);
            io.to(data.to_user).emit("privateMessage", data);
        } catch (error) {
            console.error("Error saving private message:", error);
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

