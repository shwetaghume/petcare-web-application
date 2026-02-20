import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import './AdminProducts.css';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5001/api';
console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🌐 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [imageUploadType, setImageUploadType] = useState('url'); // 'url' or 'file'
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    stockQuantity: '',
    brand: '',
    images: [''],
    ingredients: '',
    prescriptionRequired: false,
    petType: 'All',
    dosage: '',
    sideEffects: '',
    warnings: ''
  });

  useEffect(() => {
    initializeProductsData();
  }, []);

  const initializeProductsData = async () => {
    console.log('🔄 Initializing products data...');
    console.log('🌐 Current API_BASE_URL:', API_BASE_URL);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Token available:', !!token, token ? `(${token.substring(0, 20)}...)` : 'none');
      
      // Note: The products GET endpoint doesn't require authentication
      // We're including the token for potential admin-specific features
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = `${API_BASE_URL}/products?includeOutOfStock=true&limit=1000`;
      console.log('🔗 Fetching from URL:', url);
      console.log('📋 Request headers:', headers);
      
      const response = await fetch(url, {
        headers,
        method: 'GET'
      });
      
      console.log('📡 API Response Status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Products fetched successfully. Response structure:', {
          isArray: Array.isArray(data),
          hasProducts: !!(data.products),
          dataKeys: Object.keys(data),
          totalItems: Array.isArray(data) ? data.length : (data.products ? data.products.length : 'unknown')
        });
        
        // Handle both array response and object with products property
        const productsArray = Array.isArray(data) ? data : (data.products || []);
        console.log('📦 Setting products array:', productsArray.length, 'items');
        console.log('🔍 First 3 products preview:', productsArray.slice(0, 3).map(p => ({name: p.name, id: p._id, stock: p.stockQuantity})));
        
        setProducts(productsArray);
      } else {
        console.error('❌ Failed to fetch products - Status:', response.status);
        
        // Try to get error details
        try {
          const errorData = await response.json();
          console.error('📝 Error details:', errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error('📝 Error response text:', errorText);
        }
        
        // Don't clear existing products on error to maintain state
        if (products.length === 0) {
          console.log('⚠️ No existing products, setting empty array');
          setProducts([]);
        } else {
          console.log('⚠️ Keeping existing products due to error');
        }
      }
    } catch (error) {
      console.error('❌ Network error fetching products:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Don't clear existing products on network error
      if (products.length === 0) {
        console.log('⚠️ No existing products, setting empty array');
        setProducts([]);
      } else {
        console.log('⚠️ Keeping existing products due to network error');
      }
    } finally {
      setLoading(false);
      console.log('🏁 Products initialization complete. Final product count:', products.length);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      stockQuantity: '',
      brand: '',
      images: [''],
      ingredients: '',
      prescriptionRequired: false,
      petType: 'All',
      dosage: '',
      sideEffects: '',
      warnings: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
    setImageFiles([]);
    setImagePreviewUrls([]);
    setImageUploadType('url');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setImageFiles(files);
    
    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(previewUrls);
  };

  // Remove file from upload list
  const removeFile = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    
    // Cleanup URL object
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }
    
    setImageFiles(newFiles);
    setImagePreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - check all required fields
    if (!formData.name || !formData.category || !formData.price || !formData.stockQuantity || !formData.brand) {
      alert('Please fill in all required fields: name, category, price, stock quantity, and brand');
      return;
    }
    
    // Check for images
    if (imageUploadType === 'url') {
      const validImages = formData.images.filter(img => img.trim() !== '');
      if (validImages.length === 0) {
        alert('Please provide at least one product image URL');
        return;
      }
    } else if (imageUploadType === 'file' && imageFiles.length === 0) {
      alert('Please select at least one image file');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      let requestBody;
      let headers = {
        'Authorization': `Bearer ${token}`
      };
      
      if (imageUploadType === 'file' && imageFiles.length > 0) {
        // File upload mode - use FormData
        const formDataToSend = new FormData();
        
        // Add basic product data
        formDataToSend.append('name', formData.name);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', parseFloat(formData.price));
        formDataToSend.append('stockQuantity', parseInt(formData.stockQuantity));
        formDataToSend.append('brand', formData.brand);
        formDataToSend.append('ingredients', formData.ingredients);
        formDataToSend.append('requiresPrescription', formData.prescriptionRequired.toString());
        formDataToSend.append('petType', formData.petType);
        
        // Add medical information
        if (formData.dosage) formDataToSend.append('prescriptionDetails[dosage]', formData.dosage);
        if (formData.sideEffects) formDataToSend.append('prescriptionDetails[sideEffects]', formData.sideEffects);
        if (formData.warnings) formDataToSend.append('prescriptionDetails[warnings]', formData.warnings);
        
        // Append actual files
        imageFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });
        
        requestBody = formDataToSend;
      } else {
        // URL mode - use JSON
        const validImages = formData.images.filter(img => img.trim() !== '');
        
        requestBody = JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          price: parseFloat(formData.price),
          stockQuantity: parseInt(formData.stockQuantity),
          brand: formData.brand,
          ingredients: formData.ingredients.split(',').map(ing => ing.trim()).filter(ing => ing) || [],
          requiresPrescription: formData.prescriptionRequired,
          petType: [formData.petType],
          imageType: 'url',
          image: validImages[0] || '',
          images: validImages,
          prescriptionDetails: {
            dosage: formData.dosage || '',
            sideEffects: formData.sideEffects || '',
            warnings: formData.warnings || ''
          }
        });
        
        headers['Content-Type'] = 'application/json';
      }
      
      let response;
      if (editingProduct) {
        // Update existing product
        response = await fetch(`${API_BASE_URL}/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: headers,
          body: requestBody
        });
      } else {
        // Create new product
        response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: headers,
          body: requestBody
        });
      }
      
      if (response.ok) {
        const updatedProduct = await response.json();
        console.log('✅ Product operation successful:', updatedProduct);
        
        if (editingProduct) {
          // Update existing product in state
          setProducts(prev => prev.map(p => p._id === editingProduct._id ? updatedProduct : p));
          alert('Product updated successfully!');
        } else {
          // Add new product to state
          setProducts(prev => [...prev, updatedProduct]);
          alert('Product added successfully!');
        }
        
        resetForm();
      } else {
        // Better error handling for HTTP errors
        let errorMessage = 'Failed to save product';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('Server error response:', errorData);
        } catch (parseError) {
          // If can't parse JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
          console.error('Response status:', response.status, response.statusText);
        }
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Error saving product:', error);
      
      alert(`Error creating product: ${error.message}`);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setProducts(prev => prev.filter(product => product._id !== productId));
          alert('Product deleted successfully!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      stockQuantity: product.stockQuantity?.toString() || '',
      brand: product.brand || '',
      images: product.images?.length > 0 ? product.images : [''],
      ingredients: product.ingredients || '',
      prescriptionRequired: product.prescriptionRequired || false,
      petType: product.petType?.[0] || 'All',
      dosage: product.dosage || '',
      sideEffects: product.sideEffects || '',
      warnings: product.warnings || ''
    });
    setShowAddForm(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStock = filterStock === 'all' || 
                        (filterStock === 'low' && product.stockQuantity < 10) ||
                        (filterStock === 'out' && product.stockQuantity === 0) ||
                        (filterStock === 'in' && product.stockQuantity > 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(p => p.stockQuantity < 10).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;

  if (loading) {
    return (
      <div className="admin-products">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products">

      <div className="products-header">
        <div className="header-content">
          <h1>Manage Products</h1>
          <p>Add, edit, and manage all pharmacy products</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => initializeProductsData()} 
            className="btn btn-secondary"
            title="Refresh product list"
          >
            🔄 Refresh
          </button>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-primary"
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="products-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="Medicine">Medicine</option>
            <option value="Food">Food</option>
            <option value="Accessories">Accessories</option>
            <option value="Grooming">Grooming</option>
            <option value="Toys">Toys</option>
            <option value="Health & Wellness">Health & Wellness</option>
          </select>
          
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Stock Levels</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock (&lt;10)</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="products-stats">
        <div className="stat-item">
          <span className="stat-number">{products.length}</span>
          <span className="stat-label">Total Products</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{products.filter(p => p.stockQuantity > 0).length}</span>
          <span className="stat-label">In Stock</span>
        </div>
        <div className="stat-item warning">
          <span className="stat-number">{lowStockCount}</span>
          <span className="stat-label">Low Stock</span>
        </div>
        <div className="stat-item danger">
          <span className="stat-number">{outOfStockCount}</span>
          <span className="stat-label">Out of Stock</span>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button 
                onClick={resetForm} 
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Product Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Food">Food</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Grooming">Grooming</option>
                      <option value="Toys">Toys</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="brand">Brand *</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="price">Price (₹) *</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="stockQuantity">Stock Quantity *</label>
                    <input
                      type="number"
                      id="stockQuantity"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleChange}
                      required
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="petType">Pet Type *</label>
                    <select
                      id="petType"
                      name="petType"
                      value={formData.petType}
                      onChange={handleChange}
                      required
                    >
                      <option value="All">All Pets</option>
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Bird">Bird</option>
                      <option value="Fish">Fish</option>
                      <option value="Small Animal">Small Animal</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="Describe the product, its uses, and benefits"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Product Images</h3>
                
                {/* Image Upload Type Toggle */}
                <div className="form-group">
                  <label>Image Source</label>
                  <div className="upload-type-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${imageUploadType === 'url' ? 'active' : ''}`}
                      onClick={() => setImageUploadType('url')}
                    >
                      📝 URL
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${imageUploadType === 'file' ? 'active' : ''}`}
                      onClick={() => setImageUploadType('file')}
                    >
                      📁 Upload Files
                    </button>
                  </div>
                </div>

                {/* URL Input Mode */}
                {imageUploadType === 'url' && (
                  <div className="url-input-section">
                    {formData.images.map((image, index) => (
                      <div key={index} className="image-input-group">
                        <div className="form-group">
                          <label htmlFor={`image-${index}`}>Image URL {index + 1}</label>
                          <input
                            type="url"
                            id={`image-${index}`}
                            value={image}
                            onChange={(e) => handleImageChange(index, e.target.value)}
                            placeholder="Enter image URL"
                          />
                        </div>
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="btn btn-secondary"
                    >
                      + Add Another Image URL
                    </button>
                  </div>
                )}

                {/* File Upload Mode */}
                {imageUploadType === 'file' && (
                  <div className="file-upload-section">
                    <div className="form-group">
                      <label htmlFor="imageFiles">Select Product Images</label>
                      <input
                        type="file"
                        id="imageFiles"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                      />
                      <small className="help-text">Maximum 5 images, named automatically based on product name</small>
                    </div>
                    
                    {/* Image Previews */}
                    {imagePreviewUrls.length > 0 && (
                      <div className="image-previews">
                        <h4>Selected Images:</h4>
                        <div className="preview-grid">
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="image-preview-item">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="image-preview"
                              />
                              <div className="preview-info">
                                <p className="file-name">{imageFiles[index]?.name}</p>
                                <p className="generated-name">Will be saved as: product-{formData.name.toLowerCase().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-')}-{index + 1}</p>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="btn btn-sm btn-danger"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>Medical Information</h3>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="prescriptionRequired"
                      checked={formData.prescriptionRequired}
                      onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    Prescription Required
                  </label>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="dosage">Dosage Instructions</label>
                    <input
                      type="text"
                      id="dosage"
                      name="dosage"
                      value={formData.dosage}
                      onChange={handleChange}
                      placeholder="e.g., 1 tablet twice daily"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="ingredients">Active Ingredients</label>
                    <input
                      type="text"
                      id="ingredients"
                      name="ingredients"
                      value={formData.ingredients}
                      onChange={handleChange}
                      placeholder="List main ingredients"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="sideEffects">Side Effects</label>
                  <textarea
                    id="sideEffects"
                    name="sideEffects"
                    value={formData.sideEffects}
                    onChange={handleChange}
                    rows="3"
                    placeholder="List potential side effects"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="warnings">Warnings & Precautions</label>
                  <textarea
                    id="warnings"
                    name="warnings"
                    value={formData.warnings}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Important warnings and usage precautions"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Prescription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <img 
                      src={
                        product.images?.[0] 
                          ? product.images[0].startsWith('http') 
                            ? product.images[0] 
                            : `${API_BASE_URL}/products/${product.images[0]}`
                          : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=60&auto=format&fit=crop&q=60'
                      } 
                      alt={product.name}
                      className="product-thumbnail"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=60&auto=format&fit=crop&q=60';
                      }}
                    />
                  </td>
                  <td>
                    <div className="product-name">
                      <strong>{product.name}</strong>
                      <div className="product-rating">
                        {'★'.repeat(Math.floor(product.averageRating || 0))}
                        {'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
                        <span className="rating-count">({product.reviews?.length || 0})</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="product-category">{product.category}</span>
                  </td>
                  <td>{product.brand}</td>
                  <td>
                    <span className="price">₹{product.price?.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`stock-badge ${
                      product.stockQuantity === 0 ? 'out-of-stock' : 
                      product.stockQuantity < 10 ? 'low-stock' : 'in-stock'
                    }`}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td>
                    <span className={`prescription-badge ${product.prescriptionRequired ? 'required' : 'not-required'}`}>
                      {product.prescriptionRequired ? 'Required' : 'OTC'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/pharmacy/product/${product._id}`} 
                        className="btn btn-sm btn-secondary"
                        title="View Details"
                      >
                        👁️
                      </Link>
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="btn btn-sm btn-primary"
                        title="Edit Product"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(product._id)} 
                        className="btn btn-sm btn-danger"
                        title="Delete Product"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  {searchTerm || filterCategory !== 'all' || filterStock !== 'all' 
                    ? 'No products match your search criteria' 
                    : 'No products found. Add your first product!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
