import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './BackButton.css';

const BackButton = ({ className = '', style = {} }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to home page if no history
      navigate('/');
    }
  };

  return (
    <button 
      onClick={handleBack}
      className={`back-button ${className}`}
      style={style}
      aria-label="Go back to previous page"
      title="Go back"
    >
      <FaArrowLeft />
    </button>
  );
};

export default BackButton; 