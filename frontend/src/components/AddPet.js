import React, { useState, useRef } from 'react';
import axios from 'axios';
import './AddPet.css';

const AddPet = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    breed: '',
    age: '',
    gender: '',
    size: '',
    description: '',
    healthStatus: 'Healthy'
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Create form data for file upload
      const formDataWithImage = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        // Convert age to number
        if (key === 'age') {
          formDataWithImage.append(key, parseInt(formData[key]));
        } else {
          formDataWithImage.append(key, formData[key]);
        }
      });
      
      // Add image file if selected
      if (selectedImage) {
        formDataWithImage.append('image', selectedImage);
      }
      
      // Add isAdopted status
      formDataWithImage.append('isAdopted', false);
      
      const response = await axios.post('/api/pets', formDataWithImage, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage(`Pet "${response.data.name}" added successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        breed: '',
        age: '',
        gender: '',
        size: '',
        description: '',
        healthStatus: 'Healthy'
      });
      
      // Reset image
      setSelectedImage(null);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error adding pet:', error);
      setError(error.response?.data?.error || 'Failed to add pet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-pet-container">
      <h2>Add New Pet</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="add-pet-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Pet Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter pet name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Fish">Fish</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="breed">Breed *</label>
            <input
              type="text"
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              required
              placeholder="Enter breed"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="age">Age (years) *</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="0"
              max="30"
              placeholder="Enter age"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gender">Gender *</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="size">Size *</label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
            >
              <option value="">Select size</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Pet Image *</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            required
          />
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="healthStatus">Health Status</label>
          <select
            id="healthStatus"
            name="healthStatus"
            value={formData.healthStatus}
            onChange={handleChange}
          >
            <option value="Healthy">Healthy</option>
            <option value="Needs Medical Attention">Needs Medical Attention</option>
            <option value="Recovering">Recovering</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Describe the pet's personality, behavior, and special needs..."
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding Pet...' : 'Add Pet'}
        </button>
      </form>
    </div>
  );
};

export default AddPet; 