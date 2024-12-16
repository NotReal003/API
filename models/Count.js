const mongoose = require('mongoose');

const CountSchema = new mongoose.Schema({
  pageType: { type: String, required: true },
  totalVisits: { type: Number, default: 0 },
  dailyVisits: { type: Map, of: Number, default: {} }, // date (YYYY-MM-DD), Value: count
  weeklyVisits: { type: Map, of: Number, default: {} }, // Week Start (YYYY-MM-DD), Value: count
  monthlyVisits: { type: Map, of: Number, default: {} }, //
});

const Count = mongoose.model('Count', CountSchema);
