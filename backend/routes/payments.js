const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-payment', auth, async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    // Ensure amount is a valid integer
    const amountInPaise = Math.round(Number(amount));
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: amountInPaise,
      currency,
      receipt,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      orderData
    } = req.body;

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    const expected_signature = shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');

    // Verify signature
    if (razorpaySignature !== expected_signature) {
      return res.status(400).json({ message: 'Transaction not legit!' });
    }

    try {
      // Convert productId to ObjectId if it's a valid ObjectId string
      const itemsWithObjectId = orderData.items.map(item => {
        let productId = item.productId;
        
        // Check if productId is a valid ObjectId (24 hex characters)
        if (mongoose.Types.ObjectId.isValid(productId) && /^[a-fA-F0-9]{24}$/.test(productId)) {
          productId = new mongoose.Types.ObjectId(productId);
        }
        // If not a valid ObjectId, keep it as is (for custom IDs)
        
        return {
          ...item,
          productId: productId
        };
      });

      // Calculate total amount
      const totalAmount = itemsWithObjectId.reduce((total, item) => total + (item.price * item.quantity), 0);

      // Create order in database
      const order = new Order({
        user: req.user.id,
        items: itemsWithObjectId,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: 'online',
        paymentDetails: {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          signature: razorpaySignature
        },
        status: 'paid',
        totalAmount: totalAmount
      });

      await order.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    } catch (dbError) {
      console.error('Database error while saving order:', dbError);
      // If there's a duplicate key error, try regenerating the order number
      if (dbError.code === 11000 && dbError.keyPattern?.orderNumber) {
        return res.status(500).json({ 
          message: 'Order creation failed. Please try again.',
          shouldRetry: true
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

module.exports = router; 