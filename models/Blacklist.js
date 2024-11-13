const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  blacklistToken: { type: String },
});

module.exports = mongoose.model('Blacklist', BlacklistSchema);
