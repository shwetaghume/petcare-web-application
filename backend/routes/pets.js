const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const Adoption = require('../models/Adoption');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadPetImage, generateImageUrl, renameExistingImages } = require('../middleware/imageUpload');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Get all pets with optional category filter
router.get('/', async (req, res) => {
  try {
    const { category, includeAdopted } = req.query;
    const query = {};
    
    // Only exclude adopted pets if not specifically requested to include them
    if (!includeAdopted || includeAdopted !== 'true') {
      query.isAdopted = false;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const pets = await Pet.find(query).sort({ createdAt: -1 });
    res.json(pets);
  } catch (err) {
    console.error('Error fetching pets:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific pet by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid pet ID' });
    }
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    res.json(pet);
  } catch (err) {
    console.error('Error fetching pet:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit adoption application
router.post('/:id/adopt', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    if (pet.isAdopted) {
      return res.status(400).json({ message: 'This pet has already been adopted' });
    }

    // Check if user already has a pending application for this pet
    const existingApplication = await Adoption.findOne({
      pet: req.params.id,
      applicant: req.user.id,
      status: 'Pending'
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending application for this pet' });
    }

    const adoption = new Adoption({
      pet: req.params.id,
      applicant: req.user.id,
      ...req.body
    });

    await adoption.save();
    res.status(201).json(adoption);
  } catch (err) {
    console.error('Error submitting adoption application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get adoption applications for a specific pet (admin only)
router.get('/:id/applications', auth, adminAuth, async (req, res) => {
  try {
    const applications = await Adoption.find({ pet: req.params.id })
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update adoption application status (admin only)
router.patch('/:id/applications/:applicationId', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Adoption.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // If approved, mark pet as adopted
    if (status === 'Approved') {
      await Pet.findByIdAndUpdate(req.params.id, { isAdopted: true });
    }

    res.json(application);
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new pet with image upload (admin only)
router.post('/', auth, adminAuth, uploadPetImage, generateImageUrl('pets'), async (req, res) => {
  try {
    const pet = new Pet(req.body);
    await pet.save();
    
    res.status(201).json(pet);
  } catch (err) {
    console.error('Error creating pet:', err);
    
    // Clean up uploaded file if pet creation failed
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'pets', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(400).json({ message: 'Error creating pet', error: err.message });
  }
});

// Update a pet with optional image upload (admin only)
router.put('/:id', auth, adminAuth, uploadPetImage, generateImageUrl('pets'), async (req, res) => {
  try {
    const petId = req.params.id;
    
    // Handle non-MongoDB ObjectId cases (for sample data)
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      return res.status(400).json({ 
        message: 'Invalid pet ID format. This appears to be sample data. Please use real pets from the database.' 
      });
    }
    
    const oldPet = await Pet.findById(petId);
    
    if (!oldPet) {
      // Clean up uploaded file if pet not found
      if (req.file) {
        const filePath = path.join(__dirname, '..', 'uploads', 'pets', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    // If name has changed and no new image uploaded, rename existing image
    if (req.body.name !== oldPet.name && !req.file && oldPet.image) {
      try {
        const updatedImages = await renameExistingImages(
          oldPet.name, 
          req.body.name, 
          'pets', 
          [oldPet.image]
        );
        req.body.image = updatedImages[0];
      } catch (error) {
        console.error('Error renaming pet image:', error);
        // Continue with update even if rename fails
      }
    }
    
    // If new image uploaded and old image exists, delete old image
    if (req.file && oldPet.image) {
      const oldImagePath = path.join(__dirname, '..', oldPet.image);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (error) {
          console.error('Error deleting old pet image:', error);
        }
      }
    }
    
    const pet = await Pet.findByIdAndUpdate(
      petId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(pet);
  } catch (err) {
    console.error('Error updating pet:', err);
    
    // Clean up uploaded file if update failed
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'pets', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(400).json({ message: 'Error updating pet', error: err.message });
  }
});

// Delete a pet (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    // Delete associated image file
    if (pet.image) {
      const imagePath = path.join(__dirname, '..', pet.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.error('Error deleting pet image:', error);
        }
      }
    }
    
    await Pet.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Pet deleted successfully' });
  } catch (err) {
    console.error('Error deleting pet:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
