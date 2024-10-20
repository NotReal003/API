const mongoose = require('mongoose');

const BuserSchema = new mongoose.Schema({
  user_id: { type: String, unique: true },
  blocked: { type: String, default: 'NO' },
  reason: { type: String, default: '' },
});

module.exports = mongoose.model('Buser', BuserSchema);
