const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema({
    from_user: String,
    room: String,
    message: String,
    date_sent: String
});

module.exports = mongoose.model("GroupMessage", GroupMessageSchema);
