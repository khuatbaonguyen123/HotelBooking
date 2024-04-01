const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    idUser: String,
    role: Number,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('messages', messageSchema);

//true
// const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema({
//     senderId: String,   
//     receiverId: String, 
//     content: String,
//     timestamp: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('messages', messageSchema);
