// src/pages/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

import './Register.css'; // Reuse similar styling

function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  // Get email from location state (passed from registration)
  const [email, setEmail] = useState(location.state?.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // If no email is provided, redirect to login
  useEffect(() => {
    if (!email && !location.state?.email) {
      navigate('/login', { replace: true });
    }
  }, [email, location.state, navigate]);

  // Start countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6); // Only numbers, max 6 digits
    setVerificationCode(value);
    
    // Clear errors when user starts typing
    if (errors.verificationCode) {
      setErrors(prev => ({
        ...prev,
        verificationCode: ''
      }));
    }
    
    if (serverError) {
      setServerError('');
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    
    if (errors.email) {
      setErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
    
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Verification code validation
    if (!verificationCode.trim()) {
      newErrors.verificationCode = 'Verification code is required';
    } else if (verificationCode.length !== 6) {
      newErrors.verificationCode = 'Verification code must be 6 digits';
    } else if (!/^\d{6}$/.test(verificationCode)) {
      newErrors.verificationCode = 'Verification code must contain only numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const response = await axios.post('/api/auth/verify-email', {
        email: email.trim().toLowerCase(),
        verificationCode: verificationCode
      });

      const { token, user } = response.data;
      
      // Login the user after successful verification
      login(token, user);
      
      // Navigate to intended destination or home
      const intendedPath = new URLSearchParams(window.location.search).get('redirect') || '/';
      navigate(intendedPath, { replace: true });
      
    } catch (error) {
      console.error('Verification error:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          // Handle specific field errors
          if (data.errors) {
            setErrors(data.errors);
          } else {
            setServerError(data.message || 'Verification failed. Please check your code.');
          }
        } else if (status === 404) {
          setServerError('Account not found. Please check your email address.');
        } else if (status >= 500) {
          setServerError('Server error. Please try again later.');
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
      } else if (error.request) {
        setServerError('Unable to connect to server. Please check your internet connection.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required to resend code' }));
      return;
    }

    setResendLoading(true);
    setResendMessage('');
    setServerError('');

    try {
      await axios.post('/api/auth/resend-verification', {
        email: email.trim().toLowerCase()
      });

      setResendMessage('Verification code sent! Please check your email.');
      setTimeLeft(60); // 60 second cooldown
      
    } catch (error) {
      console.error('Resend error:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 || status === 404) {
          setServerError(data.message || 'Failed to resend verification code.');
        } else {
          setServerError('Server error. Please try again later.');
        }
      } else {
        setServerError('Unable to connect to server. Please check your internet connection.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card fade-in">
          {/* Header */}
          <div className="auth-header">
            <h1>Verify Your Email</h1>
            <p>We've sent a 6-digit verification code to your email address.</p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading || resendLoading}
                required
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            {/* Verification Code Field */}
            <div className="form-group">
              <label htmlFor="verificationCode" className="form-label">
                Verification Code
              </label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                value={verificationCode}
                onChange={handleChange}
                className={`form-input ${errors.verificationCode ? 'error' : ''}`}
                placeholder="Enter 6-digit code"
                autoComplete="one-time-code"
                disabled={loading || resendLoading}
                maxLength="6"
                style={{ 
                  textAlign: 'center', 
                  fontSize: '1.5rem', 
                  letterSpacing: '0.5rem',
                  fontFamily: 'monospace'
                }}
                required
              />
              {errors.verificationCode && (
                <span className="error-message">{errors.verificationCode}</span>
              )}
              {serverError && (
                <span className="error-message">{serverError}</span>
              )}
            </div>

            {/* Resend Message */}
            {resendMessage && (
              <div className="form-group">
                <div className="success-message">{resendMessage}</div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
              disabled={loading || resendLoading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend Code */}
            <div className="form-group" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p>
                Didn't receive the code?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={handleResendCode}
                  disabled={loading || resendLoading || timeLeft > 0}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
                    opacity: timeLeft > 0 ? 0.6 : 1
                  }}
                >
                  {resendLoading ? (
                    'Sending...'
                  ) : timeLeft > 0 ? (
                    `Resend in ${timeLeft}s`
                  ) : (
                    'Resend Code'
                  )}
                </button>
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Need help?{' '}
              <Link to="/login" className="auth-link">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;
