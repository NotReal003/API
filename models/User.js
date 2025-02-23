const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, unique: false },
  username: { type: String, required: true },
  avatarHash: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  displayName: { type: String, defualt: '' },
  verificationCode: { type: String },  //
  verificationCodeExpires: { type: Date },
  status: { type: String, defualt: '' },
  joinedAt: { type: Date, default: Date.now },
  staff: { type: Boolean, default: false },
  admin: { type: Boolean, default: false },
  owner: { type: Boolean, default: false },
  authType: { type: String, defualt: '' },
  ip: { type: String, default: '' },
  device: { type: String, default: '' },
});

module.exports = mongoose.model('User', UserSchema);
