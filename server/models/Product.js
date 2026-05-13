const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    km: { type: String, required: true }
  },
  price: { type: Number, required: true },
  description: {
    en: String,
    km: String
  },
  image: { type: String, default: "https://via.placeholder.com/300" },
  category: String
});

module.exports = mongoose.model('Product', ProductSchema);