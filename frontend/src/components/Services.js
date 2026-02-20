import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ServiceBookingModal from './ServiceBookingModal';
import './Services.css';

function Services() {
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    axios.get('/api/services').then(res => setServices(res.data));
  }, []);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];

  return (
    <div className="services-container">
      <h2 className="services-title">Pet Services</h2>
      <div className="services-categories">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn${selectedCategory === cat ? ' active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="service-list">
        {services
          .filter(s => selectedCategory === 'All' || s.category === selectedCategory)
          .map(service => (
            <div className="service-card" key={service._id}>
              <h3>{service.name}</h3>
              <p>₹{service.price}</p>
              <p>{service.description}</p>
              <p><b>Duration:</b> {service.duration}</p>
              <p><b>Category:</b> {service.category}</p>
              <button className="book-btn" onClick={() => setSelectedService(service)}>
                Book Now
              </button>
            </div>
          ))}
      </div>
      {selectedService && (
        <ServiceBookingModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}

export default Services;