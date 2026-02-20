const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  personalDetails: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number starting with 6-9']
    },
    idProofType: {
      type: String,
      required: [true, 'ID proof type is required'],
      enum: ['aadhar', 'pan']
    },
    idProofFile: {
      type: String,
      required: [true, 'ID proof file is required']
    }
  },
  livingSituation: {
    homeType: {
      type: String,
      required: true,
      enum: ['House', 'Apartment', 'Condo', 'Other']
    },
    hasYard: {
      type: Boolean,
      required: true
    },
    otherPets: {
      type: Boolean,
      required: true
    },
    otherPetsDetails: {
      type: String,
      required: function() {
        return this.livingSituation.otherPets;
      }
    }
  },
  experience: {
    hasExperience: {
      type: Boolean,
      required: true
    },
    experienceDetails: {
      type: String,
      required: function() {
        return this.experience.hasExperience;
      }
    }
  },
  reasonForAdoption: {
    type: String,
    required: true
  },
  additionalNotes: String,
  adminNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
adoptionSchema.index({ createdAt: -1 }); // For sorting by creation date
adoptionSchema.index({ status: 1 }); // For filtering by status
adoptionSchema.index({ pet: 1 }); // For queries by pet
adoptionSchema.index({ applicant: 1 }); // For queries by applicant
adoptionSchema.index({ status: 1, createdAt: -1 }); // Compound index for status filtering with sorting
adoptionSchema.index({ updatedAt: -1 }); // For sorting by update date

module.exports = mongoose.model('Adoption', adoptionSchema);
