import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Admin() {
  // --- SECURITY STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const SECRET_PIN = "8888"; 

  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    nameEn: '', nameKm: '', price: '', descEn: '', descKm: '', image: '', category: ''
  });

  // --- LOGIN LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === SECRET_PIN) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password!");
      setPassword('');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://my-retail-store-slon.onrender.com/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchProducts(); 
    }
  }, [isAuthenticated]);

  // --- PRODUCT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // THE FIX: Nesting the language data exactly how MongoDB expects it
    const newProduct = {
      name: {
        en: formData.nameEn,
        km: formData.nameKm
      },
      price: Number(formData.price),
      description: {
        en: formData.descEn,
        km: formData.descKm
      },
      image: formData.image,
      category: formData.category || "All"
    };

    try {
      await axios.post('https://my-retail-store-slon.onrender.com/api/products', newProduct);
      alert("Product Added Successfully!");
      setFormData({ nameEn: '', nameKm: '', price: '', descEn: '', descKm: '', image: '', category: '' });
      fetchProducts(); 
    } catch (err) { 
      console.error("The error is:", err.response?.data || err.message); 
      alert("Failed to save. Check the console for the reason.");
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`https://my-retail-store-slon.onrender.com/api/products/${id}`);
        fetchProducts(); 
      } catch (err) { console.error(err); }
    }
  };

  // --- 1. THE LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-khmer">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold mb-6">Admin Access</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Enter Secret PIN" 
              className="w-full p-4 border rounded-xl mb-4 text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg active:scale-95">
              Unlock Dashboard
            </button>
          </form>
          <Link to="/" className="block mt-6 text-sm text-gray-400 hover:text-blue-600 transition">
            ← Back to Store
          </Link>
        </div>
      </div>
    );
  }

  // --- 2. THE SECURE DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-khmer">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="text-blue-600 hover:underline font-medium inline-block">
          ← Back to Store
        </Link>
        
        {/* Add Form */}
        <div className="bg-white p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Name (EN)" className="p-3 border rounded-xl focus:ring-2 outline-none" value={formData.nameEn} onChange={(e)=>setFormData({...formData, nameEn:e.target.value})} required />
            <input type="text" placeholder="ឈ្មោះ (KH)" className="p-3 border rounded-xl focus:ring-2 outline-none" value={formData.nameKm} onChange={(e)=>setFormData({...formData, nameKm:e.target.value})} required />
            
            <input type="number" placeholder="Price ($)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" value={formData.price} onChange={(e)=>setFormData({...formData, price:e.target.value})} required />
            
            <textarea placeholder="Description (English)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" rows="2" value={formData.descEn} onChange={(e)=>setFormData({...formData, descEn:e.target.value})} />
            <textarea placeholder="ការពិពណ៌នា (ភាសាខ្មែរ)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" rows="2" value={formData.descKm} onChange={(e)=>setFormData({...formData, descKm:e.target.value})} />
            
            <input type="text" placeholder="Image URL" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" value={formData.image} onChange={(e)=>setFormData({...formData, image:e.target.value})} />
            
            <button className="bg-blue-600 text-white py-3 rounded-xl font-bold col-span-2 hover:bg-blue-700 transition shadow-lg active:scale-95">
              Save Product
            </button>
          </form>
        </div>

        {/* Management List */}
        <div className="bg-white p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Manage Inventory</h2>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product._id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <img src={product.image} className="w-12 h-12 object-cover rounded-lg" alt="thumb" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544787210-282744e79c1b?q=80&w=400"; }} />
                  <div>
                    <p className="font-bold">{product.name?.en}</p>
                    <p className="text-sm text-gray-500">${product.price}</p>
                  </div>
                </div>
                <button 
                  onClick={() => deleteProduct(product._id)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;