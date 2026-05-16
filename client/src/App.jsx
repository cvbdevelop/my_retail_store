import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { Link } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import './i18n'

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Food & Drink", "Apparel", "Electronics"];
  const [gridRef] = useAutoAnimate(); 
  const [cartRef] = useAutoAnimate(); 

  // --- NEW: CHECKOUT WIZARD STATE ---
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'delivery', 'payment', 'success'
  const [orderId, setOrderId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });

  const { t, i18n } = useTranslation();

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

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) return prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(i18n.language === 'en' ? `${product.name.en} added!` : `បានបន្ថែម!`);
  };

  const handleCheckout = async () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const toastId = toast.loading("Processing payment and finalizing order...");

    try {
      // Send cart AND customer info to backend
      const response = await axios.post('https://my-retail-store.onrender.com/api/checkout', { 
        cart, 
        total,
        customer: customerInfo 
      });
      
      toast.success("Payment Received! Order Confirmed.", { id: toastId });
      setOrderId(response.data.orderId); // Save the database ID to show the customer
      setCheckoutStep('success'); // Move to Thank You screen
      setCart([]); // Empty the cart
    } catch (error) {
      toast.error("Checkout failed. Server error.", { id: toastId });
    }
  };

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const nameEn = p.name?.en?.toLowerCase() || "";
    const nameKm = p.name?.km || "";
    const matchesSearch = nameEn.includes(searchLower) || nameKm.includes(searchTerm);
    let matchesCategory = true;
    if (activeCategory === 'Food & Drink') matchesCategory = nameEn.match(/wine|matcha|tea|food/i);
    if (activeCategory === 'Apparel') matchesCategory = nameEn.match(/scarf|shirt|dress|clothing/i);
    if (activeCategory === 'Electronics') matchesCategory = nameEn.match(/tech|hub|watch|cam/i);
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- HELPER FUNCTION TO RESET CART WIZARD ---
  const closeCart = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setCheckoutStep('cart');
      setOrderId(null);
    }, 300); // Wait for animation before resetting
  };

  return (
    <div className="min-h-screen bg-gray-50 font-khmer">
      <Toaster position="bottom-center" />

      {/* --- SPLIT NAVIGATION WRAPPER --- */}
      <div className="sticky top-0 z-40 w-full shadow-sm">
        
        {/* 1. Top Utility Bar (Dark Mode) */}
        <div className="bg-gray-900 text-gray-300 text-xs py-2 px-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            {/* Subtle banner text */}
            <div className="hidden md:block tracking-widest font-medium text-gray-400">
              {i18n.language === 'en' ? '⚡ FAST DELIVERY IN PHNOM PENH' : '⚡ ដឹកជញ្ជូនរហ័សក្នុងរាជធានីភ្នំពេញ'}
            </div>
            
            {/* Utility Links */}
            <div className="flex items-center gap-4 ml-auto">
              <Link to="/admin" className="hover:text-white uppercase tracking-widest transition">Admin Access</Link>
              <div className="w-px h-3 bg-gray-600"></div> {/* Tiny vertical divider */}
              <button onClick={toggleLang} className="hover:text-white transition font-medium uppercase tracking-widest">
                {i18n.language === 'en' ? 'ភាសាខ្មែរ' : 'English'}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Navigation Bar */}
        <nav className="bg-white py-4 px-6">
          <div className="max-w-6xl mx-auto flex flex-wrap md:flex-nowrap justify-between items-center gap-4 md:gap-8">
            
            {/* Brand Logo */}
            <div className="shrink-0 flex items-center">
              <h1 className="text-2xl md:text-3xl font-black text-blue-600 tracking-tighter cursor-pointer">
                MY RETAIL STORE
              </h1>
            </div>

            {/* Future Category Links (Hidden on small phones to save space) */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-bold text-gray-700">
               <a href="#" className="hover:text-blue-600 transition">{i18n.language === 'en' ? 'New Arrivals' : 'ទំនិញថ្មីៗ'}</a>
               <a href="#" className="hover:text-blue-600 transition">{i18n.language === 'en' ? 'Categories' : 'ប្រភេទ'}</a>
               <a href="#" className="hover:text-blue-600 transition text-red-600">{i18n.language === 'en' ? 'Deals' : 'ប្រូម៉ូសិន'}</a>
            </div>

            {/* Search Bar (Expands to fill middle space, drops to bottom on mobile) */}
            <div className="flex-1 w-full order-3 md:order-none mt-2 md:mt-0">
              <input 
                type="text" 
                placeholder={i18n.language === 'en' ? "Search for anything..." : "ស្វែងរកផលិតផល..."}
                className="w-full p-3 px-6 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-gray-800 shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Cart Button */}
            <div className="flex items-center shrink-0 order-2 md:order-none">
              <div className="relative cursor-pointer hover:scale-105 transition-transform bg-gray-50 hover:bg-blue-50 p-3 rounded-full border border-gray-100" onClick={() => setIsCartOpen(true)}>
                <span className="text-xl">🛒</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-bounce">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </div>
            </div>

          </div>
        </nav>

        {/* 4. Mobile Search Bar (Shows only on small screens) */}
        <div className="md:hidden px-6 pb-4 bg-white border-b border-gray-100">
          <input 
            type="text" 
            placeholder={i18n.language === 'en' ? "Search products..." : "ស្វែងរកផលិតផល..."}
            className="w-full p-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div> {/* <-- This safely closes the sticky Split Navigation Wrapper */}

      {/* HEADER & FILTERS */}
      <header className="max-w-4xl mx-auto pt-12 pb-10 px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">{t('welcome')}</h2>
        
        {/* CATEGORY PILLS */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* PRODUCT GRID */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 group">
              <div className="overflow-hidden rounded-2xl mb-4 aspect-square bg-gray-50 relative">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544787210-282744e79c1b?q=80&w=400"; }} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">{product.name?.[i18n.language] || product.name?.en}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed">{product.description?.[i18n.language] || product.description?.en}</p>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-2xl font-bold text-blue-600 block">${product.price}</span>
                  <span className="text-xs text-gray-400 font-medium">{(product.price * 4100).toLocaleString()} ៛</span>
                </div>
                <button onClick={() => addToCart(product)} className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-md active:scale-95">
                  + {i18n.language === 'en' ? 'Add' : 'បន្ថែម'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKOUT WIZARD SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-8 flex flex-col animate-slide-in">
            
            {/* Sidebar Header */}
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <div className="flex items-center gap-3">
                {checkoutStep !== 'cart' && checkoutStep !== 'success' && (
                  <button onClick={() => setCheckoutStep(checkoutStep === 'payment' ? 'delivery' : 'cart')} className="text-gray-400 hover:text-blue-600">← Back</button>
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  {checkoutStep === 'cart' && (i18n.language === 'en' ? 'Your Cart' : 'កន្ត្រករបស់អ្នក')}
                  {checkoutStep === 'delivery' && (i18n.language === 'en' ? 'Delivery Details' : 'ព័ត៌មានដឹកជញ្ជូន')}
                  {checkoutStep === 'payment' && (i18n.language === 'en' ? 'Scan to Pay' : 'ស្កេនដើម្បីបង់ប្រាក់')}
                  {checkoutStep === 'success' && (i18n.language === 'en' ? 'Success!' : 'ជោគជ័យ!')}
                </h2>
              </div>
              <button onClick={closeCart} className="text-gray-400 hover:text-red-500 bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
            </div>

            {/* MAIN CONTENT AREA (Animates between steps) */}
            <div ref={cartRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
              
              {/* STEP 1: CART LIST */}
              {checkoutStep === 'cart' && (
                cart.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-4"><span className="text-6xl">🛍️</span><p>Your cart is empty.</p></div>
                ) : (
                  cart.map((item) => (
                    <div key={item._id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <img src={item.image} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800">{item.name?.[i18n.language] || item.name?.en}</h4>
                        <p className="text-xs text-gray-500 mt-1">${item.price} × {item.quantity}</p>
                      </div>
                      <div className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">${item.price * item.quantity}</div>
                    </div>
                  ))
                )
              )}

              {/* STEP 2: DELIVERY FORM */}
              {checkoutStep === 'delivery' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">{i18n.language === 'en' ? 'Full Name' : 'ឈ្មោះ​ពេញ'}</label>
                    <input type="text" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Chan Vibol" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">{i18n.language === 'en' ? 'Phone Number' : 'លេខទូរស័ព្ទ'}</label>
                    <input type="tel" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="012 345 678" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">{i18n.language === 'en' ? 'Delivery Address' : 'អាសយដ្ឋានដឹកជញ្ជូន'}</label>
                    <textarea className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" rows="3" placeholder="Phnom Penh, Cambodia..." value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}></textarea>
                  </div>
                </div>
              )}

              {/* STEP 3: KHQR PAYMENT SCREEN */}
				{checkoutStep === 'payment' && (
				<div className="text-center flex flex-col items-center justify-center h-full pb-10">
				<p className="text-gray-500 mb-6">
				  {i18n.language === 'en' 
					? 'Please scan the KHQR code below using your ABA or local banking app.' 
					: 'សូមស្កេនកូដ KHQR ខាងក្រោមដោយប្រើកម្មវិធីធនាគាររបស់អ្នក។'}
				</p>
				
				{/* --- YOUR REAL KHQR IMAGE GOES HERE --- */}
				<div className="bg-white p-3 rounded-3xl shadow-xl w-64 mb-6 border border-gray-100">
				  <img 
					src="/khqr.jpg" 
					alt="Pay with KHQR" 
					className="w-full h-auto rounded-xl"
					// If the image name is .png, change the src above to "/khqr.png"
				  />
				</div>
				
				<div className="text-3xl font-bold text-gray-800 mb-2">
				  Total: <span className="text-blue-600">${cartTotal}</span>
				</div>
				<p className="text-sm text-gray-400 mb-8">
				  ({(cartTotal * 4100).toLocaleString()} ៛)
				</p>
			  </div>
			)}

              {/* STEP 4: SUCCESS SCREEN */}
              {checkoutStep === 'success' && (
                <div className="text-center flex flex-col items-center justify-center h-full pb-10">
                  <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-sm">✓</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{i18n.language === 'en' ? 'Thank you!' : 'សូមអរគុណ!'}</h3>
                  <p className="text-gray-500 mb-8">{i18n.language === 'en' ? 'Your order is being prepared for delivery.' : 'ការបញ្ជាទិញរបស់អ្នកកំពុងរៀបចំសម្រាប់ការដឹកជញ្ជូន។'}</p>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 w-full mb-8">
                    <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider">{i18n.language === 'en' ? 'Order Number' : 'លេខ​បញ្ជា​ទិញ'}</p>
                    <p className="font-mono text-gray-800 font-bold break-all">{orderId}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* BOTTOM ACTION BUTTONS */}
            <div className="border-t pt-6 mt-4 bg-white">
              {checkoutStep === 'cart' && (
                <>
                  <div className="flex justify-between text-xl font-bold mb-6 text-gray-800">
                    <span>{i18n.language === 'en' ? 'Total' : 'សរុប'}</span><span className="text-blue-600">${cartTotal}</span>
                  </div>
                  <button onClick={() => setCheckoutStep('delivery')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:bg-gray-200" disabled={cart.length === 0}>
                    {i18n.language === 'en' ? 'Proceed to Checkout' : 'បន្តទៅការទូទាត់ប្រាក់'}
                  </button>
                </>
              )}

              {checkoutStep === 'delivery' && (
                <button 
                  onClick={() => setCheckoutStep('payment')} 
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition shadow-lg disabled:bg-gray-300"
                  disabled={!customerInfo.name || !customerInfo.phone} // Require Name & Phone
                >
                  {i18n.language === 'en' ? 'Continue to Payment' : 'បន្តទៅការបង់ប្រាក់'}
                </button>
              )}

              {checkoutStep === 'payment' && (
				  <button 
					onClick={handleCheckout} 
					className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition shadow-[0_8px_30px_rgb(22,163,74,0.3)] animate-pulse"
				  >
					{i18n.language === 'en' ? 'Paid' : 'បានបង់ប្រាក់រួចរាល់'}
				  </button>
				)}

              {checkoutStep === 'success' && (
                <button onClick={closeCart} className="w-full bg-gray-200 text-gray-800 py-4 rounded-2xl font-bold text-lg hover:bg-gray-300 transition">
                  {i18n.language === 'en' ? 'Continue Shopping' : 'បន្តការទិញទំនិញ'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    <footer className="bg-gray-900 text-gray-300 py-12 mt-20 border-t border-gray-800">
  <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
    
    {/* Brand Section */}
    <div>
      <h3 className="text-xl font-bold text-white mb-4 tracking-tight">MY RETAIL STORE</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-4">
        {i18n.language === 'en' ? 'Your premium destination for quality goods in Cambodia.' : 'ទិសដៅឈានមុខគេសម្រាប់ទំនិញមានគុណភាពនៅកម្ពុជា។'}
      </p>
    </div>

    {/* Quick Links */}
    <div>
      <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Shop</h4>
      <ul className="space-y-2 text-sm">
        <li><a href="#" className="hover:text-blue-400 transition">New Arrivals</a></li>
        <li><a href="#" className="hover:text-blue-400 transition">Best Sellers</a></li>
        <li><a href="#" className="hover:text-blue-400 transition">Discounts</a></li>
      </ul>
    </div>

    {/* Customer Support */}
    <div>
      <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Support</h4>
      <ul className="space-y-2 text-sm">
        <li><a href="#" className="hover:text-blue-400 transition">Contact Us</a></li>
        <li><a href="#" className="hover:text-blue-400 transition">Shipping & Returns</a></li>
        <li><a href="#" className="hover:text-blue-400 transition">FAQ</a></li>
      </ul>
    </div>

    {/* Payments & Contact */}
    <div>
      <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Accepted Payments</h4>
      <div className="flex gap-3 mb-6">
         {/* Placeholder for Payment Icons */}
         <div className="bg-white text-blue-800 text-xs font-bold px-2 py-1 rounded">ABA</div>
         <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">KHQR</div>
      </div>
      <p className="text-sm">📍 Phnom Penh, Cambodia</p>
    </div>
    
  </div>
  <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-sm text-center text-gray-500">
    © {new Date().getFullYear()} My Retail Store. All rights reserved.
  </div>
</footer>
	</div>
  )
}

export default App