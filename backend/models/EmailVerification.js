const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  verificationCode: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    index: { expires: 0 } // MongoDB TTL index to automatically delete expired documents
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 verification attempts
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
emailVerificationSchema.index({ email: 1, verificationCode: 1 });
emailVerificationSchema.index({ email: 1, verified: 1 });

// Static method to generate a secure 6-digit code
emailVerificationSchema.statics.generateVerificationCode = function() {
  // Generate a secure random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create new verification record
emailVerificationSchema.statics.createVerificationCode = async function(email) {
  try {
    // Delete any existing verification codes for this email
    await this.deleteMany({ email: email.toLowerCase().trim() });
    
    // Generate new code
    const verificationCode = this.generateVerificationCode();
    
    // Create new verification record
    const verification = new this({
      email: email.toLowerCase().trim(),
      verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    await verification.save();
    return verification;
  } catch (error) {
    throw new Error(`Failed to create verification code: ${error.message}`);
  }
};

// Method to verify code
emailVerificationSchema.methods.verifyCode = async function(inputCode) {
  try {
    // Check if code is expired
    if (new Date() > this.expiresAt) {
      throw new Error('Verification code has expired');
    }
    
    // Check if already verified
    if (this.verified) {
      throw new Error('Code has already been used');
    }
    
    // Check max attempts
    if (this.attempts >= 5) {
      throw new Error('Maximum verification attempts exceeded');
    }
    
    // Increment attempts
    this.attempts += 1;
    
    // Check if code matches
    if (this.verificationCode !== inputCode.toString()) {
      await this.save();
      throw new Error(`Invalid verification code. ${5 - this.attempts} attempts remaining.`);
    }
    
    // Mark as verified
    this.verified = true;
    await this.save();
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Static method to verify code by email
emailVerificationSchema.statics.verifyByEmail = async function(email, code) {
  try {
    const verification = await this.findOne({
      email: email.toLowerCase().trim(),
      verified: false
    }).sort({ createdAt: -1 }); // Get the latest verification record
    
    if (!verification) {
      throw new Error('No active verification code found for this email');
    }
    
    return await verification.verifyCode(code);
  } catch (error) {
    throw error;
  }
};

// Static method to check if email has valid verification
emailVerificationSchema.statics.isEmailVerified = async function(email) {
  try {
    const verification = await this.findOne({
      email: email.toLowerCase().trim(),
      verified: true
    }).sort({ createdAt: -1 });
    
    return !!verification;
  } catch (error) {
    return false;
  }
};

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
