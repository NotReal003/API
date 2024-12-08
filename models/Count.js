const mongoose = require('mongoose');

const CountSchema = new mongoose.Schema({
  pageType: { type: String, required: true },
  visits: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  lastVisit: { type: Date, default: null },
  averageVisitDuration: { type: Number, default: 0 },
  dailyVisits: { type: Map, of: Number, default: {} },
  weeklyVisits: { type: Map, of: Number, default: {} },
  monthlyVisits: { type: Map, of: Number, default: {} },
  referrerStats: { type: Map, of: Number, default: {} },
  deviceStats: { type: Map, of: Number, default: {} },
  browserStats: { type: Map, of: Number, default: {} },
});

module.exports = mongoose.model('Count', CountSchema);
