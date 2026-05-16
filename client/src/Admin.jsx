import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const SECRET_PIN = "8888"; 

  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [formData, setFormData] = useState({
    nameEn: '', nameKm: '', price: '', descEn: '', descKm: '', category: ''
  });
  // NEW: State to hold the actual image file from your computer
  const [imageFile, setImageFile] = useState(null); 
  const [isUploading, setIsUploading] = useState(false); // Shows a loading state

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
      const res = await axios.get('https://my-retail-store.onrender.com/api/products');
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  // NEW: Fetch Orders function
  const fetchOrders = async () => {
    try {
      const res = await axios.get('https://my-retail-store.onrender.com/api/orders');
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchProducts(); 
      fetchOrders(); 
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    let secureImageUrl = "";

    try {
      // 1. UPLOAD IMAGE TO CLOUDINARY FIRST
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        
        // IMPORTANT: Replace these with your actual Cloud Name and Preset Name!
        uploadData.append("upload_preset", "YOUR_UPLOAD_PRESET_NAME"); 
        uploadData.append("cloud_name", "YOUR_CLOUD_NAME"); 

        const cloudinaryRes = await axios.post(
          "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", 
          uploadData
        );
        secureImageUrl = cloudinaryRes.data.secure_url; // This is the permanent link!
      }

      // 2. SAVE PRODUCT TO MONGODB
      const newProduct = {
        name: { en: formData.nameEn, km: formData.nameKm },
        price: Number(formData.price),
        description: { en: formData.descEn, km: formData.descKm },
        image: secureImageUrl, // Use the new Cloudinary link here
        category: formData.category || "All"
      };

      await axios.post('https://my-retail-store.onrender.com/api/products', newProduct);
      alert("Product Added Successfully!");
      
      // Reset the form
      setFormData({ nameEn: '', nameKm: '', price: '', descEn: '', descKm: '', category: '' });
      setImageFile(null);
      document.getElementById('file-upload').value = ""; // Clear file input UI
      fetchProducts(); 
      
    } catch (err) { 
      console.error(err);
      alert("Failed to save product or upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`https://my-retail-store.onrender.com/api/products/${id}`);
        fetchProducts(); 
      } catch (err) { console.error(err); }
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-khmer">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Navigation & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="text-blue-600 hover:underline font-medium inline-block">
            ← Back to Store
          </Link>
          
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button 
              onClick={() => setActiveTab('products')} 
              className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Inventory Management
            </button>
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Recent Orders
              {orders.length > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{orders.length}</span>}
            </button>
          </div>
        </div>
        
        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-8 animate-fade-in">
            {/* Add Form */}
        <div className="bg-white p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Name (EN)" className="p-3 border rounded-xl focus:ring-2 outline-none" value={formData.nameEn} onChange={(e)=>setFormData({...formData, nameEn:e.target.value})} required />
            <input type="text" placeholder="ឈ្មោះ (KH)" className="p-3 border rounded-xl focus:ring-2 outline-none" value={formData.nameKm} onChange={(e)=>setFormData({...formData, nameKm:e.target.value})} required />
            <input type="number" placeholder="Price ($)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" value={formData.price} onChange={(e)=>setFormData({...formData, price:e.target.value})} required />
            <textarea placeholder="Description (English)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" rows="2" value={formData.descEn} onChange={(e)=>setFormData({...formData, descEn:e.target.value})} />
            <textarea placeholder="ការពិពណ៌នា (ភាសាខ្មែរ)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" rows="2" value={formData.descKm} onChange={(e)=>setFormData({...formData, descKm:e.target.value})} />
            
            {/* NEW: File Upload Input */}
            <div className="col-span-2 p-3 border rounded-xl bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-bold">Upload Product Image:</span>
              <input 
                id="file-upload"
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])} 
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                required
              />
            </div>
            
            <button 
              disabled={isUploading}
              className={`text-white py-3 rounded-xl font-bold col-span-2 transition shadow-lg active:scale-95 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isUploading ? 'Uploading to Cloud...' : 'Save Product'}
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
                    <button onClick={() => deleteProduct(product._id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition font-medium">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">Customer Orders</h2>
            
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No orders have been placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                      <th className="p-4 rounded-tl-xl font-bold">Date</th>
                      <th className="p-4 font-bold">Customer Details</th>
                      <th className="p-4 font-bold">Items Purchased</th>
                      <th className="p-4 rounded-tr-xl font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order._id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString()} <br/>
                          {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{order.customer?.name}</p>
                          <p className="text-sm text-gray-600">📞 {order.customer?.phone}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2 max-w-xs">{order.customer?.address}</p>
                        </td>
                        <td className="p-4">
                          <ul className="text-sm space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex gap-2 text-gray-700">
                                <span className="font-medium text-blue-600">{item.quantity}x</span> 
                                {item.name?.en}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 text-right font-black text-lg text-gray-900">
                          ${order.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;