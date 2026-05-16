const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
require('dotenv').config();

const app = express();

// --- 1. GOD MODE CORS (Allows absolutely everything) ---
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- 2. HEALTH CHECK (Proves the server is online) ---
app.get('/', (req, res) => {
    res.status(200).json({ message: "SERVER IS ALIVE AND READY!" });
});

// Routes
app.use('/api/products', productRoutes);

// --- 3. DATABASE CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/my_retail_store';
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas!"))
  .catch(err => console.error("Database connection failed:", err));

// --- ORDER DATABASE MODEL ---
const OrderSchema = new mongoose.Schema({
  customer: { name: String, phone: String, address: String },
  items: Array,
  total: Number,
  date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);
  
// --- CHECKOUT ROUTE ---
app.post('/api/checkout', async (req, res) => {
  const { cart, total, customer } = req.body;
  
  // 1. SECURITY FIX: Pulling from environment variables instead of hardcoding
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  try {
    const newOrder = new Order({ customer, items: cart, total });
    const savedOrder = await newOrder.save();

    res.status(200).json({ success: true, orderId: savedOrder._id });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Failed to process order" });
  }
});

// --- NEW: GET RECENT ORDERS ROUTE ---
app.get('/api/orders', async (req, res) => {
  try {
    // Fetches all orders from MongoDB and sorts them by newest first
    const orders = await Order.find().sort({ date: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// TRIGGER NEW DEPLOYMENT
// TRIGGER NEW DEPLOYMENT
// TRIGGER NEW DEPLOYMENT