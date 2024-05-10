const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  idUser: { type: Number, required: true},
  idRoom: { type: Number, required: true},
  typeRoom:{type: Number, required: true},
  idReversation: {type: Number, required: true},
  rating:  { type: Number, required: true },
  comment: {type: String},
  timestamp: { type: Date, default: Date.now }
});

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
