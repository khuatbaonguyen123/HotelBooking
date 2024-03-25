const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    idUser: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('messages', messageSchema);