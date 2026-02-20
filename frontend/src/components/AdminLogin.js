import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', formData);
      const { token, user } = response.data;

      // Check if user is admin
      if (!user.isAdmin) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // If admin, log them in
      login(token, user);
      onClose();
      
      // Clear form
      setFormData({ email: '', password: '' });
      setError('');
      
      // Navigate to admin dashboard
      navigate('/admin', { replace: true });
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="admin-login-overlay" onClick={handleOverlayClick}>
      <div className="admin-login-modal">
        <div className="admin-login-header">
          <h2>🔐 Admin Login</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="admin-login-content">
          <p className="admin-login-description">
            Please enter your admin credentials to access the admin panel.
          </p>
          
          <form onSubmit={handleSubmit} className="admin-login-form">
            {error && (
              <div className="error-message">
                <i className="error-icon">⚠️</i>
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="admin-email">Email Address</label>
              <input
                type="email"
                id="admin-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your admin email"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                type="password"
                id="admin-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your admin password"
                required
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                'Login as Admin'
              )}
            </button>
          </form>
          
          <div className="admin-login-footer">
            <p className="security-note">
              🛡️ This is a secure admin login. Only authorized personnel should access this area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 