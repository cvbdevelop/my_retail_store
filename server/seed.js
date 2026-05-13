const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/my_retail_store';

const sampleProducts = [
  {
    name: { en: "Premium Japanese Matcha", km: "តែម៉ាឆាជប៉ុនគុណភាពខ្ពស់" },
    price: 25.00,
    description: { 
        en: "Ceremonial grade matcha powder, perfect for traditional tea or lattes.", 
        km: "ម្សៅម៉ាឆាកម្រិតខ្ពស់ សាកសមសម្រាប់ឆុងតែបែបប្រពៃណី ឬឡាតេ។" 
    },
    // NEW RELIABLE LINK
    image: "https://images.unsplash.com/photo-1582743223223-21b8104e5488?auto=format&fit=crop&w=600&q=80",
    category: "Beverage"
  },
  {
    name: { en: "Handmade Khmer Silk Scarf", km: "ក្រមាដែលត្បាញដោយដៃ" },
    price: 45.00,
    description: { 
        en: "Traditionally woven 100% natural silk scarf from Takeo province.", 
        km: "ក្រមាសូត្រធម្មជាតិ ១០០% ត្បាញតាមបែបប្រពៃណីមកពីខេត្តតាកែវ។" 
    },
    image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=80",
    category: "Fashion"
  },
  {
    name: { en: "Smart Tech Hub", km: "ឧបករណ៍បញ្ជាវៃឆ្លាត" },
    price: 120.00,
    description: { 
        en: "Control your entire home with this AI-powered central hub.", 
        km: "បញ្ជាឧបករណ៍ក្នុងផ្ទះទាំងមូលរបស់អ្នកជាមួយមជ្ឈមណ្ឌលវៃឆ្លាត AI នេះ។" 
    },
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80",
    category: "Electronics"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB for seeding...");
    
    await Product.deleteMany({}); // Clears old data
    await Product.insertMany(sampleProducts);
    
    console.log("Database Seeded Successfully! 🌱");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();