import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminServices.css';

function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', category: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const res = await axios.get('/api/services');
    setServices(res.data);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/services', form);
      setSuccess('Service added successfully!');
      setForm({ name: '', description: '', price: '', duration: '', category: '' });
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add service.');
    }
  };

  return (
    <div className="admin-services-container">
      <h2>Manage Services</h2>
      <form onSubmit={handleSubmit} className="admin-service-form">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Service Name" required />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" required />
        <input name="duration" value={form.duration} onChange={handleChange} placeholder="Duration" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
        <button type="submit">Add Service</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      <h3>All Services</h3>
      <ul>
        {services.map(service => (
          <li key={service._id}>
            <b>{service.name}</b> - {service.category} - ₹{service.price} - {service.duration}
            <br />{service.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminServices;