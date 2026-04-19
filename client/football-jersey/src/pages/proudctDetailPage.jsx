import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Zap, ArrowLeft, Ruler, ChevronDown, Share2, Check, Truck, ArrowLeftRight } from 'lucide-react';
import api from '../services/api';
import { addItemToLocalCart, toggleCart } from '../features/cartSlice';
import { useToast } from '../context/contextHook';
const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const {addToast} =useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // State for accordions and share button
  const [openSection, setOpenSection] = useState('description'); // Defaults to description open
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/store/${id}`); 
        setProduct(response.data);
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      // 1. Send it to the database
      await api.post('/cart/add', { productId: product.id, quantity: 1, size: selectedSize });
  
      // 2. Instantly push it to Redux so the UI updates without a refresh!
      dispatch(addItemToLocalCart({
        product: product, // Pass the whole product object
        quantity: 1,
        size: selectedSize,
        priceAtTime: product.price
      }));
      addToast("Item Added to Cart Success")
      
  
      // 3. Pop the drawer open
      dispatch(toggleCart());
    } catch (error) {
      console.error("Failed to add to cart", error);
    }
  };
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col text-center justify-center items-center font-inter text-white min-h-[60vh]">
        <h1 className="text-3xl mb-4">Gear Not Found</h1>
        <button onClick={() => navigate(-1)} className="text-brand-primary hover:underline">Go Back</button>
      </div>
    );
  }

  const displayStock = selectedSize ? selectedSize.stock : product.stock;
  const isOutOfStock = selectedSize ? selectedSize.stock === 0 : false;

  return (
    <div className="px-6 pt-8 pb-20 w-full">
      <div className="max-w-6xl mx-auto">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-8 font-inter text-sm uppercase tracking-wider">
          <ArrowLeft size={16} /> Back to Arena
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Column: Image */}
          <div className="relative aspect-[4/5] bg-surface-low rounded-2xl flex items-center justify-center p-10 overflow-hidden ambient-shadow z-10 top-24 h-max">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-brand-primary/10 opacity-50"></div>
            <img 
              src={product.productImageUrl || 'https://via.placeholder.com/600x800?text=Jersey+Image'} 
              alt={product.productName}
              className="w-full h-full object-contain relative z-10 animate-fade-in"
            />
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col justify-center relative z-20">
            <div className="mb-8 border-b border-white/10 pb-8 mt-20">
              <h1 className="kinetic-heading text-4xl md:text-5xl lg:text-6xl leading-tight mb-4 uppercase text-white">
                {product.productName}
              </h1>
              <p className="font-inter text-3xl text-brand-primary font-bold">
              ₹{parseFloat(product.price).toFixed(2)}
              </p>
            </div>

            {/* SIZE SELECTOR */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="kinetic-heading text-lg text-white uppercase tracking-widest">Select Size</h3>
                <button className="flex items-center gap-1 text-xs text-text-secondary hover:text-brand-primary font-inter uppercase tracking-widest transition-colors">
                  <Ruler size={14} /> Size Guide
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {product.sizes?.map((sizeObj) => {
                  const isSelected = selectedSize?.id === sizeObj.id;
                  const isAvailable = sizeObj.stock > 0;

                  return (
                    <button
                      key={sizeObj.id}
                      type="button"
                      onClick={() => isAvailable && setSelectedSize(sizeObj)}
                      disabled={!isAvailable}
                      className={`
                        relative w-14 h-14 rounded-lg border-2 font-inter text-sm font-bold uppercase transition-all flex items-center justify-center
                        ${!isAvailable 
                          ? 'border-white/5 bg-surface-deep text-white/20 cursor-not-allowed' 
                          : isSelected 
                            ? 'border-brand-primary bg-brand-primary text-black scale-105 z-30' 
                            : 'border-white/10 bg-surface-low text-white hover:border-brand-primary/50 hover:bg-surface-high cursor-pointer z-30'
                        }
                      `}
                    >
                      <span className="relative z-10">{sizeObj.size}</span>
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="w-[120%] h-[2px] bg-white/10 rotate-45"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {selectedSize && (
                <p className={`mt-4 font-inter text-sm font-bold uppercase tracking-widest ${displayStock < 5 ? 'text-orange-500' : 'text-text-secondary'}`}>
                  {isOutOfStock ? "Sold Out" : `${displayStock} units available`}
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={() => handleAddToCart(false)}
                disabled={isAdding || !selectedSize || isOutOfStock}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={20} />
                {!selectedSize ? 'Select Size' : isAdding ? 'Processing...' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </button>
              
              <button 
                onClick={() => handleAddToCart(true)} 
                disabled={isAdding || !selectedSize || isOutOfStock}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={20} />
                Buy It Now
              </button>
            </div>

            {/* --- ACCORDIONS / DROPDOWNS --- */}
            <div className="border-t border-white/10">
              
              {/* Description Dropdown */}
              <div className="border-b border-white/10">
                <button 
                  onClick={() => toggleSection('description')}
                  className="w-full flex items-center justify-between py-6 text-left group"
                >
                  <span className="kinetic-heading text-lg text-white uppercase tracking-widest group-hover:text-brand-primary transition-colors">Engineering Specs</span>
                  <ChevronDown size={20} className={`text-text-secondary transition-transform duration-300 ${openSection === 'description' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'description' ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="kinetic-body text-text-secondary text-base leading-relaxed font-inter">
                    {product.description || "Official high-performance athletic wear engineered for the modern fan. Features moisture-wicking technology, breathable mesh panels, and premium embroidered crests."}
                  </p>
                </div>
              </div>

              {/* Shipping Policy Dropdown */}
              <div className="border-b border-white/10">
                <button 
                  onClick={() => toggleSection('shipping')}
                  className="w-full flex items-center justify-between py-6 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-text-secondary group-hover:text-brand-primary transition-colors" />
                    <span className="kinetic-heading text-lg text-white uppercase tracking-widest group-hover:text-brand-primary transition-colors">Shipping Info</span>
                  </div>
                  <ChevronDown size={20} className={`text-text-secondary transition-transform duration-300 ${openSection === 'shipping' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'shipping' ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul className="kinetic-body text-text-secondary text-base leading-relaxed font-inter space-y-2">
                    <li>• <strong className="text-white">Standard Delivery:</strong> 3-5 business days (Free over ₹5,000)</li>
                    <li>• <strong className="text-white">Express Delivery:</strong> 1-2 business days (₹499)</li>
                    <li>• Orders are processed and dispatched within 24 hours.</li>
                    <li>• Full tracking provided via email and SMS.</li>
                  </ul>
                </div>
              </div>

              {/* Return Policy Dropdown */}
              <div className="border-b border-white/10">
                <button 
                  onClick={() => toggleSection('returns')}
                  className="w-full flex items-center justify-between py-6 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight size={20} className="text-text-secondary group-hover:text-brand-primary transition-colors" />
                    <span className="kinetic-heading text-lg text-white uppercase tracking-widest group-hover:text-brand-primary transition-colors">Free Returns</span>
                  </div>
                  <ChevronDown size={20} className={`text-text-secondary transition-transform duration-300 ${openSection === 'returns' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'returns' ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="kinetic-body text-text-secondary text-base leading-relaxed font-inter mb-2">
                    Not the perfect fit? We offer a hassle-free <strong>30-day return policy</strong>.
                  </p>
                  <p className="kinetic-body text-text-secondary text-base leading-relaxed font-inter">
                    Items must be unworn, unwashed, and have original tags attached. Customized jerseys are final sale and cannot be returned.
                  </p>
                </div>
              </div>

              {/* Share Product */}
              <div className="py-6">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-3 text-text-secondary hover:text-white transition-colors group w-max"
                >
                  {copied ? <Check size={20} className="text-brand-primary" /> : <Share2 size={20} className="group-hover:text-brand-primary transition-colors" />}
                  <span className={`kinetic-heading text-lg uppercase tracking-widest ${copied ? 'text-brand-primary' : ''}`}>
                    {copied ? 'Link Copied!' : 'Share This Gear'}
                  </span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;