const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/my_retail_store';
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));

// --- 1. NEW: ORDER DATABASE MODEL ---
const OrderSchema = new mongoose.Schema({
  customer: { name: String, phone: String, address: String },
  items: Array,
  total: Number,
  date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);
  
// --- 2. UPDATED: CHECKOUT ROUTE ---
app.post('/api/checkout', async (req, res) => {
  const { cart, total, customer } = req.body;
  
  // ⚠️ PUT YOUR REAL KEYS BACK HERE ⚠️
  const TELEGRAM_TOKEN = '8628659881:AAFBZKjP7ynLwVC38fddjd5pmt-AAg6ak7E';
  const CHAT_ID = '51846992';

  try {
    // A. Save the order to MongoDB Database
    const newOrder = new Order({ customer, items: cart, total });
    const savedOrder = await newOrder.save();

    // B. Format the receipt for Telegram (Now includes Customer Info!)
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

    // C. Send to Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    
    // D. Tell React it was successful and send the Order ID back
    res.status(200).json({ success: true, orderId: savedOrder._id });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Failed to process order" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));