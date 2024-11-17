const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  blacklistToken: { type: String },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
