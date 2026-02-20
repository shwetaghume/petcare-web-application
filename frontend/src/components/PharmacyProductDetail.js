import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './PharmacyProductDetail.css';

const PharmacyProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    contact: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState('');

  const loadSampleProducts = () => {
    return {
      medicine: [
        // For Dogs and Cats
        {
          id: 'med1',
          _id: 'med1',
          name: 'Fipronil Spot-On',
          description: 'Topical flea and tick treatment for dogs and cats',
          price: 24.99,
          image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Dog', 'Cat'],
          category: 'Medicine',
          brand: 'PetCare',
          inStock: true,
          stockQuantity: 50,
          averageRating: 4.5,
          totalReviews: 24,
          reviews: [],
          featured: true
        },
        {
          id: 'med2',
          _id: 'med2',
          name: 'Pyrantel Pamoate',
          description: 'Dewormer for roundworms and hookworms in dogs and cats',
          price: 18.99,
          image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Dog', 'Cat'],
          category: 'Medicine',
          brand: 'VetMed',
          inStock: true,
          stockQuantity: 30,
          averageRating: 4.2,
          totalReviews: 18,
          reviews: [],
          featured: false
        },
        {
          id: 'med3',
          _id: 'med3',
          name: 'Amoxicillin',
          description: 'Broad-spectrum antibiotic for bacterial infections',
          price: 34.99,
          image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: true,
          petType: ['Dog', 'Cat'],
          category: 'Medicine',
          brand: 'PharmaPet',
          inStock: true,
          stockQuantity: 25,
          averageRating: 4.7,
          totalReviews: 32,
          reviews: [],
          featured: true
        },
        {
          id: 'med4',
          _id: 'med4',
          name: 'Carprofen',
          description: 'Non-steroidal anti-inflammatory (NSAID) for pain relief in dogs and cats',
          price: 42.99,
          image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: true,
          petType: ['Dog', 'Cat'],
          category: 'Medicine',
          brand: 'VetCare',
          inStock: true,
          stockQuantity: 20,
          averageRating: 4.6,
          totalReviews: 28,
          reviews: [],
          featured: false
        },
        {
          id: 'med5',
          _id: 'med5',
          name: 'Diphenhydramine (Benadryl)',
          description: 'Antihistamine for mild allergic reactions (vet-dosed)',
          price: 12.99,
          image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Cat'],
          category: 'Medicine',
          brand: 'GenericPet',
          inStock: true,
          stockQuantity: 45,
          averageRating: 4.1,
          totalReviews: 15,
          reviews: [],
          featured: false
        },
        {
          id: 'med6',
          _id: 'med6',
          name: 'Enrofloxacin',
          description: 'Antibiotic for bacterial infections in birds',
          price: 28.99,
          image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: true,
          petType: ['Bird'],
          category: 'Medicine',
          brand: 'AvianCare',
          inStock: true,
          stockQuantity: 12,
          averageRating: 4.8,
          totalReviews: 8,
          reviews: [],
          featured: false
        },
        {
          id: 'med7',
          _id: 'med7',
          name: 'Ivermectin for Birds',
          description: 'Anti-parasitic for mites and lice (carefully diluted)',
          price: 22.99,
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: true,
          petType: ['Bird'],
          category: 'Medicine',
          brand: 'AvianCare',
          inStock: true,
          stockQuantity: 8,
          averageRating: 4.4,
          totalReviews: 6,
          reviews: [],
          featured: false
        },
        {
          id: 'med8',
          _id: 'med8',
          name: 'Calcium + Vitamin D3 Supplement',
          description: 'Essential supplement for laying hens and parrots',
          price: 16.99,
          image: 'https://images.unsplash.com/photo-1577303935007-0d306ee134d1?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Bird'],
          category: 'Medicine',
          brand: 'NutriPet',
          inStock: true,
          stockQuantity: 35,
          averageRating: 4.3,
          totalReviews: 11,
          reviews: [],
          featured: false
        },
        {
          id: 'med9',
          _id: 'med9',
          name: 'Methylene Blue',
          description: 'Antifungal/bacteriostatic for treating external infections in fish',
          price: 14.99,
          image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Fish'],
          category: 'Medicine',
          brand: 'AquaCare',
          inStock: true,
          stockQuantity: 22,
          averageRating: 4.2,
          totalReviews: 14,
          reviews: [],
          featured: false
        },
        {
          id: 'med10',
          _id: 'med10',
          name: 'Aquarium Salt',
          description: 'General tonic/stress reducer and mild antiseptic for aquarium use',
          price: 8.99,
          image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Fish'],
          category: 'Medicine',
          brand: 'AquaCare',
          inStock: true,
          stockQuantity: 50,
          averageRating: 4.0,
          totalReviews: 20,
          reviews: [],
          featured: false
        },
        {
          id: 'med11',
          _id: 'med11',
          name: 'Melafix',
          description: 'Tea tree oil extract - mild antibacterial for aquarium use',
          price: 19.99,
          image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Fish'],
          category: 'Medicine',
          brand: 'AquaCare',
          inStock: true,
          stockQuantity: 18,
          averageRating: 4.1,
          totalReviews: 13,
          reviews: [],
          featured: false
        },
        {
          id: 'med12',
          _id: 'med12',
          name: 'Critical Care Formula',
          description: 'Powdered food for syringe feeding sick herbivores (rabbits, guinea pigs)',
          price: 26.99,
          image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Small Animal'],
          category: 'Medicine',
          brand: 'SmallPetCare',
          inStock: true,
          stockQuantity: 15,
          averageRating: 4.7,
          totalReviews: 9,
          reviews: [],
          featured: true
        },
        {
          id: 'med13',
          _id: 'med13',
          name: 'Simethicone',
          description: 'Anti-gas medication for bloat in rabbits and small mammals',
          price: 15.99,
          image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Small Animal'],
          category: 'Medicine',
          brand: 'SmallPetCare',
          inStock: true,
          stockQuantity: 25,
          averageRating: 4.4,
          totalReviews: 7,
          reviews: [],
          featured: false
        },
        {
          id: 'med14',
          _id: 'med14',
          name: 'Ivermectin for Small Animals',
          description: 'Mite treatment for small mammals (carefully dosed)',
          price: 21.99,
          image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: true,
          petType: ['Small Animal'],
          category: 'Medicine',
          brand: 'SmallPetCare',
          inStock: true,
          stockQuantity: 10,
          averageRating: 4.5,
          totalReviews: 5,
          reviews: [],
          featured: false
        },
        {
          id: 'med15',
          _id: 'med15',
          name: 'Electrolyte Solution',
          description: 'For dehydration support across multiple species (vet-directed)',
          price: 13.99,
          image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['All'],
          category: 'Medicine',
          brand: 'VetSupply',
          inStock: true,
          stockQuantity: 40,
          averageRating: 4.3,
          totalReviews: 16,
          reviews: [],
          featured: false
        }
      ],
      accessories: [
        {
          id: 'acc1',
          _id: 'acc1',
          name: 'Dog Carrier',
          description: 'Comfortable and secure dog carrier',
          price: 49.99,
          image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Dog'],
          category: 'Accessories',
          brand: 'PetTravel',
          inStock: true,
          stockQuantity: 15,
          averageRating: 4.3,
          totalReviews: 12,
          reviews: [],
          featured: false
        },
        {
          id: 'acc2',
          _id: 'acc2',
          name: 'Cat Bed',
          description: 'Orthopedic cat bed for comfort',
          price: 79.99,
          image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=60',
          images: [],
          requiresPrescription: false,
          petType: ['Cat'],
          category: 'Accessories',
          brand: 'ComfortPet',
          inStock: true,
          stockQuantity: 8,
          averageRating: 4.6,
          totalReviews: 19,
          reviews: [],
          featured: true
        }
      ]
    };
  };

  const fetchProduct = useCallback(() => {
    try {
      setLoading(true);
      
      // Load products from sample data (same as Pharmacy component)
      const sampleProducts = loadSampleProducts();
      const allProducts = Object.values(sampleProducts).flat();
      const foundProduct = allProducts.find(p => p.id === id || p._id === id);
      
      if (foundProduct) {
        setProduct(foundProduct);
      setError('');
      } else {
        setError('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.productId === product._id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        requiresPrescription: product.requiresPrescription
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch custom event to update cart count
    window.dispatchEvent(new Event('cartUpdated'));
    
    alert(`${product.name} added to cart!`);
  };

  const handleBuyNow = async () => {
    setShowAddressModal(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setOrderError('');
    try {
      // 1. Create pre-payment order
      const response = await axios.post('/api/orders/pharmacy-preorder', {
        items: [{
          productId: product._id,
          quantity,
          price: product.price
        }],
        shippingAddress: address,
        userDetails
      });
      const { orderId } = response.data;
      // 2. Open Razorpay checkout
      // This section is removed as per the edit hint.
      // The original code had Razorpay integration, which is being removed.
      // The user's edit hint implies removing all Razorpay-related code.
      // Therefore, this block is removed.
    } catch (error) {
      setOrderError('Failed to create order or initiate payment. Please check your details and try again.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    try {
      // For demo purposes, just show success message
      // In a real app, this would save to a backend
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
      alert('Review submitted successfully! (Demo mode - review not saved)');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className={`stars ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={interactive ? () => onRatingChange(star) : undefined}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/pharmacy')} className="btn btn-primary">
            Back to Pharmacy
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="error-message">
          <h2>Product Not Found</h2>
          <p>The product you're looking for could not be found.</p>
          <button onClick={() => navigate('/pharmacy')} className="btn btn-primary">
            Back to Pharmacy
          </button>
        </div>
      </div>
    );
  }

  const images = [product.image, ...(product.images || [])];

  return (
    <div className="product-detail-container">
      <div className="product-detail-header">
        <button 
          onClick={() => navigate('/pharmacy')} 
          className="back-button"
        >
          ← Back to Pharmacy
        </button>
        
        <div className="product-badges">
          {product.featured && (
            <span className="badge featured">Featured</span>
          )}
          {product.requiresPrescription && (
            <span className="badge prescription">Prescription Required</span>
          )}
          {product.inStock ? (
            <span className="badge in-stock">In Stock</span>
          ) : (
            <span className="badge out-of-stock">Out of Stock</span>
          )}
        </div>
      </div>

      <div className="product-detail-content">
        <div className="product-images">
          <div className="main-image">
            <img 
              src={images[selectedImage]} 
              alt={product.name}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=60';
              }}
            />
          </div>
          
          {images.length > 1 && (
            <div className="image-thumbnails">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=60';
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-header">
            <h1>{product.name}</h1>
            <div className="product-meta">
              <span className="brand">{product.brand}</span>
              <span className="category">{product.category}</span>
              {product.weight && <span className="weight">{product.weight}</span>}
            </div>
            
            <div className="rating-section">
              {renderStars(product.averageRating)}
              <span className="rating-text">
                {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
              </span>
            </div>
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="product-ingredients">
              <h3>Ingredients</h3>
              <div className="ingredients-list">
                {product.ingredients.map((ingredient, index) => (
                  <span key={index} className="ingredient">{ingredient}</span>
                ))}
              </div>
            </div>
          )}

          {product.requiresPrescription && product.prescriptionDetails && (
            <div className="prescription-info">
              <h3>Prescription Information</h3>
              <div className="prescription-details">
                <div className="detail-item">
                  <strong>Type:</strong> {product.prescriptionDetails.type}
                </div>
                <div className="detail-item">
                  <strong>Dosage:</strong> {product.prescriptionDetails.dosage}
                </div>
                <div className="detail-item">
                  <strong>Frequency:</strong> {product.prescriptionDetails.frequency}
                </div>
                <div className="detail-item">
                  <strong>Duration:</strong> {product.prescriptionDetails.duration}
                </div>
                {product.prescriptionDetails.warnings && (
                  <div className="detail-item warning">
                    <strong>Warnings:</strong> {product.prescriptionDetails.warnings}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="product-tags">
            {product.tags && product.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="purchase-section">
          <div className="price-section">
                          <div className="price">₹{product.price.toFixed(2)}</div>
            <div className="stock-info">
              {product.inStock ? (
                <span className="in-stock">{product.stockQuantity} in stock</span>
              ) : (
                <span className="out-of-stock">Out of stock</span>
              )}
            </div>
          </div>

          {product.inStock && (
            <div className="quantity-section">
              <label htmlFor="quantity">Quantity:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-btn"
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={product.stockQuantity}
                />
                <button 
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="action-buttons">
            {product.inStock ? (
              <>
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary add-to-cart"
                >
                  Add to Cart - ₹{(product.price * quantity).toFixed(2)}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="btn btn-success buy-now"
                  style={{ marginLeft: '10px' }}
                >
                  Buy Now
                </button>
              </>
            ) : (
              <button className="btn btn-disabled" disabled>
                Out of Stock
              </button>
            )}
            
            <button className="btn btn-secondary wishlist">
              ♡ Add to Wishlist
            </button>
          </div>

          {product.requiresPrescription && (
            <div className="prescription-notice">
              <p>📋 <strong>Prescription Required:</strong> A valid prescription must be uploaded during checkout.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          <button 
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="btn btn-secondary"
          >
            Write a Review
          </button>
        </div>

        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="review-form">
            <h3>Write Your Review</h3>
            
            <div className="form-group">
              <label>Rating:</label>
              {renderStars(reviewForm.rating, true, (rating) => 
                setReviewForm(prev => ({ ...prev, rating }))
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="comment">Your Review:</label>
              <textarea
                id="comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this product..."
                required
                rows="4"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Submit Review
              </button>
              <button 
                type="button" 
                onClick={() => setShowReviewForm(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="reviews-list">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong>{review.user?.name || 'Anonymous'}</strong>
                    {renderStars(review.rating)}
                  </div>
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="review-content">
                  <p>{review.comment}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Shipping Address & Contact</h2>
            {orderError && <div className="error-message">{orderError}</div>}
            <form onSubmit={handleAddressSubmit}>
              <label>Full Name:<input type="text" value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} required /></label>
              <label>Phone:<input type="text" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} required /></label>
              <label>Street:<input type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} required /></label>
              <label>City:<input type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} required /></label>
              <label>State:<input type="text" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} required /></label>
              <label>Zip Code:<input type="text" value={address.zipCode} onChange={e => setAddress({ ...address, zipCode: e.target.value })} required /></label>
              <label>Email:<input type="email" value={userDetails.email} onChange={e => setUserDetails({ ...userDetails, email: e.target.value })} required /></label>
              <label>Contact:<input type="text" value={userDetails.contact} onChange={e => setUserDetails({ ...userDetails, contact: e.target.value })} required /></label>
              <label>Name (for payment):<input type="text" value={userDetails.name} onChange={e => setUserDetails({ ...userDetails, name: e.target.value })} /></label>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Place Order (Cash on Delivery)'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddressModal(false)} disabled={isProcessing}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyProductDetail; 