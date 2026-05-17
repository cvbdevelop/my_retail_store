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
  const [imageFile, setImageFile] = useState(null); 
  const [isUploading, setIsUploading] = useState(false); 

  const [editingId, setEditingId] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === SECRET_PIN) setIsAuthenticated(true);
    else { alert("Incorrect password!"); setPassword(''); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://my-retail-store.onrender.com/api/products');
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get('https://my-retail-store.onrender.com/api/orders');
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    if (isAuthenticated) { fetchProducts(); fetchOrders(); }
  }, [isAuthenticated]);

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setFormData({
      nameEn: product.name?.en || '',
      nameKm: product.name?.km || '',
      price: product.price || '',
      descEn: product.description?.en || '',
      descKm: product.description?.km || '',
      category: product.category || 'All'
    });
    setImageFile(null); 
    document.getElementById('file-upload').value = ""; 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nameEn: '', nameKm: '', price: '', descEn: '', descKm: '', category: '' });
    setImageFile(null);
    document.getElementById('file-upload').value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    let secureImageUrl = editingId 
      ? products.find(p => p._id === editingId)?.image 
      : "";

    try {
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        uploadData.append("upload_preset", "my_store_upload"); 
        uploadData.append("cloud_name", "diw2xuquz"); 

        const cloudinaryRes = await axios.post(
          "https://api.cloudinary.com/v1_1/diw2xuquz/image/upload", 
          uploadData
        );
        secureImageUrl = cloudinaryRes.data.secure_url; 
      }

      const productData = {
        name: { en: formData.nameEn, km: formData.nameKm },
        price: Number(formData.price),
        description: { en: formData.descEn, km: formData.descKm },
        image: secureImageUrl, 
        category: formData.category || "All"
      };

      if (editingId) {
        await axios.put(`https://my-retail-store.onrender.com/api/products/${editingId}`, productData);
        alert("Product Updated Successfully!");
      } else {
        await axios.post('https://my-retail-store.onrender.com/api/products', productData);
        alert("Product Added Successfully!");
      }
      
      cancelEdit();
      fetchProducts(); 
      
    } catch (err) { 
      console.error(err);
      alert("Failed to save product.");
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
            <input type="password" placeholder="Enter Secret PIN" className="w-full p-4 border rounded-xl mb-4 text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg active:scale-95">Unlock Dashboard</button>
          </form>
          <Link to="/" className="block mt-6 text-sm text-gray-400 hover:text-blue-600 transition">← Back to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-khmer">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="text-blue-600 hover:underline font-medium inline-block">← Back to Store</Link>
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button onClick={() => setActiveTab('products')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Inventory Management</button>
            <button onClick={() => setActiveTab('orders')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>
              Recent Orders {orders.length > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{orders.length}</span>}
            </button>
          </div>
        </div>
        
        {activeTab === 'products' && (
          <div className="space-y-8 animate-fade-in">
            <div className={`p-8 rounded-3xl shadow-xl transition-colors ${editingId ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingId ? '✏️ Edit Product' : 'Add New Product'}
                </h2>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="text-sm font-bold text-red-500 hover:underline">
                    Cancel Edit
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Name (EN)" className="p-3 border rounded-xl focus:ring-2 outline-none" value={formData.nameEn} onChange={(e)=>setFormData({...formData, nameEn:e.target.value})} required />
                <input type="text" placeholder="ឈ្មោះ (KH)" className="p-3 border rounded-xl focus:ring-2 outline-none" value={formData.nameKm} onChange={(e)=>setFormData({...formData, nameKm:e.target.value})} required />
                <input type="number" placeholder="Price ($)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" value={formData.price} onChange={(e)=>setFormData({...formData, price:e.target.value})} required />
                <textarea placeholder="Description (English)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" rows="2" value={formData.descEn} onChange={(e)=>setFormData({...formData, descEn:e.target.value})} />
                <textarea placeholder="ការពិពណ៌នា (ភាសាខ្មែរ)" className="p-3 border rounded-xl col-span-2 focus:ring-2 outline-none" rows="2" value={formData.descKm} onChange={(e)=>setFormData({...formData, descKm:e.target.value})} />
                
                {/* --- UPDATED: DYNAMIC CATEGORY INPUT --- */}
                <div className="col-span-2">
                  <input 
                    list="category-options"
                    placeholder="Select or type a new category (e.g. Shoes)..."
                    className="w-full p-3 border rounded-xl focus:ring-2 outline-none bg-white text-gray-700"
                    value={formData.category} 
                    onChange={(e)=>setFormData({...formData, category: e.target.value})}
                    required
                  />
                  <datalist id="category-options">
                    <option value="Food & Drink" />
                    <option value="Clothes" />
                    <option value="Electronics" />
                  </datalist>
                </div>
                {/* ------------------------------ */}

                <div className="col-span-2 p-3 border rounded-xl bg-white flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-bold">
                    {editingId ? 'Update Image (Optional):' : 'Upload Product Image:'}
                  </span>
                  <input id="file-upload" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" required={!editingId} />
                </div>
                
                <button disabled={isUploading} className={`text-white py-3 rounded-xl font-bold col-span-2 transition shadow-lg active:scale-95 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {isUploading ? 'Uploading to Cloud...' : (editingId ? 'Update Product' : 'Save Product')}
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-bold mb-6">Manage Inventory</h2>
              <div className="space-y-4">
                {products.map(product => (
                  <div key={product._id} className={`flex items-center justify-between border-b pb-4 transition-all ${editingId === product._id ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <img src={product.image} className="w-12 h-12 object-cover rounded-lg" alt="thumb" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544787210-282744e79c1b?q=80&w=400"; }} />
                      <div>
                        <p className="font-bold text-gray-800">{product.name?.en}</p>
                        <p className="text-sm text-blue-600 font-bold">${product.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(product)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                        Edit
                      </button>
                      <button onClick={() => deleteProduct(product._id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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