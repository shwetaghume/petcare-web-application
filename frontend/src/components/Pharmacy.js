import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import ProductCard from './ProductCard';
import useDebounce from '../hooks/useDebounce';
import './Pharmacy.css';

const Pharmacy = memo(() => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedPetType, setSelectedPetType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const petTypes = useMemo(() => [
    { id: 'all', name: 'All Pets' },
    { id: 'Dog', name: 'Dogs' },
    { id: 'Cat', name: 'Cats' },
    { id: 'Bird', name: 'Birds' },
    { id: 'Fish', name: 'Fish' },
    { id: 'Small Animal', name: 'Small Animals' }
  ], []);

  // Fetch products from API
  const fetchProductsFromAPI = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5001/api/products?limit=100');
      
      if (response.data && response.data.products) {
        // Transform API data to match frontend format
        const transformedProducts = response.data.products.map(product => ({
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          requiresPrescription: product.requiresPrescription,
          petType: product.petType && product.petType.length > 0 ? product.petType[0] : 'All',
          category: product.category,
          brand: product.brand,
          inStock: product.inStock,
          stockQuantity: product.stockQuantity
        }));
        
        setProducts(transformedProducts);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    
    // Fetch products from API
    fetchProductsFromAPI();
  }, [fetchProductsFromAPI]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const filteredAndSortedProducts = useMemo(() => {
    if (!products || products.length === 0) {
      return [];
    }
    
    let filtered = products.filter(product => {
      const matchesPetType = selectedPetType === 'all' || 
        product.petType === selectedPetType || 
        (Array.isArray(product.petType) && product.petType.includes(selectedPetType));
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesPetType && matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

    return sorted;
  }, [products, selectedPetType, debouncedSearchQuery, sortBy]);

  const handlePetTypeChange = useCallback((petType) => {
    setSelectedPetType(petType);
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSort = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  const handleQuickView = useCallback((product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  }, []);

  const handleAddToCart = useCallback((product) => {
    if (product.requiresPrescription) {
      setSelectedMedicine(product);
      setShowPrescriptionModal(true);
    } else {
      const updatedCart = [...cart];
      const existingItem = updatedCart.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        updatedCart.push({
          ...product,
          quantity: 1,
          addedAt: new Date().toISOString()
        });
      }
      
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      setShowProductDetails(false);
      
      // Show cart preview
      setShowCartPreview(true);
      setTimeout(() => setShowCartPreview(false), 3000);
      
      alert('Product added to cart!');
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handlePrescriptionUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setTimeout(() => {
        const updatedCart = [...cart];
        const existingItem = updatedCart.find(item => item.id === selectedMedicine.id);
        
        if (existingItem) {
          existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
          updatedCart.push({
            ...selectedMedicine,
            quantity: 1,
            prescription: true,
            prescriptionFile: file.name,
            addedAt: new Date().toISOString()
          });
        }
        
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setShowPrescriptionModal(false);
        setSelectedMedicine(null);
        
        setShowCartPreview(true);
        setTimeout(() => setShowCartPreview(false), 3000);
        
        alert('Product added to cart!');
        navigate('/cart');
      }, 1000);
    }
  }, [cart, selectedMedicine, navigate]);

  return (
    <div className="pharmacy-container">
      <div className="pharmacy-header">
        <div className="header-top">
          <h2>Pet Pharmacy & Supplies</h2>
          <div className="cart-summary" onClick={() => navigate('/cart')}>
            <span className="cart-icon">🛒</span>
            <span className="cart-count">{cart.length}</span>
            <span className="cart-total">₹{cartTotal.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Important Safety Caution */}
        <div className="caution-notice">
          <h3>⚠️ Important Safety Notes:</h3>
          <ul>
            <li>✅ Always consult a vet before medicating any animal</li>
            <li>✅ Dosages differ by species and weight</li>
            <li>✅ Some drugs safe for one species can be lethal to another (e.g., carprofen is for dogs/cats only; never use dog flea meds on rabbits)</li>
          </ul>
        </div>
        <div className="header-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <div className="filter-sort-container">
            <div className="filter-section">
              <select 
                value={selectedPetType} 
                onChange={(e) => handlePetTypeChange(e.target.value)}
                className="filter-select"
              >
                {petTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="sort-section">
              <select 
                value={sortBy} 
                onChange={handleSort}
                className="sort-select"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchProductsFromAPI} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <div className="products-grid">
          {filteredAndSortedProducts.length > 0 ? (
            filteredAndSortedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={handleQuickView}
                petTypes={petTypes}
              />
            ))
          ) : (
            <div className="no-products">
              <p>No products found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {showCartPreview && (
        <div className="cart-preview">
          <h3>Cart Updated</h3>
          <p>Total Items: {cart.length}</p>
          <p>Total: ₹{cartTotal.toFixed(2)}</p>
          <button onClick={() => navigate('/cart')}>View Cart</button>
        </div>
      )}

      {showProductDetails && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content product-details-modal">
            <button 
              className="close-button"
              onClick={() => setShowProductDetails(false)}
            >
              ×
            </button>
            <div className="product-details-content">
              <div className="product-details-image">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
              <div className="product-details-info">
                <h3>{selectedProduct.name}</h3>
                <p className="product-description">{selectedProduct.description}</p>
                <p className="product-price">₹{selectedProduct.price}</p>
                <p className="pet-type">For: {petTypes.find(type => type.id === selectedProduct.petType)?.name}</p>
                {selectedProduct.requiresPrescription && (
                  <span className="prescription-badge">Requires Prescription</span>
                )}
                <div className="product-actions">
                  <button 
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="add-to-cart-button"
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => setShowProductDetails(false)}
                    className="continue-shopping-button"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrescriptionModal && selectedMedicine && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Upload Prescription</h3>
            <p>Please upload a valid prescription for {selectedMedicine.name}</p>
            <div className="prescription-upload">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handlePrescriptionUpload}
                className="prescription-input"
              />
              <p className="upload-hint">Accepted formats: PDF, JPG, PNG</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowPrescriptionModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Pharmacy.displayName = 'Pharmacy';

export default Pharmacy; 