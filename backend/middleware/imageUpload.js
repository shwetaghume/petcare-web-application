const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Utility function to create safe filename from name
const createSafeFileName = (name, index = null) => {
  // Remove special characters and replace spaces with hyphens
  let safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
  
  // Add index if provided (for multiple images)
  if (index !== null) {
    safeName += `-${index + 1}`;
  }
  
  return safeName;
};

// Configure storage for pets
const petStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'pets');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const petName = req.body.name || 'unnamed-pet';
    const safeFileName = createSafeFileName(petName);
    const extension = path.extname(file.originalname);
    const fileName = `${safeFileName}${extension}`;
    
    // Store the generated filename in req for later use
    req.generatedFileName = fileName;
    
    cb(null, fileName);
  }
});

// Configure storage for products
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const productName = req.body.name || 'unnamed-product';
    const safeFileName = createSafeFileName(productName);
    const extension = path.extname(file.originalname);
    
    // Handle multiple images
    const existingFiles = req.uploadedFiles || [];
    const index = existingFiles.length;
    const fileName = index === 0 ? 
      `${safeFileName}${extension}` : 
      `${safeFileName}-${index + 1}${extension}`;
    
    // Track uploaded files
    if (!req.uploadedFiles) {
      req.uploadedFiles = [];
    }
    req.uploadedFiles.push(fileName);
    
    cb(null, fileName);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer for pets (single image)
const uploadPetImage = multer({
  storage: petStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for products (multiple images)
const uploadProductImages = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Max 5 images per product
  },
  fileFilter: fileFilter
});

// Middleware to handle image URL generation
const generateImageUrl = (folder) => {
  return (req, res, next) => {
    if (req.file) {
      // Single file upload
      req.body.image = `/uploads/${folder}/${req.file.filename}`;
    } else if (req.files && req.files.length > 0) {
      // Multiple file upload
      req.body.images = req.files.map(file => `/uploads/${folder}/${file.filename}`);
      // Set the first image as the main image
      req.body.image = req.body.images[0];
    }
    next();
  };
};

// Function to rename existing images when name changes
const renameExistingImages = async (oldName, newName, folder, images) => {
  const uploadsPath = path.join(__dirname, '..', 'uploads', folder);
  const updatedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    const oldImagePath = path.join(__dirname, '..', images[i]);
    const extension = path.extname(images[i]);
    
    const newFileName = i === 0 ? 
      `${createSafeFileName(newName)}${extension}` : 
      `${createSafeFileName(newName)}-${i + 1}${extension}`;
    
    const newImagePath = path.join(uploadsPath, newFileName);
    const newImageUrl = `/uploads/${folder}/${newFileName}`;
    
    try {
      // Check if old file exists and rename it
      if (fs.existsSync(oldImagePath)) {
        fs.renameSync(oldImagePath, newImagePath);
        updatedImages.push(newImageUrl);
      } else {
        // If old file doesn't exist, keep the original path
        updatedImages.push(images[i]);
      }
    } catch (error) {
      console.error(`Error renaming image: ${error.message}`);
      // If rename fails, keep the original path
      updatedImages.push(images[i]);
    }
  }
  
  return updatedImages;
};

module.exports = {
  uploadPetImage: uploadPetImage.single('image'),
  uploadProductImages: uploadProductImages.array('images', 5),
  generateImageUrl,
  createSafeFileName,
  renameExistingImages
};
