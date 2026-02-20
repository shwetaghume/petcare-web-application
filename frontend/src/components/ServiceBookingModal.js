import React, { useState } from 'react';
import axios from 'axios';
import './Modal.css';

function ServiceBookingModal({ service, onClose }) {
  const [form, setForm] = useState({
    petName: '',
    petType: '',
    petAge: '',
    petBreed: '',
    timing: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [bookedTiming, setBookedTiming] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?._id || user?.id;
    if (!userId) {
      setError('You must be logged in to book a service.');
      return;
    }
    try {
      await axios.post('/api/service-bookings', {
        ...form,
        service: service._id,
        user: userId
      });
      setBookedTiming(form.timing);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    }
  };

  // Format the timing for display
  const formatTiming = (timing) => {
    if (!timing) return '';
    const date = new Date(timing);
    return date.toLocaleString();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Book Service: {service.name}</h2>
        <div className="service-details">
          <p><b>Service:</b> {service.name}</p>
          <p><b>Duration:</b> {service.duration}</p>
          <p><b>Price:</b> ₹{service.price}</p>
          <p><b>Category:</b> {service.category}</p>
        </div>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        {success ? (
          <div className="success-message">
            Booking successful!<br/>
            {bookedTiming && (
              <span>Booked for: <b>{formatTiming(bookedTiming)}</b></span>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="booking-form">
            <label>
              Pet Name *
              <input name="petName" value={form.petName} onChange={handleChange} required />
            </label>
            <label>
              Pet Type *
              <select name="petType" value={form.petType} onChange={handleChange} required>
                <option value="">Select pet type</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Pet Age *
              <input name="petAge" value={form.petAge} onChange={handleChange} required />
            </label>
            <label>
              Pet Breed
              <input name="petBreed" value={form.petBreed} onChange={handleChange} />
            </label>
            <label>
              Preferred Timing *
              <input name="timing" type="datetime-local" value={form.timing} onChange={handleChange} required />
            </label>
            <button type="submit" className="book-btn">Book Now</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ServiceBookingModal;