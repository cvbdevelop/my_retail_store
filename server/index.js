const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
require('dotenv').config();

const app = express();

// --- 1. THE VIP PASS FOR VERCEL ---
// --- THE NUCLEAR CORS FIX ---
const corsOptions = {
    origin: "https://my-retail-store.vercel.app", // Explicitly whitelist your Vercel domain
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Forces Express to answer the preflight 'OPTIONS' check
// ----------------------------

// Routes
app.use('/api/products', productRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/my_retail_store';
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));

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
  
  const TELEGRAM_TOKEN = '8628659881:AAFBZKjP7ynLwVC38fddjd5pmt-AAg6ak7E';
  const CHAT_ID = '51846992';

  try {
    const newOrder = new Order({ customer, items: cart, total });
    const savedOrder = await newOrder.save();

    let message = `🛒 *NEW ORDER RECEIVED*\n\n`;
    message += `👤 *Name:* ${customer.name}\n`;
    message += `📞 *Phone:* ${customer.phone}\n`;
    message += `📍 *Address:* ${customer.address}\n\n`;
    message += `📦 *Order Details:*\n`;
    cart.forEach(item => {
      const itemName = item.name.en || item.name.km;
      message += `• ${itemName} (x${item.quantity}) - $${item.price * item.quantity}\n`;
    });
    message += `\n💰 *Total: $${total}*`;
    message += `\n🔖 *Order ID:* ${savedOrder._id}`;

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    
    res.status(200).json({ success: true, orderId: savedOrder._id });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Failed to process order" });
  }
});

// --- 2. DYNAMIC PORT FOR RENDER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));