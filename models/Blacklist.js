const mongoose = require('mongoose');

const BlacklistSchema = new mongoose.Schema({
  
  blacklistToken: { type: String },

module.exports = mongoose.model('Blacklist', BlacklistSchema);
