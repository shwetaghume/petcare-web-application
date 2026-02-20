import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'online'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCart();
  }, [isAuthenticated, navigate]);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotalInPaise = () => {
    const total = calculateTotal();
    return Math.round(total * 100); // Convert to paise and ensure it's an integer
  };

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowUserForm(true);
  };

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!userInfo.name.trim()) errors.name = 'Name is required';
    if (!userInfo.email.trim()) errors.email = 'Email is required';
    if (!userInfo.phone.trim()) errors.phone = 'Phone is required';
    if (!userInfo.address.trim()) errors.address = 'Address is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userInfo.email && !emailRegex.test(userInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10}$/;
    if (userInfo.phone && !phoneRegex.test(userInfo.phone.replace(/[- ]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowUserForm(false);
      setShowConfirmation(true);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOnlinePayment = async (orderData) => {
    try {
      const res = await loadRazorpay();
      if (!res) {
        alert('Razorpay SDK failed to load');
        return;
      }

      // Create order on your backend
      const result = await axios.post('/api/payments/create-payment', {
        amount: calculateTotalInPaise(), // Use the new function
        currency: 'INR',
        receipt: `order_${Date.now()}`
      });

      const { amount, id: order_id, currency } = result.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'PetCare',
        description: 'Pet Care Products Purchase',
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const { data } = await axios.post('/api/payments/verify-payment', {
              orderCreationId: order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              orderData
            });

            if (data.success) {
              localStorage.removeItem('cart');
              setCart([]);
              setOrderSuccess(true);
              setShowConfirmation(false);
            } else {
              setOrderError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            setOrderError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
          contact: userInfo.phone
        },
        theme: {
          color: '#2563eb'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      setOrderError('Failed to initiate payment. Please try again.');
    }
  };

  const handleConfirmOrder = async () => {
    try {
      setIsProcessing(true);
      setOrderError('');

      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        shippingAddress: {
          fullName: userInfo.name,
          phone: userInfo.phone,
          email: userInfo.email,
          address: userInfo.address
        },
        paymentMethod
      };

      if (paymentMethod === 'online') {
        await handleOnlinePayment(orderData);
      } else {
        const response = await axios.post('/api/orders', orderData);
        if (response.data && response.data.message) {
          localStorage.removeItem('cart');
          setCart([]);
          setOrderSuccess(true);
          setShowConfirmation(false);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderError(
        error.response?.data?.message || 
        'Failed to place order. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="cart-container loading">Loading cart...</div>;
  }

  if (orderError) {
    return <div className="cart-container error">{orderError}</div>;
  }

  if (cart.length === 0) {
    if (orderSuccess) {
      return (
        <div className="cart-container success">
          <div className="success-message">
            <h2>🎉 Order Placed Successfully!</h2>
            <p>Thank you for your order. We will contact you soon for delivery.</p>
            <button onClick={() => navigate('/pharmacy')} className="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="cart-container empty">
        <h2>Your Cart is Empty</h2>
        <p>Add some products to your cart to get started!</p>
        <button onClick={() => navigate('/pharmacy')} className="btn btn-primary">
          Browse Products
        </button>
      </div>
    );
  }

  if (showUserForm) {
    return (
      <div className="cart-container">
        <div className="user-form-container">
          <h2>Delivery Information</h2>
          <form onSubmit={handleUserFormSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={userInfo.name}
                onChange={handleUserInfoChange}
                placeholder="Enter your full name"
                className={formErrors.name ? 'error' : ''}
              />
              {formErrors.name && <span className="error-message">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userInfo.email}
                onChange={handleUserInfoChange}
                placeholder="Enter your email address"
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <span className="error-message">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={userInfo.phone}
                onChange={handleUserInfoChange}
                placeholder="Enter your phone number"
                className={formErrors.phone ? 'error' : ''}
              />
              {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address *</label>
              <textarea
                id="address"
                name="address"
                value={userInfo.address}
                onChange={handleUserInfoChange}
                placeholder="Enter your complete delivery address"
                rows="3"
                className={formErrors.address ? 'error' : ''}
              />
              {formErrors.address && <span className="error-message">{formErrors.address}</span>}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowUserForm(false)} 
                className="btn btn-secondary"
              >
                Back to Cart
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Continue to Order Review
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="cart-container">
        <div className="order-confirmation">
          <h2>Order Confirmation</h2>
          
          <div className="confirmation-details">
            <div className="user-info-section">
              <h3>Delivery Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name:</label>
                  <p>{userInfo.name}</p>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <p>{userInfo.email}</p>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <p>{userInfo.phone}</p>
                </div>
                <div className="info-item">
                  <label>Delivery Address:</label>
                  <p>{userInfo.address}</p>
                </div>
              </div>
            </div>

            <div className="order-summary-section">
              <h3>Order Summary</h3>
              <div className="order-items">
                {cart.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.name}</span>
                    <span>x{item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <strong>Total Amount:</strong>
                <span>₹{calculateTotal()}</span>
              </div>
            </div>

            <div className="payment-method-section">
              <h3>Payment Method</h3>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="radio-label">Cash on Delivery</span>
                </label>
                <label className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="radio-label">Pay Online (Credit/Debit Card, UPI, Net Banking)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="confirmation-actions">
            <button 
              onClick={() => setShowConfirmation(false)} 
              className="btn btn-secondary"
              disabled={isProcessing}
            >
              Back to Cart
            </button>
            <button 
              onClick={handleConfirmOrder} 
              className="btn btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : paymentMethod === 'online' ? 'Pay Now' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>
      {orderError && <div className="error-message">{orderError}</div>}
      
      <div className="cart-items">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.name} className="item-image" />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="item-price">₹{item.price}</p>
              <div className="quantity-controls">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="item-total">
              <p>Total: ₹{item.price * item.quantity}</p>
              <button 
                onClick={() => removeFromCart(item.id)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>₹{calculateTotal()}</span>
        </div>
        <div className="summary-row">
          <span>Delivery:</span>
          <span>Free</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>₹{calculateTotal()}</span>
        </div>
        
        <button 
          onClick={handlePlaceOrder}
          className={`btn btn-primary place-order-btn ${isProcessing ? 'loading' : ''}`}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
};

export default Cart; 