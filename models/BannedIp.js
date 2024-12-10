const mongoose = require('mongoose');

const bannedIpSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true, unique: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } //
});

module.exports = mongoose.model('BannedIP', bannedIpSchema);
