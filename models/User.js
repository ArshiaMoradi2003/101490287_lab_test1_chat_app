const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    firstname: String,
    lastname: String,
    password: String,
    createdon: String
});

module.exports = mongoose.model("User", UserSchema);
