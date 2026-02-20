import React, { useState } from 'react';
import './Pets.css';
import AdoptionForm from './AdoptionForm';

const petsData = [
  {
    id: 1,
    name: 'Bella',
    type: 'Dog',
    age: '2 years',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80',
    description: 'Friendly golden retriever who loves to play and cuddle.'
  },
  {
    id: 2,
    name: 'Luna',
    type: 'Cat',
    age: '1.5 years',
    image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80',
    description: 'Calm and affectionate Persian cat with blue eyes.'
  },
  {
    id: 3,
    name: 'Nemo',
    type: 'Fish',
    age: '6 months',
    image: 'https://images.unsplash.com/photo-1594737625785-cb88e9868dfd?auto=format&fit=crop&w=600&q=80',
    description: 'Vibrant clownfish, ideal for a beginner aquarium owner.'
  },
  {
    id: 4,
    name: 'Coco',
    type: 'Rabbit',
    age: '8 months',
    image: 'https://images.unsplash.com/photo-1570211776045-d9b24f8b2b61?auto=format&fit=crop&w=600&q=80',
    description: 'Cute and fluffy bunny, enjoys carrots and cuddles.'
  }
];

const Pets = () => {
  const [selectedPet, setSelectedPet] = useState(null);

  const handleAdoptClick = (pet) => {
    setSelectedPet(pet);
  };

  const handleCloseForm = () => {
    setSelectedPet(null);
  };

  return (
    <div className="pets-container">
      <h1>Adopt a Pet</h1>
      <div className="pets-grid">
        {petsData.map((pet) => (
          <div key={pet.id} className="pet-card">
            <img src={pet.image} alt={pet.name} />
            <h3>{pet.name}</h3>
            <p><strong>Type:</strong> {pet.type}</p>
            <p><strong>Age:</strong> {pet.age}</p>
            <p className="description">{pet.description}</p>
            <button className="adopt-btn" onClick={() => handleAdoptClick(pet)}>Adopt</button>
          </div>
        ))}
      </div>

      {selectedPet && (
        <AdoptionForm pet={selectedPet} onClose={handleCloseForm} />
      )}
    </div>
  );
};

export default Pets;
