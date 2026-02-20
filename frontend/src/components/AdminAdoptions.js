import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import './AdminAdoptions.css';

// Configure axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:10000';
axios.defaults.timeout = 30000; // 30 second timeout to handle larger datasets

const AdminAdoptions = () => {
  const { user } = useAuth();
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedAdoption, setSelectedAdoption] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Initialize adoption applications data
  useEffect(() => {
    initializeAdoptionsData();
  }, []);

  const initializeAdoptionsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login as admin to view adoptions');
        setLoading(false);
        return;
      }
      
      // Fetch adoptions from backend API with pagination for better performance
      const response = await axios.get('/api/adoptions/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: 50, // Increased limit since we optimized the backend
          sortBy: 'createdAt',
          sortOrder: 'desc'
        },
        timeout: 30000 // 30 second timeout for this specific request
      });
      
      // Extract adoptions from the response
      const adoptionsData = response.data.adoptions || response.data || [];
      console.log('Fetched adoptions:', adoptionsData);
      console.log('Pagination info:', response.data.pagination);
      
      setAdoptions(adoptionsData);
    } catch (error) {
      console.error('Error fetching adoptions:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch adoption applications';
      setError(errorMessage);
      
      // If it's an auth error, clear adoptions
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAdoptions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    total: adoptions.length,
    pending: adoptions.filter(a => a.status === 'Pending').length,
    approved: adoptions.filter(a => a.status === 'Approved').length,
    rejected: adoptions.filter(a => a.status === 'Rejected').length
  };

  // Filter adoptions based on search term and status
  const filteredAdoptions = adoptions.filter(adoption => {
    // Safety checks to prevent errors with missing data
    if (!adoption || !adoption.applicant || !adoption.pet) {
      return false;
    }
    
    const matchesSearch = 
      (adoption.applicant.name && adoption.applicant.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (adoption.pet.name && adoption.pet.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (adoption.applicant.email && adoption.applicant.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterCategory === 'all' || adoption.status === filterCategory;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (adoptionId, newStatus, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login as admin to update adoption status');
        return;
      }
      
      // Update status via API
      const response = await axios.patch(`/api/adoptions/${adoptionId}`, {
        status: newStatus,
        adminNotes: notes
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state with the response
      const updatedAdoption = response.data.adoption;
      const updatedAdoptions = adoptions.map(adoption => 
        adoption._id === adoptionId ? updatedAdoption : adoption
      );
      
      setAdoptions(updatedAdoptions);
      alert(`Adoption status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating adoption status:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update adoption status';
      alert(`Error: ${errorMessage}`);
    }
  };

  const updatePetAdoptionStatus = (petId, isAdopted) => {
    const adminPets = JSON.parse(localStorage.getItem('adminPets') || '[]');
    const updatedPets = adminPets.map(pet => {
      if (pet._id === petId) {
        return { ...pet, isAdopted };
      }
      return pet;
    });
    localStorage.setItem('adminPets', JSON.stringify(updatedPets));
  };

  const viewDetails = (adoption) => {
    setSelectedAdoption(adoption);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedAdoption(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-adoptions">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading adoption applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-adoptions">
      <div className="adoptions-header">
        <div className="header-content">
          <h1>Manage Adoptions</h1>
          <p>Review and process pet adoption applications</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={initializeAdoptionsData} className="btn btn-primary">
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="adoptions-filters">
        <div className="search-filter-container">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search by adopter name, pet name, or email..."
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
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="adoptions-stats">
        <div className="stat-item">
          <span className="stat-number">{statusCounts.total}</span>
          <span className="stat-label">Total Applications</span>
        </div>
        <div className="stat-item pending">
          <span className="stat-number">{statusCounts.pending}</span>
          <span className="stat-label">Pending Review</span>
        </div>
        <div className="stat-item approved">
          <span className="stat-number">{statusCounts.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item rejected">
          <span className="stat-number">{statusCounts.rejected}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Adoptions List */}
      <div className="adoptions-table-section">
        <div className="section-header">
          <h2>Adoption Applications</h2>
          <p>Review and manage pet adoption applications</p>
        </div>
        
        {filteredAdoptions.length > 0 ? (
          <div className="adoptions-table-container">
            <table className="adoptions-table">
              <thead>
                <tr>
                  <th>Pet</th>
                  <th>Applicant</th>
                  <th>Contact</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdoptions.map(adoption => (
                  <tr key={adoption._id}>
                    <td>
                      <div className="pet-info-cell">
                        <img 
                          src={adoption.pet.image} 
                          alt={adoption.pet.name}
                          className="pet-thumbnail"
                        />
                        <div className="pet-name-info">
                          <strong>{adoption.pet.name}</strong>
                          <div className="pet-breed">{adoption.pet.breed} • {adoption.pet.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="adopter-info">
                        <strong>{adoption.applicant.name}</strong>
                        <div className="adopter-phone">{adoption.personalDetails?.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div>{adoption.applicant.email}</div>
                        <div className="phone">{adoption.personalDetails?.phone || adoption.applicant.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <div>{formatDate(adoption.createdAt)}</div>
                        <div className="time">Updated: {formatDate(adoption.updatedAt || adoption.createdAt)}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(adoption.status)}`}>
                        {adoption.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => viewDetails(adoption)}
                        >
                          View Details
                        </button>
                        
                        {adoption.status === 'Pending' && (
                          <>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                const notes = prompt('Add approval notes (optional):');
                                handleStatusChange(adoption._id, 'Approved', notes);
                              }}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                const notes = prompt('Add rejection reason:');
                                if (notes) {
                                  handleStatusChange(adoption._id, 'Rejected', notes);
                                }
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {adoption.status !== 'Pending' && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to reset this application to pending?')) {
                                handleStatusChange(adoption._id, 'Pending', 'Status reset by admin');
                              }
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <p>No adoption applications found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedAdoption && (
        <div className="modal-overlay">
          <div className="modal-content adoption-details-modal">
            <div className="modal-header">
              <h2>Adoption Application Details</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Pet Information */}
              <div className="details-section">
                <h3>Pet Information</h3>
                <div className="pet-info">
                  <img src={selectedAdoption.pet.image} alt={selectedAdoption.pet.name} className="pet-detail-image" />
                  <div className="pet-details">
                    <h4>{selectedAdoption.pet.name}</h4>
                    <p>{selectedAdoption.pet.breed} • {selectedAdoption.pet.category}</p>
                  </div>
                </div>
              </div>

              {/* Applicant Details */}
              <div className="details-section">
                <h3>Applicant Information</h3>
                <div className="info-grid">
                  <div><strong>Name:</strong> {selectedAdoption.applicant.name}</div>
                  <div><strong>Email:</strong> {selectedAdoption.applicant.email}</div>
                  <div><strong>Phone:</strong> {selectedAdoption.personalDetails?.phone || selectedAdoption.applicant.phone}</div>
                  <div><strong>ID Proof Type:</strong> {selectedAdoption.personalDetails?.idProofType || 'N/A'}</div>
                </div>
              </div>

              {/* ID Proof Document */}
              <div className="details-section">
                <h3>ID Proof Document</h3>
                <div className="id-proof-section">
                  <div className="id-proof-info">
                    <div><strong>Document Type:</strong> {selectedAdoption.personalDetails?.idProofType?.toUpperCase() || 'N/A'}</div>
                    {selectedAdoption.personalDetails?.idProofFile ? (
                      <div className="id-proof-document">
                        <strong>Uploaded Document:</strong>
                        <div className="document-actions">
                          <a 
                            href={`${axios.defaults.baseURL}/${selectedAdoption.personalDetails.idProofFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            View Document
                          </a>
                          <a 
                            href={`${axios.defaults.baseURL}/${selectedAdoption.personalDetails.idProofFile}`}
                            download
                            className="btn btn-secondary btn-sm"
                          >
                            Download
                          </a>
                        </div>
                        <div className="document-preview">
                          {selectedAdoption.personalDetails.idProofFile.toLowerCase().includes('.pdf') ? (
                            <div className="pdf-preview">
                              <iframe 
                                src={`${axios.defaults.baseURL}/${selectedAdoption.personalDetails.idProofFile}#toolbar=0`}
                                title="ID Proof Document"
                                className="pdf-iframe"
                              ></iframe>
                            </div>
                          ) : (
                            <img 
                              src={`${axios.defaults.baseURL}/${selectedAdoption.personalDetails.idProofFile}`}
                              alt="ID Proof Document"
                              className="id-proof-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          )}
                          <div className="image-error" style={{display: 'none'}}>
                            <p>Unable to display image. Please use the View Document button above.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-document">
                        <p>No ID proof document uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Living Situation */}
              <div className="details-section">
                <h3>Living Situation</h3>
                <div className="info-grid">
                  <div><strong>Home Type:</strong> {selectedAdoption.livingSituation?.homeType || 'N/A'}</div>
                  <div><strong>Has Yard:</strong> {selectedAdoption.livingSituation?.hasYard ? 'Yes' : 'No'}</div>
                  <div><strong>Other Pets:</strong> {selectedAdoption.livingSituation?.otherPets ? 'Yes' : 'No'}</div>
                  {selectedAdoption.livingSituation?.otherPets && selectedAdoption.livingSituation?.otherPetsDetails && (
                    <div><strong>Other Pets Details:</strong> {selectedAdoption.livingSituation.otherPetsDetails}</div>
                  )}
                </div>
              </div>

              {/* Pet Experience */}
              <div className="details-section">
                <h3>Pet Experience</h3>
                <div className="info-grid">
                  <div><strong>Has Experience:</strong> {selectedAdoption.experience?.hasExperience ? 'Yes' : 'No'}</div>
                  {selectedAdoption.experience?.hasExperience && selectedAdoption.experience?.experienceDetails && (
                    <div><strong>Experience Details:</strong> {selectedAdoption.experience.experienceDetails}</div>
                  )}
                </div>
              </div>

              {/* Adoption Reason */}
              <div className="details-section">
                <h3>Adoption Reason</h3>
                <div className="info-grid">
                  <div><strong>Reason:</strong> {selectedAdoption.reasonForAdoption}</div>
                  {selectedAdoption.additionalNotes && (
                    <div><strong>Additional Notes:</strong> {selectedAdoption.additionalNotes}</div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedAdoption.adminNotes && (
                <div className="details-section">
                  <h3>Admin Notes</h3>
                  <p>{selectedAdoption.adminNotes}</p>
                </div>
              )}

              {/* Status Actions */}
              <div className="details-section">
                <h3>Status: <span className={`status-badge ${getStatusBadgeClass(selectedAdoption.status)}`}>
                  {selectedAdoption.status.toUpperCase()}
                </span></h3>
              <div className="modal-actions">
                {selectedAdoption.status === 'Pending' && (
                  <>
                    <button 
                      className="btn btn-success"
                        onClick={() => {
                          const notes = prompt('Add approval notes (optional):');
                          handleStatusChange(selectedAdoption._id, 'Approved', notes);
                          closeModal();
                        }}
                    >
                        Approve Application
                    </button>
                    <button 
                      className="btn btn-danger"
                        onClick={() => {
                          const notes = prompt('Add rejection reason:');
                          if (notes) {
                            handleStatusChange(selectedAdoption._id, 'Rejected', notes);
                            closeModal();
                          }
                        }}
                      >
                        Reject Application
                    </button>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdoptions; 