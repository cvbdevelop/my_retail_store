const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    km: { type: String, required: true }
  },
  price: { type: Number, required: true },
  description: {
    en: { type: String },
    km: { type: String }
  },
  category: { type: String, required: true },
  image: { type: String, required: true }, // <--- Changed back to "image"
  
  // --- NEW: INVENTORY & VARIANTS ---
  stock: { type: Number, default: 0 },
  variants: [{
    name: { type: String }, // e.g., "Size", "Color"
    options: [{ type: String }] // e.g., ["S", "M", "L"] or ["Red", "Blue"]
  }]
  
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);