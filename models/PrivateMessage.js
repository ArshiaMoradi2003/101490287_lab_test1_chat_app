const mongoose = require("mongoose");

const PrivateMessageSchema = new mongoose.Schema({
    from_user: String,
    to_user: String,
    message: String,
    date_sent: String
});

module.exports = mongoose.model("PrivateMessage", PrivateMessageSchema);
