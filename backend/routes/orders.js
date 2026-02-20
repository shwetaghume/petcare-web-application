const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

// Create a new order (for COD)
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received order request:', req.body);
    const { items, shippingAddress, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    // Calculate total
    let totalAmount = 0;
    const processedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      
      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name || product.name // Use item name from frontend or fallback to product name
      });
    }
    
    console.log('Creating order with data:', {
      user: req.user.id,
      items: processedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      totalAmount,
      status: 'pending'
    });
    
    const order = new Order({
      user: req.user.id,
      items: processedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      totalAmount,
      status: 'pending'
    });
    
    await order.save();
    console.log('Order saved successfully:', order._id);
    
    // Populate order details for response
    await order.populate('items.productId');
    
    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Failed to create order. Please try again.' });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId')
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.productId user');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { page, limit = 10, status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    // If no pagination parameters are provided (dashboard call), return all orders
    if (!page && !req.query.limit) {
      const orders = await Order.find(query)
        .populate('items.productId')
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      
      const total = orders.length;
      
      res.json({
        orders,
        totalPages: 1,
        currentPage: 1,
        total
      });
    } else {
      // Paginated response for admin orders page
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      
      const orders = await Order.find(query)
        .populate('items.productId')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum);
      
      const total = await Order.countDocuments(query);
      
      res.json({
        orders,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        total
      });
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 