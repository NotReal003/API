const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema({
  serverClosed: { type: String, default: ''},
});

module.exports = mongoose.model('Server', ServerSchema);
