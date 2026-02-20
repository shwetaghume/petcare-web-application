import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';

import './AdoptionForm.css';

const AdoptionForm = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    personalDetails: {
      phone: user?.phone || '',
      idProofType: '',
      idProofFile: null
    },
    livingSituation: {
      homeType: '',
      hasYard: false,
      otherPets: false,
      otherPetsDetails: ''
    },
    experience: {
      hasExperience: false,
      experienceDetails: ''
    },
    reasonForAdoption: '',
    additionalNotes: ''
  });

  // Sample pets data wrapped in useMemo to prevent re-renders
  const samplePetsData = useMemo(() => [
    // Dogs
    {
      _id: '1',
      name: 'Bella',
      category: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      gender: 'Female',
      size: 'Large',
      description: 'Bella is a friendly and energetic Golden Retriever who loves playing fetch and swimming. She is great with children and other dogs. Bella is house-trained and knows basic commands. She would be perfect for an active family with a yard.',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '2',
      name: 'Max',
      category: 'Dog',
      breed: 'German Shepherd',
      age: 5,
      gender: 'Male',
      size: 'Large',
      description: 'Max is a loyal and intelligent German Shepherd. He is well-trained and protective of his family. Max enjoys long walks and mental stimulation games. He would do best in a home with older children.',
      image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '3',
      name: 'Charlie',
      category: 'Dog',
      breed: 'Labrador Mix',
      age: 2,
      gender: 'Male',
      size: 'Medium',
      description: 'Charlie is a sweet and gentle Labrador mix who loves cuddles and treats. He is still learning his manners but is very food motivated and eager to please. Charlie gets along well with other pets.',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    // Cats
    {
      _id: '4',
      name: 'Luna',
      category: 'Cat',
      breed: 'Persian',
      age: 4,
      gender: 'Female',
      size: 'Medium',
      description: 'Luna is a beautiful Persian cat with stunning blue eyes. She is calm and affectionate, preferring quiet environments. Luna enjoys being petted and will purr contentedly on your lap. She would do well in a calm household.',
      image: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '5',
      name: 'Whiskers',
      category: 'Cat',
      breed: 'Tabby',
      age: 6,
      gender: 'Male',
      size: 'Medium',
      description: 'Whiskers is a friendly tabby cat who loves attention and playtime. He is very social and enjoys interacting with people. Whiskers is litter-trained and gets along well with other cats.',
      image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '6',
      name: 'Mittens',
      category: 'Cat',
      breed: 'Siamese',
      age: 1,
      gender: 'Female',
      size: 'Small',
      description: 'Mittens is a playful young Siamese kitten with striking blue eyes. She is very active and curious, always exploring her surroundings. Mittens loves interactive toys and would benefit from a playmate.',
      image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    // Birds
    {
      _id: '7',
      name: 'Sunny',
      category: 'Bird',
      breed: 'Cockatiel',
      age: 2,
      gender: 'Male',
      size: 'Small',
      description: 'Sunny is a charming cockatiel who loves to whistle and mimic sounds. He is social and enjoys interaction with his human companions. Sunny needs a spacious cage and daily out-of-cage time for exercise.',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '8',
      name: 'Rainbow',
      category: 'Bird',
      breed: 'Lovebird',
      age: 1,
      gender: 'Female',
      size: 'Small',
      description: 'Rainbow is a colorful lovebird with a vibrant personality. She is very active and playful, enjoying toys and social interaction. Rainbow would do well with another lovebird companion.',
      image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    // Fish
    {
      _id: '9',
      name: 'Nemo',
      category: 'Fish',
      breed: 'Clownfish',
      age: 1,
      gender: 'Male',
      size: 'Small',
      description: 'Nemo is a vibrant clownfish perfect for beginners to marine aquariums. He is healthy and active, swimming playfully among coral decorations. Nemo requires a well-maintained saltwater tank with proper filtration.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '10',
      name: 'Goldie',
      category: 'Fish',
      breed: 'Goldfish',
      age: 2,
      gender: 'Female',
      size: 'Small',
      description: 'Goldie is a beautiful goldfish with bright orange coloring. She is easy to care for and perfect for first-time fish owners. Goldie enjoys a well-planted tank with plenty of swimming space.',
      image: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    // Small Animals
    {
      _id: '11',
      name: 'Coco',
      category: 'Small Animal',
      breed: 'Holland Lop Rabbit',
      age: 1,
      gender: 'Female',
      size: 'Small',
      description: 'Coco is an adorable Holland Lop rabbit with soft, fluffy fur. She is gentle and enjoys being petted. Coco needs a spacious enclosure with hay, fresh vegetables, and daily exercise time outside her cage.',
      image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '12',
      name: 'Peanut',
      category: 'Small Animal',
      breed: 'Guinea Pig',
      age: 2,
      gender: 'Male',
      size: 'Small',
      description: 'Peanut is a friendly guinea pig who loves to popcorn and play. He enjoys fresh vegetables and hay, and makes adorable squeaking sounds when excited. Peanut would love a guinea pig companion.',
      image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    },
    {
      _id: '13',
      name: 'Nibbles',
      category: 'Small Animal',
      breed: 'Hamster',
      age: 1,
      gender: 'Female',
      size: 'Small',
      description: 'Nibbles is a tiny hamster with lots of personality. She loves running on her wheel and stuffing her cheeks with food. Nibbles is nocturnal and most active in the evening and night.',
      image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&auto=format&fit=crop&q=60',
      healthStatus: 'Healthy',
      isAdopted: false
    }
  ], []);

  // Fetch pet data from the backend
  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/pets/${petId}`);
        setPet(response.data);
      } catch (err) {
        console.error('Error fetching pet:', err);
        setError('Failed to load pet details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      fetchPet();
    }
  }, [petId]);

  // Validation functions
  const validateIndianPhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  };

  const validateForm = () => {
    const errors = {};

    // Personal Details validation
    if (!validateIndianPhone(formData.personalDetails.phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6-9';
    }
    if (!formData.personalDetails.idProofType) {
      errors.idProofType = 'Please select an ID proof type';
    }
    if (!formData.personalDetails.idProofFile) {
      errors.idProofFile = 'Please upload your ID proof';
    }

    // Living Situation validation
    if (!formData.livingSituation.homeType) {
      errors.homeType = 'Please select your home type';
    }
    if (formData.livingSituation.otherPets && !formData.livingSituation.otherPetsDetails.trim()) {
      errors.otherPetsDetails = 'Please provide details about your other pets';
    }

    // Experience validation
    if (formData.experience.hasExperience && !formData.experience.experienceDetails.trim()) {
      errors.experienceDetails = 'Please provide details about your pet experience';
    }

    // Adoption reason validation
    if (formData.reasonForAdoption.trim().length < 20) {
      errors.reasonForAdoption = 'Please provide a detailed reason (minimum 20 characters)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested object updates
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name.split('.').pop()]) {
      setValidationErrors(prev => ({
        ...prev,
        [name.split('.').pop()]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setValidationErrors(prev => ({
          ...prev,
          idProofFile: 'Please upload a PDF or JPEG file only'
        }));
        e.target.value = ''; // Clear the file input
        return;
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({
          ...prev,
          idProofFile: 'File size should be less than 5MB'
        }));
        e.target.value = ''; // Clear the file input
        return;
      }
      setFormData(prev => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          idProofFile: file
        }
      }));
      // Clear validation error
      setValidationErrors(prev => ({
        ...prev,
        idProofFile: ''
      }));
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please login to submit an adoption application');
      navigate('/login');
      return;
    }

    // Make sure we're on the last step before submitting
    if (currentStep !== totalSteps) {
      nextStep();
      return;
    }

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      // Go back to first step if there are validation errors with personal details
      if (validationErrors.phone || validationErrors.idProofType || validationErrors.idProofFile) {
        setCurrentStep(1);
      }
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError('');
      
      // Create FormData object
      const submissionData = new FormData();
      
      // Get the file from the form state
      const file = formData.personalDetails.idProofFile;
      
      if (!file) {
        setError('Please select an ID proof file');
        setCurrentStep(1); // Go back to first step
        return;
      }

      // First, append the file
      submissionData.append('idProofFile', file);
      
      // Create a clean version of personalDetails without the file
      const personalDetailsForSubmission = {
        phone: formData.personalDetails.phone,
        idProofType: formData.personalDetails.idProofType
      };

      // Append all form fields
      submissionData.append('pet', petId);
      submissionData.append('personalDetails', JSON.stringify(personalDetailsForSubmission));
      submissionData.append('livingSituation', JSON.stringify(formData.livingSituation));
      submissionData.append('experience', JSON.stringify(formData.experience));
      submissionData.append('reasonForAdoption', formData.reasonForAdoption);
      if (formData.additionalNotes) {
        submissionData.append('additionalNotes', formData.additionalNotes);
      }

      await axios.post('/api/adoptions', submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert(`🎉 Adoption application submitted successfully for ${pet?.name}! We will contact you within 24-48 hours to discuss next steps.`);
      navigate('/profile');
    } catch (error) {
      console.error('Error submitting adoption form:', error);
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.errors && error.response.data.errors.join(', ')) || 
                          error.message || 
                          'Failed to submit adoption application. Please try again.';
      setError(errorMessage);
      
      // Log the error details
      if (error.response?.data) {
        console.log('Server response:', error.response.data);
      }
      
      // If there's a validation error, go back to the first step
      if (error.response?.status === 400) {
        setCurrentStep(1);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4].map((step) => (
        <div 
          key={step} 
          className={`step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
        >
          <div className="step-number">{step}</div>
          <div className="step-label">
            {step === 1 && 'Personal Info'}
            {step === 2 && 'Living Situation'}
            {step === 3 && 'Pet Experience'}
            {step === 4 && 'Final Details'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <h2>Personal Information</h2>
      <p className="step-description">Please provide your contact information and identification proof.</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="personalDetails.phone"
            value={formData.personalDetails.phone}
            onChange={handleChange}
            required
            placeholder="9876543210"
            className={validationErrors.phone ? 'error' : ''}
          />
          {validationErrors.phone && (
            <span className="error-message">{validationErrors.phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="idProofType">ID Proof Type *</label>
          <select
            id="idProofType"
            name="personalDetails.idProofType"
            value={formData.personalDetails.idProofType}
            onChange={handleChange}
            required
            className={validationErrors.idProofType ? 'error' : ''}
          >
            <option value="">Select ID Proof</option>
            <option value="aadhar">Aadhar Card</option>
            <option value="pan">PAN Card</option>
          </select>
          {validationErrors.idProofType && (
            <span className="error-message">{validationErrors.idProofType}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="idProofFile">Upload ID Proof * (PDF or JPEG, max 5MB)</label>
          <input
            type="file"
            id="idProofFile"
            name="personalDetails.idProofFile"
            accept=".pdf,.jpg,.jpeg"
            onChange={handleFileChange}
            required
            className={validationErrors.idProofFile ? 'error' : ''}
          />
          {validationErrors.idProofFile && (
            <span className="error-message">{validationErrors.idProofFile}</span>
          )}
          {formData.personalDetails.idProofFile && (
            <p className="file-info">
              Selected file: {formData.personalDetails.idProofFile.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h2>Living Situation</h2>
      <p className="step-description">Tell us about your home environment for {pet?.name}.</p>
      
      <div className="form-group">
        <label htmlFor="homeType">Type of Home *</label>
        <select
          id="homeType"
          name="livingSituation.homeType"
          value={formData.livingSituation.homeType}
          onChange={handleChange}
          required
          className={validationErrors.homeType ? 'error' : ''}
        >
          <option value="">Select home type</option>
          <option value="House">House</option>
          <option value="Apartment">Apartment</option>
          <option value="Condo">Condo</option>
          <option value="Other">Other</option>
        </select>
        {validationErrors.homeType && (
          <span className="error-message">{validationErrors.homeType}</span>
        )}
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="livingSituation.hasYard"
            checked={formData.livingSituation.hasYard}
            onChange={handleChange}
          />
          <span className="checkmark"></span>
          Do you have a yard?
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="livingSituation.otherPets"
            checked={formData.livingSituation.otherPets}
            onChange={handleChange}
          />
          <span className="checkmark"></span>
          Do you currently have other pets?
        </label>
      </div>

      {formData.livingSituation.otherPets && (
        <div className="form-group">
          <label htmlFor="otherPetsDetails">Please describe your current pets *</label>
          <textarea
            id="otherPetsDetails"
            name="livingSituation.otherPetsDetails"
            value={formData.livingSituation.otherPetsDetails}
            onChange={handleChange}
            rows="3"
            required={formData.livingSituation.otherPets}
            placeholder="Include type, age, temperament, and how they get along with other animals"
            className={validationErrors.otherPetsDetails ? 'error' : ''}
          />
          {validationErrors.otherPetsDetails && (
            <span className="error-message">{validationErrors.otherPetsDetails}</span>
          )}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <h2>Pet Experience</h2>
      <p className="step-description">Share your experience with pets.</p>
      
      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="experience.hasExperience"
            checked={formData.experience.hasExperience}
            onChange={handleChange}
          />
          <span className="checkmark"></span>
          Do you have previous experience with pets?
        </label>
      </div>

      {formData.experience.hasExperience && (
        <div className="form-group">
          <label htmlFor="experienceDetails">Please describe your pet experience *</label>
          <textarea
            id="experienceDetails"
            name="experience.experienceDetails"
            value={formData.experience.experienceDetails}
            onChange={handleChange}
            rows="4"
            required={formData.experience.hasExperience}
            placeholder="Describe your experience with pets, including types of pets you've owned, care responsibilities, etc."
            className={validationErrors.experienceDetails ? 'error' : ''}
          />
          {validationErrors.experienceDetails && (
            <span className="error-message">{validationErrors.experienceDetails}</span>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="form-step">
      <h2>Adoption Details</h2>
      <p className="step-description">Tell us why you want to adopt {pet?.name}.</p>
      
      <div className="form-group">
        <label htmlFor="reasonForAdoption">Why do you want to adopt this pet? *</label>
        <textarea
          id="reasonForAdoption"
          name="reasonForAdoption"
          value={formData.reasonForAdoption}
          onChange={handleChange}
          rows="4"
          required
          placeholder="Please provide a detailed reason for wanting to adopt this pet (minimum 20 characters)"
          className={validationErrors.reasonForAdoption ? 'error' : ''}
        />
        {validationErrors.reasonForAdoption && (
          <span className="error-message">{validationErrors.reasonForAdoption}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="additionalNotes">Additional Notes (Optional)</label>
        <textarea
          id="additionalNotes"
          name="additionalNotes"
          value={formData.additionalNotes}
          onChange={handleChange}
          rows="3"
          placeholder="Any additional information you'd like to share"
        />
      </div>

      <div className="agreement-section">
        <p><strong>Important:</strong> By submitting this application, you agree that:</p>
        <ul>
          <li>All information provided is accurate and truthful</li>
          <li>You understand that this is an application, not a guarantee of adoption</li>
          <li>We may contact you for additional information or to schedule a home visit</li>
          <li>You are committed to providing proper care, including regular veterinary visits</li>
        </ul>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="adoption-form-container loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading pet information...</p>
        </div>
      </div>
    );
  }

  if (error && !pet) {
    return (
      <div className="adoption-form-container error">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/pets')} className="btn btn-primary">
            Back to Pets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adoption-form-container">
      <div className="adoption-form-header">
        <h1>Adopt {pet?.name}</h1>
        <p>Complete this application to start the adoption process</p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="adoption-form">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        <div className="form-navigation">
          {currentStep > 1 && (
            <button 
              type="button" 
              onClick={prevStep} 
              className="btn btn-secondary"
            >
              Previous
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button 
              type="button" 
              onClick={nextStep} 
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={submitLoading}
            >
              {submitLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdoptionForm; 