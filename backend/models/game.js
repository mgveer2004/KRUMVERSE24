const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  
  genre: String,
  
  category: {
    type: String,
    enum: ['MOBA', 'FPS', 'Fighting', 'Racing', 'Card', 'Strategy', 'Other'],
    default: 'Other'
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/400x200?text=Game'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', gameSchema);
