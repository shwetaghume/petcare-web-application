const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Create safe filename from product name
const createSafeFileName = (productName, originalName) => {
  // Remove special characters and replace spaces with hyphens
  const safeName = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  // Get file extension
  const extension = path.extname(originalName);
  
  // Return formatted filename
  return `product-${safeName}${extension}`;
};

// Ensure upload directory exists
const ensureUploadDir = (uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
};

// Configure multer for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/products');
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Get product name from request body
    const productName = req.body.name || `product-${Date.now()}`;
    const safeFileName = createSafeFileName(productName, file.originalname);
    
    // Store the generated filename in request for later use
    if (!req.generatedFilenames) {
      req.generatedFilenames = [];
    }
    req.generatedFilenames.push(safeFileName);
    
    cb(null, safeFileName);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const productImageUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// Function to rename existing product images when product name changes
const renameProductImages = async (oldProductName, newProductName, currentImages) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads/products');
    const updatedImages = [];
    
    for (const imagePath of currentImages) {
      // Check if it's a file path (not URL)
      if (imagePath && !imagePath.startsWith('http')) {
        const oldFullPath = path.join(uploadsPath, imagePath);
        
        if (fs.existsSync(oldFullPath)) {
          const extension = path.extname(imagePath);
          const newFileName = createSafeFileName(newProductName, `temp${extension}`);
          const newFullPath = path.join(uploadsPath, newFileName);
          
          // Rename the file
          await fs.rename(oldFullPath, newFullPath);
          updatedImages.push(newFileName);
          console.log(`Renamed product image: ${imagePath} -> ${newFileName}`);
        } else {
          updatedImages.push(imagePath); // Keep original if file doesn't exist
        }
      } else {
        updatedImages.push(imagePath); // Keep URLs as they are
      }
    }
    
    return updatedImages;
  } catch (error) {
    console.error('Error renaming product images:', error);
    return currentImages; // Return original array on error
  }
};

// Function to delete product images
const deleteProductImages = async (imagePaths) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads/products');
    
    for (const imagePath of imagePaths) {
      if (imagePath && !imagePath.startsWith('http')) {
        const fullPath = path.join(uploadsPath, imagePath);
        
        if (fs.existsSync(fullPath)) {
          await fs.remove(fullPath);
          console.log(`Deleted product image: ${imagePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error deleting product images:', error);
  }
};

// Middleware to handle product image processing after upload
const processProductImages = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    // Convert uploaded files to relative paths for storage
    req.body.uploadedImages = req.files.map(file => file.filename);
    
    // If there were existing images in the request, combine them
    if (req.body.existingImages) {
      try {
        const existingImages = Array.isArray(req.body.existingImages) 
          ? req.body.existingImages 
          : JSON.parse(req.body.existingImages);
        req.body.images = [...existingImages, ...req.body.uploadedImages];
      } catch (error) {
        req.body.images = req.body.uploadedImages;
      }
    } else {
      req.body.images = req.body.uploadedImages;
    }
  }
  
  next();
};

module.exports = {
  productImageUpload,
  renameProductImages,
  deleteProductImages,
  processProductImages,
  createSafeFileName
};
