const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // Connects to your Order database
const Product = require('../models/Product'); // Connects to your Products to update stock

// --- GET ALL ORDERS (For your Admin Panel & My Orders) ---
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 }); // Newest first
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- POST A NEW ORDER & UPDATE INVENTORY ---
router.post('/', async (req, res) => {
  try {
    // 1. Create and save the new order from the customer's cart
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();

    // 2. INVENTORY SUBTRACTION LOGIC
    // Loop through every item the customer just bought
    for (let item of req.body.items) {
      // Find the product and subtract the quantity purchased from its stock
      await Product.findByIdAndUpdate(
        item.productId || item._id, // Looks for the ID depending on how your cart formats it
        { $inc: { stock: -item.quantity } } 
      );
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;