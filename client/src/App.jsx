import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { Link } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import './i18n'

function App() {
  const [products, setProducts] = useState([]);
  
  // PERSISTENT CART STATE
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('myStoreCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [myPastOrders, setMyPastOrders] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [gridRef] = useAutoAnimate(); 
  const [cartRef] = useAutoAnimate(); 

  const [checkoutStep, setCheckoutStep] = useState('cart'); 
  const [orderId, setOrderId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariantOption, setSelectedVariantOption] = useState("");

  const { t, i18n } = useTranslation();
  
  // --- NEW: AUTHENTICATION STATE ---
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('myStoreUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('myStoreToken') || null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [isLoginMode, setIsLoginMode] = useState(true);

  // AUTO-SAVE CART
  useEffect(() => {
    localStorage.setItem('myStoreCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('https://my-retail-store.onrender.com/api/products');
        setProducts(res.data);
      } catch (err) { console.error(err); }
    };
    fetchProducts();
  }, []);

  const toggleLang = () => { i18n.changeLanguage(i18n.language === 'en' ? 'km' : 'en'); };

 const addToCart = (product, variantOption = null) => {
    // Create a unique cart ID so different variants don't merge into one item
    const cartId = variantOption ? `${product._id}-${variantOption}` : product._id;

    // Check if the item is already maxed out
    const existingItem = cart.find(item => item.cartId === cartId);
    if (existingItem && existingItem.quantity >= product.stock) {
      toast.error(i18n.language === 'en' ? `Only ${product.stock} in stock!` : `មានតែ ${product.stock} ក្នុងស្តុក!`);
      return; 
    }

    setCart((prev) => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, cartId, selectedVariant: variantOption, quantity: 1 }];
    });
    toast.success(i18n.language === 'en' ? `${product.name?.en || 'Item'} added!` : `បានបន្ថែម!`);
  };
  
  const updateCartQuantity = (cartId, change) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.cartId === cartId) {
          return { ...item, quantity: item.quantity + change };
        }
        return item;
      }).filter(item => item.quantity > 0); 
    });
  };

  const handleCheckout = async () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const toastId = toast.loading("Processing payment and finalizing order...");

    try {
      const response = await axios.post('https://my-retail-store.onrender.com/api/checkout', { 
        cart, 
        total,
        customer: customerInfo 
      });
      
      toast.success("Payment Received! Order Confirmed.", { id: toastId });
      setOrderId(response.data.orderId); 
      setCheckoutStep('success'); 
      setCart([]); 
    } catch (error) {
      toast.error("Checkout failed. Server error.", { id: toastId });
    }
  };
  
  // --- NEW: AUTHENTICATION LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const toastId = toast.loading(isLoginMode ? "Logging in..." : "Creating account...");

    try {
      const res = await axios.post(`https://my-retail-store.onrender.com${endpoint}`, authForm);
      
      // Save the token and user to browser storage
      localStorage.setItem('myStoreToken', res.data.token);
      localStorage.setItem('myStoreUser', JSON.stringify(res.data.user));
      
      setAuthToken(res.data.token);
      setAuthUser(res.data.user);
      
      // Pre-fill delivery info if they have it
      setCustomerInfo({ 
        name: res.data.user.name || '', 
        phone: res.data.user.phone || '', 
        address: res.data.user.address || '' 
      });

      toast.success(`Welcome, ${res.data.user.name}!`, { id: toastId });
      if (checkoutStep === 'auth') setCheckoutStep('delivery');
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed", { id: toastId });
    }
  };

  const fetchMyOrders = async () => {
    try {
      const res = await axios.get('https://my-retail-store.onrender.com/api/orders');
      // Filter orders to only show the ones belonging to the logged-in user
      const userOrders = res.data.filter(order => order.customer?.name === authUser.name);
      setMyPastOrders(userOrders);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('myStoreToken');
    localStorage.removeItem('myStoreUser');
	localStorage.removeItem('cart'); // <-- ADD THIS: Clears the saved cart memory
    setAuthToken(null);
    setAuthUser(null);
    setCustomerInfo({ name: '', phone: '', address: '' });
	setCart([]); // <-- ADD THIS: Empties the cart immediately on the screen
    toast.success("Logged out successfully");
  };

  // DYNAMIC CATEGORY LOGIC
  const baseCategories = [
    { value: "All", en: "All Categories", km: "ប្រភេទទាំងអស់" },
    { value: "Food & Drink", en: "Food & Drink", km: "អាហារ និងភេសជ្ជៈ" },
    { value: "Clothes", en: "Clothes", km: "សម្លៀកបំពាក់" },
    { value: "Electronics", en: "Electronics", km: "គ្រឿងអេឡិចត្រូនិក" },
    { value: "Sports & Outdoors", en: "Sports & Outdoors", km: "កីឡា និងសកម្មភាពក្រៅផ្ទះ" },
    // Just add your new one here!
    { value: "Toys", en: "Toys", km: "ប្រដាប់ក្មេងលេង" } 
  ];

  const uniqueDbCategories = [...new Set(products.map(p => p.category))].filter(Boolean);
  const categories = [...baseCategories];
  uniqueDbCategories.forEach(cat => {
    if (!categories.find(c => c.value === cat) && cat !== "All") {
      categories.push({ value: cat, en: cat, km: cat }); 
    }
  });

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const nameEn = p.name?.en?.toLowerCase() || "";
    const nameKm = p.name?.km || "";
    const matchesSearch = nameEn.includes(searchLower) || nameKm.includes(searchTerm);
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const closeCart = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setCheckoutStep('cart');
      setOrderId(null);
    }, 300); 
  };

  return (
    <div className="min-h-screen bg-gray-50 font-khmer">
      <Toaster position="bottom-center" />

      {/* --- NEW HEADER DESIGN --- */}
      <div className="bg-white">
        {/* Top Logo and Cart Info Row */}
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Custom Image Logo */}
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { setActiveCategory("All"); setSelectedProduct(null); }}
          >
            <img 
              src="/logo.png" 
              alt="My Retail Store Logo" 
              className="h-16 md:h-20 w-auto object-contain drop-shadow-sm" 
            />
          </div>

          {/* Right side Utility Text & Cart */}
          <div className="text-sm text-gray-600 flex flex-wrap items-center justify-center gap-2">
            <span>{i18n.language === 'en' ? 'Welcome to our Online Store!' : 'សូមស្វាគមន៍មកកាន់ហាងអនឡាញរបស់យើង!'}</span>
            
            <button onClick={() => setIsCartOpen(true)} className="text-red-600 font-bold ml-2 flex items-center hover:underline">
              {i18n.language === 'en' ? 'Cart:' : 'កន្ត្រក:'} <span className="ml-1 text-gray-800 font-normal">{cart.length} item(s) - ${cartTotal.toFixed(2)}</span>
              <span className="ml-2 text-[10px] text-red-600">▼</span>
            </button>
            
            {/* Admin and Language Toggles */}
            <div className="flex items-center ml-4 pl-4 border-l border-gray-300 gap-4">
              {authUser ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => { setIsCartOpen(true); setCheckoutStep('orders'); fetchMyOrders(); }} className="text-xs font-bold text-gray-600 hover:text-red-700 uppercase">
                    {i18n.language === 'en' ? 'My Orders' : 'ការបញ្ជាទិញរបស់ខ្ញុំ'}
                  </button>
                  <button onClick={handleLogout} className="text-xs font-bold text-gray-600 hover:text-red-700 uppercase border-l pl-3 border-gray-300">
                    {i18n.language === 'en' ? `Hi, ${authUser.name.split(' ')[0]} (Logout)` : `សួស្តី, ${authUser.name.split(' ')[0]} (ចាកចេញ)`}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setIsCartOpen(true); setCheckoutStep('auth'); }} className="text-xs font-bold text-gray-400 hover:text-red-700 uppercase">
                  {i18n.language === 'en' ? 'Login' : 'ចូលគណនី'}
                </button>
              )}
              <Link to="/admin" className="hover:text-red-700 transition font-medium text-xs uppercase tracking-wider text-gray-400">Admin</Link>
              <button onClick={toggleLang} className="hover:text-red-700 transition font-bold uppercase text-xs">
                {i18n.language === 'en' ? 'KH' : 'EN'}
              </button>
            </div>
          </div>
        </div>

        {/* Dark Navigation Bar */}
        <div className="bg-gray-800 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center">
            
            {/* Links */}
            <div className="flex w-full md:w-auto text-sm font-bold uppercase overflow-x-auto">
              <button className="bg-red-700 px-6 py-3.5 hover:bg-red-800 transition">
                {i18n.language === 'en' ? 'Home' : 'ទំព័រដើម'}
              </button>
              <button className="px-6 py-3.5 hover:bg-gray-700 border-r border-gray-700 transition">
                {i18n.language === 'en' ? 'About' : 'អំពីយើង'}
              </button>
              <button className="px-6 py-3.5 hover:bg-gray-700 border-r border-gray-700 transition hidden md:block">
                {i18n.language === 'en' ? 'Delivery' : 'ការដឹកជញ្ជូន'}
              </button>
              <button className="px-6 py-3.5 hover:bg-gray-700 border-r border-gray-700 transition hidden md:block">
                {i18n.language === 'en' ? 'News' : 'ព័ត៌មាន'}
              </button>
              <button className="px-6 py-3.5 hover:bg-gray-700 transition hidden md:block">
                {i18n.language === 'en' ? 'Contact' : 'ទំនាក់ទំនង'}
              </button>
            </div>

            {/* Embedded Search Box */}
            <div className="py-2 w-full md:w-auto pr-0 md:pr-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={i18n.language === 'en' ? "Search" : "ស្វែងរក"}
                  className="w-full md:w-64 py-1.5 px-3 pr-8 bg-white rounded text-gray-800 text-sm focus:outline-none shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute right-2 top-1.5 text-gray-400 text-sm">🔍</span>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* --------------------------- */}

      {/* --- BODY LAYOUT: SIDEBAR + MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-red-700 text-white font-bold px-4 py-3 text-lg uppercase tracking-wide">
            {i18n.language === 'en' ? 'Categories' : 'ប្រភេទ'}
          </div>
          <div className="border border-t-0 border-gray-200 bg-white shadow-sm">
            <ul className="text-sm text-gray-600">
              {categories.map(cat => (
                <li key={cat.value} className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => { setActiveCategory(cat.value); setSelectedProduct(null); }}
                    className={`w-full text-left px-4 py-3 hover:text-red-700 hover:bg-gray-50 flex items-center gap-3 transition-colors uppercase text-xs tracking-wider font-bold ${activeCategory === cat.value ? 'text-red-700 bg-gray-50' : ''}`}
                  >
                    <span className="text-gray-300 text-[10px]">▶</span>
                    {i18n.language === 'en' ? cat.en : cat.km}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1">
          {!selectedProduct ? (
            /* PRODUCT GRID */
            <div>
              <div className="border-b-2 border-gray-200 pb-2 mb-6">
                 <h2 className="text-2xl font-normal text-gray-800 uppercase">
                    {i18n.language === 'en' ? 'Products' : 'ផលិតផល'}
                 </h2>
              </div>
              
              <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="bg-white p-4 border border-gray-200 transition-all hover:shadow-lg group flex flex-col">
                    <div className="overflow-hidden mb-4 aspect-square bg-gray-50 relative cursor-pointer" onClick={() => setSelectedProduct(product)}>
                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544787210-282744e79c1b?q=80&w=400"; }} />
                    </div>
                    <h3 className="text-sm font-bold mb-1 text-gray-800 cursor-pointer hover:text-red-600 transition truncate" onClick={() => setSelectedProduct(product)}>
                      {product.name?.[i18n.language] || product.name?.en}
                    </h3>
                    
                    {/* --- THE FIXED BOTTOM SECTION --- */}
                    <div className="mt-auto pt-4 flex flex-col gap-3">
                      <div className="flex justify-between items-end px-1">
                        <span className="text-xl font-bold text-red-600 block">${product.price.toFixed(2)}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {i18n.language === 'en' ? `Stock: ${product.stock}` : `ស្តុក: ${product.stock}`}
                        </span>
                      </div>
                      <button 
                        onClick={() => addToCart(product)} 
                        disabled={product.stock <= 0}
                        className={`w-full py-3 font-bold text-sm uppercase tracking-widest transition rounded-sm ${product.stock <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-700 text-white hover:bg-gray-900'}`}
                      >
                        {product.stock <= 0 ? (i18n.language === 'en' ? 'Out of Stock' : 'អស់ពីស្តុក') : (i18n.language === 'en' ? 'Add to Cart' : 'បន្ថែមទៅកន្ត្រក')}
                      </button>
                    </div>
                    {/* -------------------------------- */}
                    
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* PRODUCT DETAILS VIEW */
            <div className="bg-white shadow-sm border border-gray-200 p-6 md:p-10 animate-fade-in">
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-700 font-bold mb-8 flex items-center gap-2 transition-colors text-sm uppercase">
                ← {i18n.language === 'en' ? 'Back' : 'ត្រឡប់'}
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="border border-gray-200 p-2 aspect-square">
                  <img src={selectedProduct.image} className="w-full h-full object-cover" alt="Detail" />
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 border-b pb-2">{selectedProduct.category}</span>
                  <h2 className="text-3xl font-normal text-gray-900 mb-6">
                    {selectedProduct.name?.[i18n.language] || selectedProduct.name?.en}
                  </h2>
                  
                  {/* --- NEW: VARIANT SELECTOR --- */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && selectedProduct.variants[0].options.length > 0 && (
                    <div className="mb-6">
                      <span className="text-sm font-bold text-gray-700 block mb-3 uppercase tracking-wider">
                        {selectedProduct.variants[0].name}:
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.variants[0].options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setSelectedVariantOption(opt)}
                            className={`px-5 py-2 border rounded-sm text-sm font-bold transition-all ${selectedVariantOption === opt ? 'border-red-700 bg-red-50 text-red-700 shadow-sm' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-8">
                    {selectedProduct.description?.[i18n.language] || selectedProduct.description?.en}
                  </p>
                  
                  <button 
                    onClick={() => addToCart(selectedProduct, selectedVariantOption)} 
                    disabled={selectedProduct.stock <= 0 || (selectedProduct.variants?.length > 0 && !selectedVariantOption)}
                    className={`w-full md:w-auto px-8 py-4 text-sm font-bold uppercase tracking-wider transition ${selectedProduct.stock <= 0 || (selectedProduct.variants?.length > 0 && !selectedVariantOption) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-700 text-white hover:bg-gray-800'}`}
                  >
                    {selectedProduct.stock <= 0 ? (i18n.language === 'en' ? 'Out of Stock' : 'អស់ពីស្តុក') : (i18n.language === 'en' ? 'Add to Cart' : 'បន្ថែមចូលកន្ត្រក')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- CART SIDEBAR WIZARD (Unchanged, just matching colors) --- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-md h-[100dvh] shadow-2xl p-4 md:p-8 flex flex-col animate-slide-in overflow-hidden">
            
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <div className="flex items-center gap-3">
                {checkoutStep !== 'cart' && checkoutStep !== 'success' && (
                  <button onClick={() => setCheckoutStep(checkoutStep === 'payment' ? 'delivery' : 'cart')} className="text-gray-400 hover:text-red-700">← Back</button>
                )}
                <h2 className="text-2xl font-normal text-gray-800 uppercase tracking-tight">
                  {checkoutStep === 'cart' && (i18n.language === 'en' ? 'Your Cart' : 'កន្ត្រករបស់អ្នក')}
                  {checkoutStep === 'delivery' && (i18n.language === 'en' ? 'Delivery Details' : 'ព័ត៌មានដឹកជញ្ជូន')}
                  {checkoutStep === 'payment' && (i18n.language === 'en' ? 'Scan to Pay' : 'ស្កេនដើម្បីបង់ប្រាក់')}
                  {checkoutStep === 'success' && (i18n.language === 'en' ? 'Success!' : 'ជោគជ័យ!')}
                </h2>
              </div>
              <button onClick={closeCart} className="text-gray-400 hover:text-red-700 bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
            </div>

            <div ref={cartRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
              {/* STEP 1: CART LIST */}
              {checkoutStep === 'cart' && (
                cart.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-4">
                    <span className="text-5xl">🛒</span>
                    <p>{i18n.language === 'en' ? 'Your cart is empty.' : 'កន្ត្រករបស់អ្នកទទេរ។'}</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item._id} className="flex gap-3 items-center border-b border-gray-100 pb-4 mb-4 last:border-0">
                      <img src={item.image} className="w-16 h-16 object-cover border border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-800 truncate">
                          {item.name?.[i18n.language] || item.name?.en}
                          {item.selectedVariant && <span className="ml-2 text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs">{item.selectedVariant}</span>}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">${item.price.toFixed(2)} / {i18n.language === 'en' ? 'ea' : 'មួយ'}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-200">
                          <button onClick={() => updateCartQuantity(item.cartID || item._id, -1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-red-700 transition">-</button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button 
  onClick={() => updateCartQuantity(item.cartID || item._id	, 1)} 
  disabled={item.quantity >= item.stock}
  className={`px-2 py-1 transition ${item.quantity >= item.stock ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-red-700'}`}
>
  +
</button>
                        </div>
                        <div className="font-bold text-red-700 min-w-[3.5rem] text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

{/* --- NEW: STEP 1.5: LOGIN/REGISTER --- */}
              {checkoutStep === 'auth' && (
                <div className="space-y-6 pt-4 animate-fade-in">
                  <div className="flex justify-center space-x-4 mb-6 border-b pb-4">
                    <button onClick={() => setIsLoginMode(true)} className={`font-bold pb-2 px-4 ${isLoginMode ? 'text-red-700 border-b-2 border-red-700' : 'text-gray-400'}`}>Login</button>
                    <button onClick={() => setIsLoginMode(false)} className={`font-bold pb-2 px-4 ${!isLoginMode ? 'text-red-700 border-b-2 border-red-700' : 'text-gray-400'}`}>Register</button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    {!isLoginMode && (
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                        <input type="text" required className="w-full p-3 border focus:border-red-700 outline-none" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
                      <input type="email" required className="w-full p-3 border focus:border-red-700 outline-none" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Password</label>
                      <input type="password" required className="w-full p-3 border focus:border-red-700 outline-none" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                    </div>
                    
                    <button type="submit" className="w-full bg-red-700 text-white py-4 font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition mt-4">
                      {isLoginMode ? 'Sign In' : 'Create Account'}
                    </button>
                    
                    {/* Skip Login Option */}
                    <button type="button" onClick={() => setCheckoutStep('delivery')} className="w-full text-gray-500 py-3 text-xs uppercase font-bold hover:text-red-700 transition">
                      Continue as Guest
                    </button>
                  </form>
                </div>
              )}
			  
{/* --- NEW: STEP 4: MY ORDERS --- */}
              {checkoutStep === 'orders' && (
                <div className="space-y-4 pt-4 animate-fade-in">
                  <h3 className="font-bold text-lg border-b pb-2 mb-4 text-gray-800">
                    {i18n.language === 'en' ? 'Order History' : 'ប្រវត្តិការបញ្ជាទិញ'}
                  </h3>
                  
                  {myPastOrders.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">
                      {i18n.language === 'en' ? 'You have no past orders.' : 'អ្នកមិនមានប្រវត្តិការបញ្ជាទិញទេ។'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {myPastOrders.map(order => (
                        <div key={order._id} className="border rounded-xl p-4 bg-gray-50 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500 font-bold">{new Date(order.date).toLocaleDateString()}</span>
                            <span className="font-black text-red-700">${Number(order.total).toFixed(2)}</span>
                          </div>
                          <ul className="text-sm space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between text-gray-700">
                                <span><span className="text-red-700 font-bold">{item.quantity}x</span> {item.name?.en}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setCheckoutStep('cart')} className="w-full text-gray-500 py-3 text-xs uppercase font-bold hover:text-red-700 transition mt-4">
                    ← {i18n.language === 'en' ? 'Back to Cart' : 'ត្រឡប់ទៅកន្ត្រក'}
                  </button>
                </div>
              )}
			  
              {/* STEP 2: DELIVERY FORM */}
              {checkoutStep === 'delivery' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">{i18n.language === 'en' ? 'Full Name' : 'ឈ្មោះ​ពេញ'}</label>
                    <input type="text" className="w-full p-3 border border-gray-300 focus:border-red-700 outline-none" placeholder="Chan Vibol" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">{i18n.language === 'en' ? 'Phone Number' : 'លេខទូរស័ព្ទ'}</label>
                    <input type="tel" className="w-full p-3 border border-gray-300 focus:border-red-700 outline-none" placeholder="012 345 678" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">{i18n.language === 'en' ? 'Delivery Address' : 'អាសយដ្ឋានដឹកជញ្ជូន'}</label>
                    <textarea className="w-full p-3 border border-gray-300 focus:border-red-700 outline-none" rows="3" placeholder="Phnom Penh, Cambodia..." value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}></textarea>
                  </div>
                </div>
              )}

              {/* STEP 3: KHQR PAYMENT SCREEN */}
              {checkoutStep === 'payment' && (
                <div className="text-center flex flex-col items-center justify-center pt-8">
                  <p className="text-gray-600 text-sm mb-6">
                    {i18n.language === 'en' ? 'Please scan the KHQR code below using your ABA or local banking app.' : 'សូមស្កេនកូដ KHQR ខាងក្រោមដោយប្រើកម្មវិធីធនាគាររបស់អ្នក។'}
                  </p>
                  
                  <div className="bg-white p-3 border-2 border-gray-200 w-64 mb-6">
                    <img src="/khqr.jpg" alt="Pay with KHQR" className="w-full h-auto" />
                  </div>
                  
                  <div className="text-3xl font-bold text-red-700 mb-1">
                    Total: ${cartTotal.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mb-8">
                    ({(cartTotal * 4100).toLocaleString()} ៛)
                  </p>
                </div>
              )}

              {/* STEP 4: SUCCESS SCREEN */}
              {checkoutStep === 'success' && (
                <div className="text-center flex flex-col items-center justify-center pt-10">
                  <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 border-2 border-green-200">✓</div>
                  <h3 className="text-2xl font-normal text-gray-900 mb-2">{i18n.language === 'en' ? 'Thank you!' : 'សូមអរគុណ!'}</h3>
                  <p className="text-gray-500 text-sm mb-8">{i18n.language === 'en' ? 'Your order is being prepared for delivery.' : 'ការបញ្ជាទិញរបស់អ្នកកំពុងរៀបចំសម្រាប់ការដឹកជញ្ជូន។'}</p>
                  
                  <div className="bg-gray-50 p-4 border border-gray-200 w-full mb-8 text-left">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{i18n.language === 'en' ? 'Order Number' : 'លេខ​បញ្ជា​ទិញ'}</p>
                    <p className="font-mono text-gray-800 font-bold break-all">{orderId}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* BOTTOM ACTION BUTTONS */}
            <div className="border-t pt-4 mt-4 bg-white shrink-0 pb-2">
              {checkoutStep === 'cart' && (
                <>
                  <div className="flex justify-between text-lg font-bold mb-6 text-gray-800">
                    <span>{i18n.language === 'en' ? 'Total' : 'សរុប'}</span><span className="text-red-700">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={() => setCheckoutStep(authUser ? 'delivery' : 'auth')} className="w-full bg-red-700 text-white py-4 font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition disabled:bg-gray-300" disabled={cart.length === 0}>
                    {i18n.language === 'en' ? 'Checkout' : 'ទូទាត់ប្រាក់'}
                  </button>
                </>
              )}

              {checkoutStep === 'delivery' && (
                <button onClick={() => setCheckoutStep('payment')} className="w-full bg-gray-900 text-white py-4 font-bold text-sm uppercase tracking-widest hover:bg-black transition disabled:bg-gray-300" disabled={!customerInfo.name || !customerInfo.phone}>
                  {i18n.language === 'en' ? 'Continue to Payment' : 'បន្តទៅការបង់ប្រាក់'}
                </button>
              )}

              {checkoutStep === 'payment' && (
                <button onClick={handleCheckout} className="w-full bg-green-600 text-white py-4 font-bold text-sm uppercase tracking-widest hover:bg-green-700 transition shadow-inner">
                  {i18n.language === 'en' ? 'I Have Paid' : 'បានបង់ប្រាក់រួចរាល់'}
                </button>
              )}

              {checkoutStep === 'success' && (
                <button onClick={closeCart} className="w-full bg-gray-200 text-gray-800 py-4 font-bold text-sm uppercase tracking-widest hover:bg-gray-300 transition">
                  {i18n.language === 'en' ? 'Continue Shopping' : 'បន្តការទិញទំនិញ'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20 border-t-4 border-red-700">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif text-white mb-4 tracking-tight"><span className="text-red-600">M</span>Y RETAIL STORE</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {i18n.language === 'en' ? 'Your premium destination for quality goods in Cambodia.' : 'ទិសដៅឈានមុខគេសម្រាប់ទំនិញមានគុណភាពនៅកម្ពុជា។'}
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">{i18n.language === 'en' ? 'Shop' : 'ហាង'}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-500 transition">{i18n.language === 'en' ? 'New Arrivals' : 'ទំនិញថ្មីៗ'}</a></li>
              <li><a href="#" className="hover:text-red-500 transition">{i18n.language === 'en' ? 'Best Sellers' : 'លក់ដាច់បំផុត'}</a></li>
              <li><a href="#" className="hover:text-red-500 transition">{i18n.language === 'en' ? 'Discounts' : 'បញ្ចុះតម្លៃ'}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">{i18n.language === 'en' ? 'Support' : 'ជំនួយ'}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-500 transition">{i18n.language === 'en' ? 'Contact Us' : 'ទាក់ទងមកយើង'}</a></li>
              <li><a href="#" className="hover:text-red-500 transition">{i18n.language === 'en' ? 'Shipping & Returns' : 'ការដឹកជញ្ជូន និងការបង្វិលសង'}</a></li>
              <li><a href="#" className="hover:text-red-500 transition">{i18n.language === 'en' ? 'FAQ' : 'សំណួរដែលសួរញឹកញាប់'}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">{i18n.language === 'en' ? 'Accepted Payments' : 'ការទូទាត់ប្រាក់'}</h4>
            <div className="flex gap-2 mb-6">
              <div className="bg-white text-blue-800 text-[10px] font-bold px-2 py-1">ABA</div>
              <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1">KHQR</div>
            </div>
            <p className="text-sm">📍 {i18n.language === 'en' ? 'Phnom Penh, Cambodia' : 'រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា'}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-xs text-center text-gray-500 uppercase tracking-widest">
          © {new Date().getFullYear()} My Retail Store. {i18n.language === 'en' ? 'All rights reserved.' : 'រក្សាសិទ្ធិគ្រប់យ៉ាង។'}
        </div>
      </footer>
    </div>
  )
}

export default App