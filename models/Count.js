const mongoose = require('mongoose');

const CountSchema = new mongoose.Schema({
  pageType: { type: String, required: true, unique: true },
  visits: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  deviceStats: { type: Map, of: Number, default: {} },
  browserStats: { type: Map, of: Number, default: {} },
  referrerStats: { type: Map, of: Number, default: {} },
  dailyVisits: { type: Map, of: Number, default: {} },
});

module.exports = mongoose.model('Count', CountSchema);
