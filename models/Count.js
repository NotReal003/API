const mongoose = require('mongoose');

const CountSchema = new mongoose.Schema({
  pageType: { type: String, required: true, unique: true },
  totalVisits: { type: Number, default: 0 },
  dailyVisits: { type: Map, of: Number, default: {} },
  weeklyVisits: { type: Number, default: 0 },
  monthlyVisits: { type: Number, default: 0 },
});

module.exports = mongoose.model('Count', CountSchema);
