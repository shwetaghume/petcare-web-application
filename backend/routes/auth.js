const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const emailService = require('../services/emailService');
const { auth, adminAuth } = require('../middleware/auth');

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateName = (name) => {
  // Only letters and spaces, 2-50 characters
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Validate name
    if (!validateName(name)) {
      return res.status(400).json({ 
        message: 'Invalid name format',
        errors: { name: 'Name must be 2-50 characters and contain only letters and spaces' }
      });
    }

    // Validate email
    if (!validateEmail(email.toLowerCase().trim())) {
      return res.status(400).json({ 
        message: 'Invalid email format',
        errors: { email: 'Please enter a valid email address' }
      });
    }

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password does not meet requirements',
        errors: { 
          password: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' 
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists',
        errors: { email: 'An account with this email address already exists' }
      });
    }

    // Create new user (but don't save yet)
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      emailVerified: false,
      emailVerificationRequired: true
    });

    // Save user first
    await user.save();

    try {
      // Generate and send verification code
      const verification = await EmailVerification.createVerificationCode(normalizedEmail);
      
      // Send verification email
      const emailResult = await emailService.sendVerificationEmail(
        normalizedEmail, 
        verification.verificationCode, 
        user.name
      );

      console.log('📧 Verification email sent:', {
        email: normalizedEmail,
        messageId: emailResult.messageId,
        previewUrl: emailResult.previewUrl
      });

      // Return response without JWT token - user must verify email first
      res.status(201).json({
        message: 'Registration successful! Please check your email for verification code.',
        requiresVerification: true,
        email: normalizedEmail,
        // Do not include user details or token - verification required first
        // Include preview URL for development/testing
        ...(process.env.NODE_ENV === 'development' && emailResult.previewUrl ? {
          emailPreview: emailResult.previewUrl
        } : {})
      });

    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError.message);
      
      // If email fails, delete the user to prevent orphaned accounts
      await User.findByIdAndDelete(user._id);
      
      res.status(500).json({
        message: 'Registration failed - unable to send verification email',
        error: 'Email service unavailable. Please try again later.'
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle duplicate key error (just in case)
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'User already exists',
        errors: { email: 'An account with this email address already exists' }
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid email or password'
      });
    }

    // Check if email verification is required and not verified
    if (user.emailVerificationRequired && !user.emailVerified) {
      return res.status(403).json({
        message: 'Email verification required',
        requiresVerification: true,
        email: user.email,
        error: 'Please verify your email address before logging in. Check your email for the verification code.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        emailVerified: user.emailVerified,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server error during login'
    });
  }
});

// Verify email with 6-digit code
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Input validation
    if (!email || !verificationCode) {
      return res.status(400).json({
        message: 'Email and verification code are required',
        errors: {
          email: !email ? 'Email is required' : null,
          verificationCode: !verificationCode ? 'Verification code is required' : null
        }
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        errors: { email: 'Please enter a valid email address' }
      });
    }

    // Validate verification code format (6 digits)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(verificationCode)) {
      return res.status(400).json({
        message: 'Invalid verification code format',
        errors: { verificationCode: 'Verification code must be 6 digits' }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: { email: 'No account found with this email address' }
      });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        message: 'Email is already verified',
        errors: { verificationCode: 'This email address has already been verified' }
      });
    }

    try {
      // Verify the code
      await EmailVerification.verifyByEmail(normalizedEmail, verificationCode);
      
      // Mark user email as verified
      await user.verifyEmail();
      
      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(normalizedEmail, user.name);
      } catch (welcomeEmailError) {
        console.error('Failed to send welcome email:', welcomeEmailError.message);
        // Don't fail the verification if welcome email fails
      }
      
      // Generate JWT token for the verified user
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({
        message: 'Email verified successfully! Welcome to PetCare!',
        verified: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt,
          isAdmin: user.isAdmin
        }
      });
      
    } catch (verificationError) {
      return res.status(400).json({
        message: 'Email verification failed',
        errors: { verificationCode: verificationError.message }
      });
    }
    
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({
      message: 'Server error during email verification',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        errors: { email: 'Email address is required' }
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        errors: { email: 'Please enter a valid email address' }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errors: { email: 'No account found with this email address' }
      });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        message: 'Email is already verified',
        errors: { email: 'This email address has already been verified' }
      });
    }

    try {
      // Generate new verification code
      const verification = await EmailVerification.createVerificationCode(normalizedEmail);
      
      // Send verification email
      const emailResult = await emailService.sendVerificationEmail(
        normalizedEmail,
        verification.verificationCode,
        user.name
      );

      console.log('📧 Verification email resent:', {
        email: normalizedEmail,
        messageId: emailResult.messageId,
        previewUrl: emailResult.previewUrl
      });
      
      res.json({
        message: 'Verification code sent successfully! Please check your email.',
        email: normalizedEmail,
        // Include preview URL for development/testing
        ...(process.env.NODE_ENV === 'development' && emailResult.previewUrl ? {
          emailPreview: emailResult.previewUrl
        } : {})
      });
      
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError.message);
      res.status(500).json({
        message: 'Failed to send verification email',
        error: 'Email service unavailable. Please try again later.'
      });
    }
    
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({
      message: 'Server error during resend verification',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
