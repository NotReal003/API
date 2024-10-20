const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  id: { type: String, required: true },
  reviewed: { type: String, enum: ['true', 'false'], default: 'false' },
  username: { type: String, required: false },
  type: { type: String, required: true },
  messageLink: { type: String, required: true },
  reviewMessage: { type: String, default: '' },
  additionalInfo: { type: String },
  status: { type: String, enum: ['APPROVED', 'DENIED', 'PENDING', 'CANCELLED', 'RESOLVED'], default: 'PENDING' },
  typeName: { type: String },
  inGameName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
