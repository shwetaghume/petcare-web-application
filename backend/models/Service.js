const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: Number,
  duration: String,
  category: String,
});

module.exports = mongoose.model('Service', serviceSchema);