const mongoose = require('mongoose');

const VisitLogSchema = new mongoose.Schema({
  pageType: { type: String, required: true },
  ip: { type: String, required: true }, // IP address of the visitor
  timestamp: { type: Date, default: Date.now }, // Exact time of visit
  referrer: { type: String, default: 'Direct' }, //
  deviceType: { type: String, default: 'Unknown' }, //
  browserName: { type: String, default: 'Unknown' }, //
  location: {
    country: { type: String, default: 'Unknown' }, //
    city: { type: String, default: 'Unknown' }, //
  },
  visitDuration: { type: Number, default: 0 },
});

module.exports = mongoose.model('VisitLog', VisitLogSchema);
