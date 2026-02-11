const socket = io();
const user = JSON.parse(localStorage.getItem("user"));

function joinRoom(room) {
    socket.emit("joinRoom", room);
}

function sendMessage(room, msg) {
    socket.emit("chatMessage", {
        from_user: user.username,
        room,
        message: msg
    });
}

socket.on("message", data => {
    console.log(data);
});

socket.on("typing", username => {
    console.log(username + " is typing...");
});
