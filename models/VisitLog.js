const mongoose = require('mongoose');

const VisitLogSchema = new mongoose.Schema({
  pageType: { type: String, required: true },
  ipAddress: { type: String, required: true },
  visitTime: { type: Date, default: Date.now },
  referrer: { type: String, default: 'Direct' },
  device: { type: String, default: 'Unknown' },
  browser: { type: String, default: 'Unknown' },
  location: {
    country: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
  },
});

module.exports = mongoose.model('VisitLog', VisitLogSchema);
