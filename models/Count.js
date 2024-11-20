const mongoose = require('mongoose');

const countSchema = new mongoose.Schema({
  visits: { type: Number, default: 0 },
  pageType: { type: String, default: 'request' },
});

module.exports = mongoose.model('Count', countSchema);
