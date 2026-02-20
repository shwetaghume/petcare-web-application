const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  petName: String,
  petType: String,
  petAge: String,
  petBreed: String,
  timing: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);