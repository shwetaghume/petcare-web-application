const fs = require('fs');
const path = require('path');
const Pet = require('../models/Pet');
const Product = require('../models/Product');

class ImageService {
  /**
   * Generate safe filename from name
   * @param {string} name - The original name
   * @param {number} index - Index for multiple images (optional)
   * @returns {string} Safe filename
   */
  static createSafeFileName(name, index = null) {
    let safeName = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
    
    if (index !== null) {
      safeName += `-${index + 1}`;
    }
    
    return safeName;
  }

  /**
   * Rename images based on new product/pet name
   * @param {string} oldName - Previous name
   * @param {string} newName - New name
   * @param {string} folder - Folder type ('pets' or 'products')
   * @param {Array} images - Array of image URLs
   * @returns {Promise<Array>} Updated image URLs
   */
  static async renameImages(oldName, newName, folder, images) {
    const uploadsPath = path.join(__dirname, '..', 'uploads', folder);
    const updatedImages = [];
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    
    for (let i = 0; i < images.length; i++) {
      const oldImagePath = path.join(__dirname, '..', images[i]);
      const extension = path.extname(images[i]);
      
      const newFileName = i === 0 ? 
        `${this.createSafeFileName(newName)}${extension}` : 
        `${this.createSafeFileName(newName)}-${i + 1}${extension}`;
      
      const newImagePath = path.join(uploadsPath, newFileName);
      const newImageUrl = `/uploads/${folder}/${newFileName}`;
      
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.renameSync(oldImagePath, newImagePath);
          updatedImages.push(newImageUrl);
          console.log(`✅ Renamed: ${images[i]} → ${newImageUrl}`);
        } else {
          console.warn(`⚠️  File not found: ${oldImagePath}`);
          updatedImages.push(images[i]); // Keep original if file doesn't exist
        }
      } catch (error) {
        console.error(`❌ Error renaming ${images[i]}:`, error.message);
        updatedImages.push(images[i]); // Keep original on error
      }
    }
    
    return updatedImages;
  }

  /**
   * Clean up orphaned image files that don't belong to any pet or product
   * @returns {Promise<Object>} Cleanup results
   */
  static async cleanupOrphanedImages() {
    const results = {
      petsChecked: 0,
      productsChecked: 0,
      filesDeleted: 0,
      errors: []
    };

    try {
      // Get all pets and products from database
      const pets = await Pet.find({}, 'image').lean();
      const products = await Product.find({}, 'image images').lean();

      // Collect all valid image URLs
      const validImages = new Set();
      
      pets.forEach(pet => {
        if (pet.image) {
          validImages.add(pet.image);
        }
        results.petsChecked++;
      });

      products.forEach(product => {
        if (product.image) {
          validImages.add(product.image);
        }
        if (product.images && product.images.length > 0) {
          product.images.forEach(img => validImages.add(img));
        }
        results.productsChecked++;
      });

      // Check pets folder
      const petsDir = path.join(__dirname, '..', 'uploads', 'pets');
      if (fs.existsSync(petsDir)) {
        const petFiles = fs.readdirSync(petsDir);
        for (const file of petFiles) {
          const fileUrl = `/uploads/pets/${file}`;
          if (!validImages.has(fileUrl)) {
            try {
              fs.unlinkSync(path.join(petsDir, file));
              results.filesDeleted++;
              console.log(`🗑️  Deleted orphaned pet image: ${file}`);
            } catch (error) {
              results.errors.push(`Error deleting ${file}: ${error.message}`);
            }
          }
        }
      }

      // Check products folder
      const productsDir = path.join(__dirname, '..', 'uploads', 'products');
      if (fs.existsSync(productsDir)) {
        const productFiles = fs.readdirSync(productsDir);
        for (const file of productFiles) {
          const fileUrl = `/uploads/products/${file}`;
          if (!validImages.has(fileUrl)) {
            try {
              fs.unlinkSync(path.join(productsDir, file));
              results.filesDeleted++;
              console.log(`🗑️  Deleted orphaned product image: ${file}`);
            } catch (error) {
              results.errors.push(`Error deleting ${file}: ${error.message}`);
            }
          }
        }
      }

    } catch (error) {
      results.errors.push(`Cleanup error: ${error.message}`);
    }

    return results;
  }

  /**
   * Migrate existing images to name-based filenames
   * @returns {Promise<Object>} Migration results
   */
  static async migrateToNameBasedImages() {
    const results = {
      petsProcessed: 0,
      productsProcessed: 0,
      petsRenamed: 0,
      productsRenamed: 0,
      errors: []
    };

    try {
      // Migrate pets
      const pets = await Pet.find({});
      
      for (const pet of pets) {
        results.petsProcessed++;
        
        if (pet.image) {
          const currentImagePath = path.join(__dirname, '..', pet.image);
          
          if (fs.existsSync(currentImagePath)) {
            const extension = path.extname(pet.image);
            const newFileName = `${this.createSafeFileName(pet.name)}${extension}`;
            const newImagePath = path.join(__dirname, '..', 'uploads', 'pets', newFileName);
            const newImageUrl = `/uploads/pets/${newFileName}`;
            
            // Only rename if the filename would be different
            if (pet.image !== newImageUrl) {
              try {
                // Create directory if it doesn't exist
                const petsDir = path.join(__dirname, '..', 'uploads', 'pets');
                if (!fs.existsSync(petsDir)) {
                  fs.mkdirSync(petsDir, { recursive: true });
                }
                
                // Rename file
                fs.renameSync(currentImagePath, newImagePath);
                
                // Update database
                await Pet.findByIdAndUpdate(pet._id, { image: newImageUrl });
                
                results.petsRenamed++;
                console.log(`✅ Pet migrated: ${pet.name} - ${pet.image} → ${newImageUrl}`);
              } catch (error) {
                results.errors.push(`Error migrating pet ${pet.name}: ${error.message}`);
              }
            }
          }
        }
      }

      // Migrate products
      const products = await Product.find({});
      
      for (const product of products) {
        results.productsProcessed++;
        
        const imagesToMigrate = [];
        if (product.image) imagesToMigrate.push(product.image);
        if (product.images && product.images.length > 0) {
          imagesToMigrate.push(...product.images.filter(img => img !== product.image));
        }
        
        if (imagesToMigrate.length > 0) {
          try {
            const newImageUrls = await this.renameImages(
              product.name, // Using current name as "old name"
              product.name, // And same as "new name" to standardize
              'products',
              imagesToMigrate
            );
            
            // Update database
            await Product.findByIdAndUpdate(product._id, {
              image: newImageUrls[0],
              images: newImageUrls
            });
            
            results.productsRenamed++;
            console.log(`✅ Product migrated: ${product.name}`);
          } catch (error) {
            results.errors.push(`Error migrating product ${product.name}: ${error.message}`);
          }
        }
      }

    } catch (error) {
      results.errors.push(`Migration error: ${error.message}`);
    }

    return results;
  }

  /**
   * Get image statistics
   * @returns {Promise<Object>} Image statistics
   */
  static async getImageStats() {
    const stats = {
      totalPets: 0,
      petsWithImages: 0,
      totalProducts: 0,
      productsWithImages: 0,
      totalImageFiles: 0,
      diskUsage: 0,
      orphanedFiles: 0
    };

    try {
      // Database stats
      const pets = await Pet.find({}, 'image').lean();
      const products = await Product.find({}, 'image images').lean();

      stats.totalPets = pets.length;
      stats.petsWithImages = pets.filter(p => p.image).length;
      stats.totalProducts = products.length;
      stats.productsWithImages = products.filter(p => p.image || (p.images && p.images.length > 0)).length;

      // File system stats
      const validImages = new Set();
      
      pets.forEach(pet => {
        if (pet.image) validImages.add(pet.image);
      });

      products.forEach(product => {
        if (product.image) validImages.add(product.image);
        if (product.images && product.images.length > 0) {
          product.images.forEach(img => validImages.add(img));
        }
      });

      // Check pets directory
      const petsDir = path.join(__dirname, '..', 'uploads', 'pets');
      if (fs.existsSync(petsDir)) {
        const petFiles = fs.readdirSync(petsDir);
        for (const file of petFiles) {
          const filePath = path.join(petsDir, file);
          const fileStats = fs.statSync(filePath);
          stats.totalImageFiles++;
          stats.diskUsage += fileStats.size;
          
          const fileUrl = `/uploads/pets/${file}`;
          if (!validImages.has(fileUrl)) {
            stats.orphanedFiles++;
          }
        }
      }

      // Check products directory
      const productsDir = path.join(__dirname, '..', 'uploads', 'products');
      if (fs.existsSync(productsDir)) {
        const productFiles = fs.readdirSync(productsDir);
        for (const file of productFiles) {
          const filePath = path.join(productsDir, file);
          const fileStats = fs.statSync(filePath);
          stats.totalImageFiles++;
          stats.diskUsage += fileStats.size;
          
          const fileUrl = `/uploads/products/${file}`;
          if (!validImages.has(fileUrl)) {
            stats.orphanedFiles++;
          }
        }
      }

      // Convert disk usage to MB
      stats.diskUsageMB = Math.round(stats.diskUsage / (1024 * 1024) * 100) / 100;

    } catch (error) {
      console.error('Error getting image stats:', error);
    }

    return stats;
  }
}

module.exports = ImageService;
