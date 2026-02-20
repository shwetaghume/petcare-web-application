import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './PetDetail.css';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch pet data from API
  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await axios.get(`${apiUrl}/api/pets/${id}`);
        setPet(response.data);
      } catch (error) {
        console.error('Error fetching pet details:', error);
        setPet(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  // const handleDelete = async () => {
  //   if (window.confirm('Are you sure you want to delete this pet?')) {
  //     try {
  //       const response = await fetch(`/api/pets/${id}`, {
  //         method: 'DELETE'
  //       });
        
  //       if (!response.ok) {
  //         throw new Error('Failed to delete pet');
  //       }
        
  //       navigate('/pets');
  //     } catch (err) {
  //       setError('Failed to delete pet. Please try again later.');
  //       console.error('Error deleting pet:', err);
  //     }
  //   }
  // };

  if (loading) {
    return <div className="loading">Loading pet details...</div>;
  }

  if (!pet) {
    return <div className="error">Pet not found</div>;
  }

  return (
    <div className="pet-detail-container">

      <div className="pet-detail-header">
        <button 
          onClick={() => navigate('/pets')} 
          className="back-button"
        >
          ← Back to Pets
        </button>
        
        <div className="pet-status">
          <span className={`status-badge ${pet.healthStatus.toLowerCase().replace(' ', '-')}`}>
            {pet.healthStatus}
          </span>
          {!pet.isAdopted && (
            <span className="availability-badge available">Available for Adoption</span>
          )}
          {pet.isAdopted && (
            <span className="availability-badge adopted">Already Adopted</span>
          )}
        </div>
      </div>

      <div className="pet-detail-content">
        <div className="pet-image-section">
          <div className="main-image">
            <img 
              src={pet.image} 
              alt={pet.name}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop&q=60';
              }}
            />
          </div>
        </div>

        <div className="pet-info-section">
          <div className="pet-header">
            <h1>{pet.name}</h1>
            <div className="pet-basic-info">
              <span className="pet-category">{pet.category}</span>
              <span className="pet-age">{pet.age} years old</span>
              <span className="pet-gender">{pet.gender}</span>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <h3>Basic Information</h3>
              <div className="info-item">
                <strong>Breed:</strong> {pet.breed}
              </div>
              <div className="info-item">
                <strong>Size:</strong> {pet.size}
              </div>
              <div className="info-item">
                <strong>Gender:</strong> {pet.gender}
              </div>
              <div className="info-item">
                <strong>Age:</strong> {pet.age} years
              </div>
            </div>

            <div className="info-card">
              <h3>Health Information</h3>
              <div className="info-item">
                <strong>Health Status:</strong> 
                <span className="health-indicator">{pet.healthStatus}</span>
              </div>
              <div className="info-item">
                <strong>Vaccinated:</strong> 
                <span className="vaccination-status">Up to date</span>
              </div>
              <div className="info-item">
                <strong>Spayed/Neutered:</strong> Yes
              </div>
              <div className="info-item">
                <strong>Microchipped:</strong> Yes
              </div>
            </div>
          </div>

          <div className="description-section">
            <h3>About {pet.name}</h3>
            <p className="pet-description">{pet.description}</p>
          </div>

          <div className="personality-section">
            <h3>Personality Traits</h3>
            <div className="traits-list">
              <span className="trait">Friendly</span>
              <span className="trait">Playful</span>
              <span className="trait">Good with kids</span>
              <span className="trait">House trained</span>
            </div>
          </div>

          {!pet.isAdopted ? (
            <div className="adoption-section">
              <h3>Ready to Adopt {pet.name}?</h3>
              <p>Give {pet.name} the loving home they deserve. Start your adoption journey today!</p>
              
              <div className="adoption-actions">
                <button 
                  onClick={() => navigate(`/adoption/${pet._id}`)}
                  className="btn btn-primary adopt-main-btn"
                >
                  🏠 Start Adoption Process
                </button>
                
                <div className="secondary-actions">
                  <button className="btn btn-secondary">
                    💝 Add to Favorites
                  </button>
                  <button className="btn btn-secondary">
                    📞 Schedule Visit
                  </button>
                  <button className="btn btn-secondary">
                    📧 Ask Question
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="adopted-section">
              <h3>This pet has found their forever home! 🎉</h3>
              <p>Thank you for your interest. Check out our other available pets.</p>
              <button 
                onClick={() => navigate('/pets')}
                className="btn btn-primary"
              >
                View Other Pets
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetDetail;