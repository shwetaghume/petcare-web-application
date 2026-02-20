const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Adoption = require('../models/Adoption');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/id-proofs';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only pdf and jpeg files
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'image/jpeg' || 
      file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and JPEG files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /api/adoptions/admin - Get all adoption applications (admin only)
router.get('/admin', auth, adminAuth, async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20, // Reduced default limit for better performance
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100); // Cap limit at 100

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Use Promise.all to run queries in parallel for better performance
    const [total, adoptions] = await Promise.all([
      Adoption.countDocuments(filter),
      Adoption.find(filter)
        .populate({
          path: 'pet',
          select: 'name breed age gender size image category',
          options: { lean: true } // Use lean() for better performance
        })
        .populate({
          path: 'applicant',
          select: 'name email phone',
          options: { lean: true }
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean() // Use lean() for main query too
    ]);

    res.json({
      adoptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching adoptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/adoptions/user - Get user's adoption applications
router.get('/user', auth, async (req, res) => {
  try {
    const adoptions = await Adoption.find({ applicant: req.user.id })
      .populate('pet', 'name breed age gender size image category')
      .sort({ createdAt: -1 });

    res.json(adoptions);
  } catch (error) {
    console.error('Error fetching user adoptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/adoptions/:id - Get specific adoption application
router.get('/:id', auth, async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id)
      .populate('pet', 'name breed age gender size image category description healthStatus');

    if (!adoption) {
      return res.status(404).json({ message: 'Adoption application not found' });
    }

    res.json(adoption);
  } catch (error) {
    console.error('Error fetching adoption:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Adoption application not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/adoptions - Create new adoption application
router.post('/', auth, upload.single('idProofFile'), async (req, res) => {
  try {
    // Log the received data for debugging
    console.log('Received form data:', req.body);
    console.log('Received file:', req.file);

    const {
      pet: petId,
      personalDetails,
      livingSituation,
      experience,
      reasonForAdoption,
      additionalNotes
    } = req.body;

    // Validate required fields
    if (!petId || !personalDetails || !livingSituation || !experience || !reasonForAdoption) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'Missing required fields',
        receivedData: req.body
      });
    }

    // Parse JSON strings back to objects
    const parsedPersonalDetails = typeof personalDetails === 'string' ? JSON.parse(personalDetails) : personalDetails;
    const parsedLivingSituation = typeof livingSituation === 'string' ? JSON.parse(livingSituation) : livingSituation;
    const parsedExperience = typeof experience === 'string' ? JSON.parse(experience) : experience;

    // Check if pet exists and is available - first try direct ID, then try string ID
    let pet = await Pet.findById(petId).catch(() => null);
    
    if (!pet) {
      // If not found by ObjectId, try finding by the string ID from sample data
      pet = await Pet.findOne({ _id: petId }).catch(() => null);
    }

    if (!pet) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Pet not found' });
    }

    if (pet.isAdopted) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'This pet has already been adopted' });
    }

    // Check if user has already applied for this pet
    const existingApplication = await Adoption.findOne({
      pet: petId,
      applicant: req.user.id,
      status: { $in: ['Pending', 'Approved'] }
    });

    if (existingApplication) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'You have already submitted an application for this pet' 
      });
    }

    // Add file path to personal details
    const updatedPersonalDetails = {
      ...parsedPersonalDetails,
      idProofFile: req.file.path
    };

    // Create new adoption application
    const adoption = new Adoption({
      pet: petId,
      applicant: req.user.id,
      personalDetails: updatedPersonalDetails,
      livingSituation: parsedLivingSituation,
      experience: parsedExperience,
      reasonForAdoption,
      additionalNotes,
      status: 'Pending'
    });

    await adoption.save();

    // Populate pet and applicant details for response
    await adoption.populate([
      { path: 'pet', select: 'name breed age gender size image category' },
      { path: 'applicant', select: 'name email phone' }
    ]);

    res.status(201).json({
      message: 'Adoption application submitted successfully',
      adoption
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating adoption application:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/adoptions/:id - Update adoption status (admin only)
router.patch('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Approved', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be: Pending, Approved, or Rejected' 
      });
    }

    const adoption = await Adoption.findById(req.params.id)
      .populate('pet', 'name breed age gender size image category')
      .populate('applicant', 'name email phone');
    
    if (!adoption) {
      return res.status(404).json({ message: 'Adoption application not found' });
    }

    // Store previous status to check if it changed
    const previousStatus = adoption.status;

    // Update fields if provided
    if (status) adoption.status = status;
    if (adminNotes !== undefined) adoption.adminNotes = adminNotes;
    adoption.updatedAt = new Date();

    await adoption.save();

    // If approved, mark pet as adopted
    if (status === 'Approved') {
      await Pet.findByIdAndUpdate(adoption.pet, { isAdopted: true });
    } else if (status === 'Rejected') {
      // If rejected, make pet available again (in case it was previously approved)
      await Pet.findByIdAndUpdate(adoption.pet, { isAdopted: false });
    }

    // Send email notification if status changed
    if (status && status !== previousStatus) {
      try {
        console.log(`📧 Sending ${status} notification email to ${adoption.applicant.email}`);
        
        // Construct full image URL if relative path is provided
        let petImageUrl = adoption.pet.image;
        if (petImageUrl && !petImageUrl.startsWith('http')) {
          // Convert relative path to full URL
          const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
          petImageUrl = `${baseUrl}/${petImageUrl}`;
        }
        
        const emailResult = await emailService.sendAdoptionStatusEmail(
          adoption.applicant.email,
          adoption.applicant.name,
          adoption.pet.name,
          status,
          petImageUrl,
          adminNotes || ''
        );
        
        if (emailResult.success) {
          console.log(`✅ Status notification email sent successfully to ${adoption.applicant.email}`);
          if (emailResult.previewUrl) {
            console.log(`📧 Email preview: ${emailResult.previewUrl}`);
          }
        } else {
          console.log(`⚠️  Email notification failed: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('❌ Error sending adoption status email:', emailError.message);
        // Don't fail the status update if email fails
      }
    }

    res.json({
      message: `Adoption application ${status.toLowerCase()} successfully`,
      adoption,
      emailSent: status && status !== previousStatus // Indicate if email was attempted
    });
  } catch (error) {
    console.error('Error updating adoption:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Adoption application not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/adoptions/:id - Delete adoption application (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) {
      return res.status(404).json({ message: 'Adoption application not found' });
    }

    await Adoption.findByIdAndDelete(req.params.id);

    res.json({ message: 'Adoption application deleted successfully' });
  } catch (error) {
    console.error('Error deleting adoption:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Adoption application not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/adoptions/pet/:petId - Get adoption applications for a specific pet (admin only)
router.get('/pet/:petId', auth, adminAuth, async (req, res) => {
  try {
    const adoptions = await Adoption.find({ pet: req.params.petId })
      .sort({ createdAt: -1 });

    res.json(adoptions);
  } catch (error) {
    console.error('Error fetching adoptions for pet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/adoptions - Get all adoptions (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const adoptions = await Adoption.find()
      .populate('pet', 'name breed age gender size image category')
      .populate('applicant', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(adoptions);
  } catch (error) {
    console.error('Error fetching adoptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/adoptions/admin/stats - Get adoption statistics (admin only)
router.get('/admin/stats', auth, adminAuth, async (req, res) => {
  try {
    const stats = await Promise.all([
      Adoption.countDocuments(),
      Adoption.countDocuments({ status: 'Pending' }),
      Adoption.countDocuments({ status: 'Approved' }),
      Adoption.countDocuments({ status: 'Rejected' }),
      Adoption.find({ status: 'Pending' })
        .populate('pet', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Adoption.find({ status: 'Approved' })
        .populate('pet', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      total: stats[0],
      pending: stats[1],
      approved: stats[2],
      rejected: stats[3],
      recentPending: stats[4],
      recentApproved: stats[5]
    });
  } catch (error) {
    console.error('Error fetching adoption stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 