const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  xuid: { type: String, required: true },
  avatar: { type: String }, // Add avatar field
  searchCount: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("Player", playerSchema);
