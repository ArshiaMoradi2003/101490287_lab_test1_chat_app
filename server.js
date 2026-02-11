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

// Store connected users: { username: socketId }
const connectedUsers = new Map();

// Socket.io connection handling
io.on("connection", socket => {
    console.log("User connected:", socket.id);

    // User joins with their username
    socket.on("userJoin", username => {
        connectedUsers.set(username, socket.id);
        socket.username = username;
        console.log(`User ${username} connected with socket ${socket.id}`);
    });

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
            // Add formatted date
            const messageData = {
                ...data,
                date_sent: new Date().toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            };
            await GroupMessage.create(messageData);
            io.to(data.room).emit("message", messageData);
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    // Handle typing indicator
    socket.on("typing", data => {
        socket.to(data.room).emit("typing", data.username);
    });

    // Handle private messages
    socket.on("privateMessage", async data => {
        try {
            // Add formatted date
            const messageData = {
                ...data,
                date_sent: new Date().toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            };
            
            // Save to database
            await PrivateMessage.create(messageData);
            
            // Get recipient's socket ID
            const recipientSocketId = connectedUsers.get(data.to_user);
            
            if (recipientSocketId) {
                // Send to recipient
                io.to(recipientSocketId).emit("privateMessage", messageData);
                console.log(`Private message sent from ${data.from_user} to ${data.to_user}`);
            } else {
                // Recipient is offline, message saved in DB
                console.log(`User ${data.to_user} is offline. Message saved to database.`);
                socket.emit("messageStatus", { 
                    success: false, 
                    message: `${data.to_user} is currently offline. Message saved.` 
                });
            }
        } catch (error) {
            console.error("Error saving private message:", error);
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        if (socket.username) {
            connectedUsers.delete(socket.username);
            console.log(`User ${socket.username} disconnected`);
        }
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


