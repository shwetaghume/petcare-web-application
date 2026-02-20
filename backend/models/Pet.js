const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Dog', 'Cat', 'Bird', 'Fish', 'Small Animal', 'Other']
  },
  breed: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  size: {
    type: String,
    required: true,
    enum: ['Small', 'Medium', 'Large']
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: function() {
      return this.isNew; // Only required when creating a new pet
    }
  },
  healthStatus: {
    type: String,
    required: true,
    enum: ['Healthy', 'Under Treatment', 'Special Needs']
  },
  isAdopted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pet', petSchema); 