import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import './AdminPets.css';

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    breed: '',
    age: '',
    gender: '',
    size: '',
    description: '',
    healthStatus: 'Healthy',
    vaccinationStatus: 'Up to date',
    location: '',
    specialNeeds: '',
    isAdopted: false
  });

  // Initialize pets data on component mount
  useEffect(() => {
    initializePetsData();
  }, []);

  const initializePetsData = async () => {
    setLoading(true);
    
    try {
      // Fetch pets from database instead of using sample data
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/pets?includeAdopted=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Fetched pets from database:', response.data);
      setPets(response.data);
      
    } catch (error) {
      console.error('Error loading pets:', error);
      
      // Fallback to sample data only if database fetch fails
      const stored = localStorage.getItem('adminPets');
      let petsData = [];
      
      if (stored) {
        petsData = JSON.parse(stored);
      } else {
      // Initialize with sample pets data
      petsData = [
        // Dogs
        {
          _id: '1',
          name: 'Bella',
          category: 'Dog',
          breed: 'Golden Retriever',
          age: '3 years',
          gender: 'Female',
          size: 'Large',
          description: 'Bella is a friendly and energetic Golden Retriever who loves playing fetch and swimming. She is great with children and other dogs. Bella is house-trained and knows basic commands. She would be perfect for an active family with a yard.',
          image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Main Facility',
          specialNeeds: '',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'Max',
          category: 'Dog',
          breed: 'German Shepherd',
          age: '5 years',
          gender: 'Male',
          size: 'Large',
          description: 'Max is a loyal and intelligent German Shepherd. He is well-trained and protective of his family. Max enjoys long walks and mental stimulation games. He would do best in a home with older children.',
          image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Main Facility',
          specialNeeds: '',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '3',
          name: 'Charlie',
          category: 'Dog',
          breed: 'Labrador Mix',
          age: '2 years',
          gender: 'Male',
          size: 'Medium',
          description: 'Charlie is a sweet and gentle Labrador mix who loves cuddles and treats. He is still learning his manners but is very food motivated and eager to please. Charlie gets along well with other pets.',
          image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Main Facility',
          specialNeeds: '',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        // Cats
        {
          _id: '4',
          name: 'Luna',
          category: 'Cat',
          breed: 'Persian',
          age: '4 years',
          gender: 'Female',
          size: 'Medium',
          description: 'Luna is a beautiful Persian cat with stunning blue eyes. She is calm and affectionate, preferring quiet environments. Luna enjoys being petted and will purr contentedly on your lap. She would do well in a calm household.',
          image: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Main Facility',
          specialNeeds: '',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '5',
          name: 'Whiskers',
          category: 'Cat',
          breed: 'Tabby',
          age: '6 years',
          gender: 'Male',
          size: 'Medium',
          description: 'Whiskers is a friendly tabby cat who loves attention and playtime. He is very social and enjoys interacting with people. Whiskers is litter-trained and gets along well with other cats.',
          image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Main Facility',
          specialNeeds: '',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '6',
          name: 'Mittens',
          category: 'Cat',
          breed: 'Siamese',
          age: '1 year',
          gender: 'Female',
          size: 'Small',
          description: 'Mittens is a playful young Siamese kitten with striking blue eyes. She is very active and curious, always exploring her surroundings. Mittens loves interactive toys and would benefit from a playmate.',
          image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Main Facility',
          specialNeeds: '',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        // Birds
        {
          _id: '7',
          name: 'Sunny',
          category: 'Bird',
          breed: 'Cockatiel',
          age: '2 years',
          gender: 'Male',
          size: 'Small',
          description: 'Sunny is a charming cockatiel who loves to whistle and mimic sounds. He is social and enjoys interaction with his human companions. Sunny needs a spacious cage and daily out-of-cage time for exercise.',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Bird Aviary',
          specialNeeds: 'Requires daily social interaction',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '8',
          name: 'Rainbow',
          category: 'Bird',
          breed: 'Lovebird',
          age: '1 year',
          gender: 'Female',
          size: 'Small',
          description: 'Rainbow is a colorful lovebird with a vibrant personality. She is very active and playful, enjoying toys and social interaction. Rainbow would do well with another lovebird companion.',
          image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Bird Aviary',
          specialNeeds: 'Prefers companion birds',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        // Fish
        {
          _id: '9',
          name: 'Nemo',
          category: 'Fish',
          breed: 'Clownfish',
          age: '1 year',
          gender: 'Male',
          size: 'Small',
          description: 'Nemo is a vibrant clownfish perfect for beginners to marine aquariums. He is healthy and active, swimming playfully among coral decorations. Nemo requires a well-maintained saltwater tank with proper filtration.',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'N/A',
          location: 'Aquarium Section',
          specialNeeds: 'Saltwater tank required',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '10',
          name: 'Goldie',
          category: 'Fish',
          breed: 'Goldfish',
          age: '2 years',
          gender: 'Female',
          size: 'Small',
          description: 'Goldie is a beautiful goldfish with bright orange coloring. She is easy to care for and perfect for first-time fish owners. Goldie enjoys a well-planted tank with plenty of swimming space.',
          image: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'N/A',
          location: 'Aquarium Section',
          specialNeeds: 'Freshwater tank required',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        // Small Animals
        {
          _id: '11',
          name: 'Coco',
          category: 'Small Animal',
          breed: 'Holland Lop Rabbit',
          age: '3 years',
          gender: 'Female',
          size: 'Medium',
          description: 'Coco is a gentle Holland Lop rabbit with soft, floppy ears. She enjoys being petted and is litter-trained. Coco needs a spacious enclosure with room to hop and play. She loves fresh vegetables and timothy hay.',
          image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Small Animal Area',
          specialNeeds: 'Requires timothy hay diet',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '12',
          name: 'Peanut',
          category: 'Small Animal',
          breed: 'Guinea Pig',
          age: '2 years',
          gender: 'Male',
          size: 'Small',
          description: 'Peanut is a friendly guinea pig who loves to vocalize and interact with his human friends. He enjoys fresh vegetables and needs vitamin C in his diet. Peanut would do well with another guinea pig companion.',
          image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'Up to date',
          location: 'Small Animal Area',
          specialNeeds: 'Vitamin C supplements required',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        },
        {
          _id: '13',
          name: 'Nibbles',
          category: 'Small Animal',
          breed: 'Syrian Hamster',
          age: '1 year',
          gender: 'Female',
          size: 'Small',
          description: 'Nibbles is an active Syrian hamster who loves to run on her wheel and explore tunnels. She is nocturnal and most active in the evening. Nibbles enjoys hiding treats and building nests with soft bedding.',
          image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&auto=format&fit=crop&q=60',
          healthStatus: 'Healthy',
          vaccinationStatus: 'N/A',
          location: 'Small Animal Area',
          specialNeeds: 'Nocturnal - quiet during day',
          isAdopted: false,
          dateAdded: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('adminPets', JSON.stringify(petsData));
      }
      
      setPets(petsData);
    }
    
    setLoading(false);
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
    
    // Validation
    if (!formData.name || !formData.category || !formData.breed || !formData.age || !formData.gender) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      if (editingPet) {
        // Update existing pet using API
        const formDataWithImage = new FormData();
        
        // Only add fields that exist in the Pet model schema
        const allowedFields = ['name', 'category', 'breed', 'age', 'gender', 'size', 'description', 'healthStatus', 'isAdopted'];
        
        allowedFields.forEach(key => {
          if (formData[key] !== undefined && formData[key] !== null) {
            if (key === 'age') {
              formDataWithImage.append(key, parseInt(formData[key]));
            } else if (key === 'isAdopted') {
              formDataWithImage.append(key, Boolean(formData[key]));
            } else {
              formDataWithImage.append(key, formData[key]);
            }
          }
        });
        
        // Add image file if selected
        if (selectedImage) {
          formDataWithImage.append('image', selectedImage);
        }
        
        console.log('Updating pet with ID:', editingPet._id);
        console.log('Form data being sent:', Object.fromEntries(formDataWithImage));
        
        const response = await axios.put(`/api/pets/${editingPet._id}`, formDataWithImage, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Update local storage
        const updatedPets = pets.map(pet => 
          pet._id === editingPet._id ? response.data : pet
        );
        setPets(updatedPets);
        localStorage.setItem('adminPets', JSON.stringify(updatedPets));
        alert('Pet updated successfully!');
        
      } else {
        // Add new pet using API
        const formDataWithImage = new FormData();
        
        // Add all form fields to FormData
        Object.keys(formData).forEach(key => {
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
        
        const response = await axios.post('/api/pets', formDataWithImage, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Add to local storage
        const updatedPets = [...pets, response.data];
        setPets(updatedPets);
        localStorage.setItem('adminPets', JSON.stringify(updatedPets));
        alert('Pet added successfully!');
      }
      
      resetForm();
      
    } catch (error) {
      console.error('Error saving pet:', error);
      alert('Error saving pet: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = (petId) => {
    if (window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      const updatedPets = pets.filter(pet => pet._id !== petId);
      setPets(updatedPets);
      localStorage.setItem('adminPets', JSON.stringify(updatedPets));
        alert('Pet deleted successfully!');
    }
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || '',
      category: pet.category || '',
      breed: pet.breed || '',
      age: pet.age ? parseInt(pet.age.toString().replace(/[^0-9]/g, '')) || '' : '',
      gender: pet.gender || '',
      size: pet.size || '',
      description: pet.description || '',
      healthStatus: pet.healthStatus || 'Healthy',
      vaccinationStatus: pet.vaccinationStatus || 'Up to date',
      location: pet.location || '',
      specialNeeds: pet.specialNeeds || '',
      isAdopted: pet.isAdopted || false
    });
    // Set preview image to existing pet image
    if (pet.image) {
      setPreviewImage(pet.image);
    }
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      breed: '',
      age: '',
      gender: '',
      size: '',
      description: '',
      healthStatus: 'Healthy',
      vaccinationStatus: 'Up to date',
      location: '',
      specialNeeds: '',
      isAdopted: false
    });
    setSelectedImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditingPet(null);
    setShowAddForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || pet.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'adopted' && pet.isAdopted) ||
                         (filterStatus === 'available' && !pet.isAdopted);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-pets">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pets">

      <div className="pets-header">
        <div className="header-content">
          <h1>Manage Pets</h1>
          <p>Add, edit, and manage all pets in the system</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="btn btn-primary"
        >
          + Add New Pet
        </button>
      </div>

      {/* Filters */}
      <div className="pets-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search pets by name or breed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="Dog">Dogs</option>
            <option value="Cat">Cats</option>
            <option value="Bird">Birds</option>
            <option value="Fish">Fish</option>
            <option value="Small Animal">Small Animals</option>
            <option value="Other">Other</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="adopted">Adopted</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="pets-stats">
        <div className="stat-item">
          <span className="stat-number">{pets.length}</span>
          <span className="stat-label">Total Pets</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{pets.filter(p => !p.isAdopted).length}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{pets.filter(p => p.isAdopted).length}</span>
          <span className="stat-label">Adopted</span>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPet ? 'Edit Pet' : 'Add New Pet'}</h2>
              <button 
                onClick={resetForm} 
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="pet-form">
              <div className="form-grid">
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
                    <option value="">Select Category</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                    <option value="Small Animal">Small Animal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

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
                  <label htmlFor="age">Age *</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Age in years"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
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
                    <option value="">Select Size</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="image">Pet Image {!editingPet && '*'}</label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  {...(!editingPet && { required: true })}
                />
                {previewImage && (
                  <div className="image-preview" style={{ marginTop: '10px' }}>
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} 
                    />
                    {editingPet && !selectedImage && (
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        Current image - upload new file to replace
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe the pet's personality, behavior, and any special notes"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="healthStatus">Health Status *</label>
                  <select
                    id="healthStatus"
                    name="healthStatus"
                    value={formData.healthStatus}
                    onChange={handleChange}
                    required
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Special Needs">Special Needs</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="vaccinationStatus">Vaccination Status</label>
                  <select
                    id="vaccinationStatus"
                    name="vaccinationStatus"
                    value={formData.vaccinationStatus}
                    onChange={handleChange}
                  >
                    <option value="Up to date">Up to date</option>
                    <option value="Partial">Partial</option>
                    <option value="Not vaccinated">Not vaccinated</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Current location"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="specialNeeds">Special Needs</label>
                <textarea
                  id="specialNeeds"
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Any special care requirements or medical needs"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAdopted"
                    checked={formData.isAdopted}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Mark as adopted
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPet ? 'Update Pet' : 'Add Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pets Table */}
      <div className="pets-table-container">
        <table className="pets-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Breed</th>
              <th>Age</th>
              <th>Status</th>
              <th>Health</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPets.length > 0 ? (
              filteredPets.map((pet) => (
                <tr key={pet._id}>
                  <td>
                    <img 
                      src={pet.image || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=60&auto=format&fit=crop&q=60'} 
                      alt={pet.name}
                      className="pet-thumbnail"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=60&auto=format&fit=crop&q=60';
                      }}
                    />
                  </td>
                  <td>
                    <div className="pet-name">
                      <strong>{pet.name}</strong>
                      <span className="pet-gender">{pet.gender}</span>
                    </div>
                  </td>
                  <td>
                    <span className="pet-category">{pet.category}</span>
                  </td>
                  <td>{pet.breed}</td>
                  <td>{pet.age} years</td>
                  <td>
                    <span className={`status-badge ${pet.isAdopted ? 'adopted' : 'available'}`}>
                      {pet.isAdopted ? 'Adopted' : 'Available'}
                    </span>
                  </td>
                  <td>
                    <span className={`health-badge ${pet.healthStatus.toLowerCase().replace(' ', '-')}`}>
                      {pet.healthStatus}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/pet/${pet._id}`} 
                        className="btn btn-sm btn-secondary"
                        title="View Details"
                      >
                        👁️
                      </Link>
                      <button 
                        onClick={() => handleEdit(pet)} 
                        className="btn btn-sm btn-primary"
                        title="Edit Pet"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(pet._id)} 
                        className="btn btn-sm btn-danger"
                        title="Delete Pet"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                    ? 'No pets match your search criteria' 
                    : 'No pets found. Add your first pet!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPets; 