import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminServiceBookings.css';

function AdminServiceBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axios.get('/api/service-bookings').then(res => setBookings(res.data));
  }, []);

  return (
    <div className="admin-service-bookings-container">
      <h2>Service Bookings</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Service</th>
            <th>Category</th>
            <th>Price</th>
            <th>Pet Name</th>
            <th>Pet Type</th>
            <th>Pet Age</th>
            <th>Pet Breed</th>
            <th>Timing</th>
            <th>Booked At</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b._id}>
              <td>{b.user?.name}</td>
              <td>{b.user?.email}</td>
              <td>{b.service?.name}</td>
              <td>{b.service?.category}</td>
              <td>₹{b.service?.price}</td>
              <td>{b.petName}</td>
              <td>{b.petType}</td>
              <td>{b.petAge}</td>
              <td>{b.petBreed}</td>
              <td>{b.timing ? new Date(b.timing).toLocaleString() : ''}</td>
              <td>{new Date(b.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminServiceBookings;