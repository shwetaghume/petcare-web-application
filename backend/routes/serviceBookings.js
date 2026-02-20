const express = require('express');
const router = express.Router();
const ServiceBooking = require('../models/ServiceBooking');

// Book a service
router.post('/', async (req, res) => {
  try {
    const booking = new ServiceBooking(req.body);
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all service bookings (admin)
router.get('/', async (req, res) => {
  try {
    const bookings = await ServiceBooking.find()
      .populate('user', 'name email')
      .populate('service', 'name category price duration');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;