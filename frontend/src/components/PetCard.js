// src/components/PetCard.js
import React, { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const PetCard = ({ pet }) => (
  <div className="pet-card">
    <Link to={`/pets/${pet._id}`}>
      <img src={pet.image} alt={pet.name} />
      <h3>{pet.name}</h3>
      {/* ...other pet info... */}
    </Link>
  </div>
);

PetCard.displayName = 'PetCard';

export default PetCard;
