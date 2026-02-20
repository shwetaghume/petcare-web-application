const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { 
  productImageUpload, 
  renameProductImages, 
  deleteProductImages, 
  processProductImages 
} = require('../middleware/productImageUpload');
const path = require('path');
const fs = require('fs');

// Serve uploaded product images
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, '../uploads/products', filename);
  
  // Check if file exists
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ message: 'Image not found' });
  }
});

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { category, petType, search, sort, page = 1, limit = 12, includeOutOfStock } = req.query;
    
    // Build query
    let query = {};
    
    // Only exclude out of stock if not specifically requested to include them
    // Admin panel requests includeOutOfStock=true to see all products
    if (!includeOutOfStock || includeOutOfStock !== 'true') {
      query.stockQuantity = { $gt: 0 };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (petType && petType !== 'all') {
      query.petType = { $in: [petType, 'All'] };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'price-low':
        sortQuery.price = 1;
        break;
      case 'price-high':
        sortQuery.price = -1;
        break;
      case 'rating':
        sortQuery.averageRating = -1;
        break;
      case 'newest':
        sortQuery.createdAt = -1;
        break;
      default:
        sortQuery.name = 1;
    }
    
    const products = await Product.find(query)
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviews.user', 'name');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ featured: true, stockQuantity: { $gt: 0 } })
      .limit(8)
      .populate('reviews.user', 'name');
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching featured products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'name');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a review to a product
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user.id
    );
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    
    // Add new review
    product.reviews.push({
      user: req.user.id,
      rating,
      comment
    });
    
    // Update rating
    product.updateRating();
    
    await product.save();
    
    // Populate the new review
    await product.populate('reviews.user', 'name');
    
    res.status(201).json(product);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to conditionally apply multer based on content-type
const conditionalMulter = (req, res, next) => {
  const contentType = req.get('Content-Type');
  
  if (contentType && contentType.includes('multipart/form-data')) {
    // Use multer for multipart/form-data (file uploads)
    productImageUpload.array('images', 5)(req, res, (err) => {
      if (err) {
        return next(err);
      }
      processProductImages(req, res, next);
    });
  } else {
    // Skip multer for JSON requests
    next();
  }
};

// Create a new product with image upload (admin only)
router.post('/', auth, adminAuth, conditionalMulter, async (req, res) => {
  try {
    // Handle petType conversion from FormData (string) to array
    if (req.body.petType && typeof req.body.petType === 'string') {
      // If petType is a JSON string, parse it
      if (req.body.petType.startsWith('[') && req.body.petType.endsWith(']')) {
        req.body.petType = JSON.parse(req.body.petType);
      } else {
        // If petType is a single string, convert to array
        req.body.petType = [req.body.petType];
      }
    }
    
    // Handle field name mapping - frontend sends 'prescriptionRequired' but model expects 'requiresPrescription'
    if (req.body.requiresPrescription !== undefined) {
      // Convert string to boolean if needed
      if (typeof req.body.requiresPrescription === 'string') {
        req.body.requiresPrescription = req.body.requiresPrescription === 'true';
      }
    }
    
    // Handle ingredients conversion from string to array
    if (req.body.ingredients && typeof req.body.ingredients === 'string' && req.body.ingredients.trim()) {
      // Split by comma and clean up
      req.body.ingredients = req.body.ingredients.split(',').map(ingredient => ingredient.trim()).filter(ingredient => ingredient);
    } else if (!req.body.ingredients) {
      req.body.ingredients = [];
    }
    
    // Handle image URLs for URL-based uploads
    if (req.body.imageType === 'url' && req.body.images) {
      // Parse JSON string to array if needed
      if (typeof req.body.images === 'string') {
        try {
          req.body.images = JSON.parse(req.body.images);
        } catch (e) {
          req.body.images = [req.body.images];
        }
      }
      // Ensure it's an array
      if (!Array.isArray(req.body.images)) {
        req.body.images = [req.body.images];
      }
      // Set primary image if not already set
      if (!req.body.image && req.body.images.length > 0) {
        req.body.image = req.body.images[0];
      }
    }
    
    // Set image type and primary image for uploaded files
    if (req.files && req.files.length > 0) {
      req.body.imageType = 'upload';
      req.body.images = req.files.map(file => `uploads/products/${file.filename}`);
      req.body.image = req.body.images[0]; // Set first image as primary
    }
    
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    
    // Clean up uploaded files if product creation failed
    if (req.files && req.files.length > 0) {
      await deleteProductImages(req.files.map(file => file.filename));
    }
    
    res.status(400).json({ message: 'Error creating product', error: err.message });
  }
});

// Update a product with optional image upload (admin only)
router.put('/:id', auth, adminAuth, productImageUpload.array('images', 5), processProductImages, async (req, res) => {
  try {
    // Handle petType conversion from FormData (string) to array
    if (req.body.petType && typeof req.body.petType === 'string') {
      // If petType is a JSON string, parse it
      if (req.body.petType.startsWith('[') && req.body.petType.endsWith(']')) {
        req.body.petType = JSON.parse(req.body.petType);
      } else {
        // If petType is a single string, convert to array
        req.body.petType = [req.body.petType];
      }
    }
    
    // Handle field name mapping - frontend sends 'prescriptionRequired' but model expects 'requiresPrescription'
    if (req.body.requiresPrescription !== undefined) {
      // Convert string to boolean if needed
      if (typeof req.body.requiresPrescription === 'string') {
        req.body.requiresPrescription = req.body.requiresPrescription === 'true';
      }
    }
    
    // Handle ingredients conversion from string to array
    if (req.body.ingredients && typeof req.body.ingredients === 'string' && req.body.ingredients.trim()) {
      // Split by comma and clean up
      req.body.ingredients = req.body.ingredients.split(',').map(ingredient => ingredient.trim()).filter(ingredient => ingredient);
    } else if (!req.body.ingredients) {
      req.body.ingredients = [];
    }
    
    // Handle image URLs for URL-based uploads (same logic as create)
    if (req.body.imageType === 'url' && req.body.images) {
      // Parse JSON string to array if needed
      if (typeof req.body.images === 'string') {
        try {
          req.body.images = JSON.parse(req.body.images);
        } catch (e) {
          req.body.images = [req.body.images];
        }
      }
      // Ensure it's an array
      if (!Array.isArray(req.body.images)) {
        req.body.images = [req.body.images];
      }
      // Set primary image if not already set
      if (!req.body.image && req.body.images.length > 0) {
        req.body.image = req.body.images[0];
      }
    }
    
    const productId = req.params.id;
    const oldProduct = await Product.findById(productId);
    
    if (!oldProduct) {
      // Clean up uploaded files if product not found
      if (req.files && req.files.length > 0) {
        await deleteProductImages(req.files.map(file => file.filename));
      }
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Handle image updates
    if (req.files && req.files.length > 0) {
      // New images uploaded - delete old images and use new ones
      if (oldProduct.imageType === 'upload') {
        const oldImagePaths = [];
        if (oldProduct.image) oldImagePaths.push(oldProduct.image.replace('uploads/products/', ''));
        if (oldProduct.images) {
          oldImagePaths.push(...oldProduct.images.map(img => img.replace('uploads/products/', '')));
        }
        await deleteProductImages([...new Set(oldImagePaths)]);
      }
      
      // Set new images
      req.body.imageType = 'upload';
      req.body.images = req.files.map(file => `uploads/products/${file.filename}`);
      req.body.image = req.body.images[0];
      
    } else if (req.body.name !== oldProduct.name && oldProduct.imageType === 'upload') {
      // Name changed but no new images - rename existing files
      try {
        const currentImagePaths = [];
        if (oldProduct.image) currentImagePaths.push(oldProduct.image.replace('uploads/products/', ''));
        if (oldProduct.images) {
          currentImagePaths.push(...oldProduct.images.map(img => img.replace('uploads/products/', '')));
        }
        
        if (currentImagePaths.length > 0) {
          const updatedImages = await renameProductImages(
            oldProduct.name,
            req.body.name,
            [...new Set(currentImagePaths)]
          );
          
          req.body.images = updatedImages.map(img => `uploads/products/${img}`);
          req.body.image = req.body.images[0];
        }
      } catch (error) {
        console.error('Error renaming product images:', error);
        // Continue with update even if rename fails
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    
    // Clean up uploaded files if update failed
    if (req.files && req.files.length > 0) {
      await deleteProductImages(req.files.map(file => file.filename));
    }
    
    res.status(400).json({ message: 'Error updating product', error: err.message });
  }
});

// Delete a product (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete associated image files
    const imagesToDelete = [];
    if (product.image) imagesToDelete.push(product.image);
    if (product.images && product.images.length > 0) {
      imagesToDelete.push(...product.images);
    }
    
    // Remove duplicates
    const uniqueImages = [...new Set(imagesToDelete)];
    
    uniqueImages.forEach(imageUrl => {
      const imagePath = path.join(__dirname, '..', imageUrl);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.error('Error deleting product image:', error);
        }
      }
    });
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 