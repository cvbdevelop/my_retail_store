const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
// Add this near the top with your other imports
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

// --- 1. GOD MODE CORS (Allows absolutely everything) ---
app.use(cors({ origin: '*' }));
app.use(express.json());
// Add this further down with your other app.use statements
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

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
  
  // Load secure variables
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  try {
    // 1. Save order to MongoDB
    const newOrder = new Order({ customer, items: cart, total });
    const savedOrder = await newOrder.save();

    // 2. Format the Telegram Message (SAFE PLAIN TEXT)
    let message = `🛒 NEW ORDER RECEIVED!\n\n`;
    message += `CUSTOMER: ${customer.name}\n`;
    message += `PHONE: ${customer.phone}\n`;
    message += `ADDRESS: ${customer.address}\n\n`;
    message += `ITEMS:\n`;
    cart.forEach(item => {
      const itemName = item.name?.en || item.name; 
      message += `- ${item.quantity}x ${itemName} ($${item.price * item.quantity})\n`;
    });
    message += `\nTOTAL: $${total}\n`;
    message += `ORDER ID: ${savedOrder._id}`;

    // 3. Send the Alert to Telegram (REMOVED STRICT PARSE MODE)
    if (TELEGRAM_TOKEN && CHAT_ID) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(telegramUrl, {
          chat_id: CHAT_ID,
          text: message
        });
        console.log("Telegram message sent successfully!");
      } catch (telegramErr) {
        console.error("Telegram alert failed to send! Reason:", telegramErr.response?.data || telegramErr.message);
      }
    } else {
      console.warn("Telegram Token or Chat ID is missing from Render Environment Variables!");
    }

    // 4. Respond to frontend
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