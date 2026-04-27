import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Zap, ArrowLeft, Ruler, ChevronDown, Share2, Check, Truck, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { addItemToLocalCart, toggleCart } from '../features/cartSlice';
import { useToast } from '../context/contextHook';
import { getProductSlug } from '../utils/slugify';
import ProductCard from '../components/productCard';

const ProductDetailsPage = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // --- IMAGE GALLERY STATE ---
  const [allImages, setAllImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0); // Track which image is main
  
  // --- MOBILE SLIDER STATE ---
  const mobileGalleryScrollRef = useRef(null);
  const [activeMobileGalleryDot, setActiveMobileGalleryDot] = useState(0);

  // --- RELATED PRODUCTS STATE ---
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // State for accordions and share button
  const [openSection, setOpenSection] = useState('description'); 
  const [copied, setCopied] = useState(false);

  // --- RELATED SLIDER LOGIC ---
  const relatedScrollRef = useRef(null);
  const [activeRelatedDotIndex, setActiveRelatedDotIndex] = useState(0);
  const relatedDotCount = relatedProducts.length;

  const handleRelatedScroll = () => {
    if (!relatedScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = relatedScrollRef.current;
    if (scrollWidth <= clientWidth) {
      setActiveRelatedDotIndex(0);
      return;
    }
    const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
    const newIndex = Math.round(scrollPercentage * (relatedDotCount - 1));
    setActiveRelatedDotIndex(newIndex);
  };

  const scrollRelatedLeft = () => {
    if (relatedScrollRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 300 : 400;
      relatedScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRelatedRight = () => {
    if (relatedScrollRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 300 : 400;
      relatedScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // --- MOBILE GALLERY SLIDER LOGIC ---
  const handleMobileGalleryScroll = () => {
    if (!mobileGalleryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = mobileGalleryScrollRef.current;
    if (scrollWidth <= clientWidth) {
      setActiveMobileGalleryDot(0);
      return;
    }
    const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
    const newIndex = Math.round(scrollPercentage * (allImages.length - 1));
    setActiveMobileGalleryDot(newIndex);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchProductAndRelated = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/store/${productSlug}`);
        const productData = response.data;
        setProduct(productData);

        const canonicalSlug = getProductSlug(productData);
        if (canonicalSlug && canonicalSlug !== productSlug) {
          navigate(`/product/${canonicalSlug}`, { replace: true });
        }

        const images = [];
        if (productData.productImageUrl) images.push(productData.productImageUrl);
        if (productData.gallery && Array.isArray(productData.gallery)) {
          images.push(...productData.gallery);
        }
        
        const cleanImages = images.filter(Boolean);
        setAllImages(cleanImages);
        setActiveImageIndex(0); // Reset to first image

        // Reset selections
        setSelectedSize(null);

        // Fetch Related Products
        setLoadingRelated(true);
        const relatedRes = await api.get('/store/jerseys?limit=10'); 
        const allJerseys = relatedRes.data.data || relatedRes.data || [];
        
        const filtered = allJerseys.filter(p => p.id !== productData.id).slice(0, 5);
        setRelatedProducts(filtered);

      } catch (error) {
        console.error("Failed to load product details:", error);
      } finally {
        setLoading(false);
        setLoadingRelated(false);
      }
    };
    
    fetchProductAndRelated();
  }, [productSlug, navigate]);

  const handleAddToCart = async (isBuyNow) => {
    setIsAdding(true);
    try {
      const sizeLabel = selectedSize?.size ? String(selectedSize.size).trim().toUpperCase() : null;

      if (!sizeLabel) {
        addToast("Please select a size first", "error");
        return;
      }

      if (isAuthenticated) {
        await api.post('/cart/add', { productId: product.id, quantity: 1, size: sizeLabel });
      }
  
      dispatch(addItemToLocalCart({
        cartItemId: `${isAuthenticated ? 'temp' : 'guest'}-${product.id}-${sizeLabel}`,
        product: {
          id: product.id,
          name: product.productName,
          imageUrl: product.productImageUrl
        }, 
        quantity: 1,
        size: sizeLabel,
        priceAtTime: product.price
      }));
      
      addToast("Gear Added to Cart!", "success");
  
      if (isBuyNow) {
        navigate('/checkout');
      } else {
        dispatch(toggleCart());
      }
    } catch (error) {
      console.error("Failed to add to cart", error);
      addToast(error.response?.data?.error || "Failed to add to cart", "error");
    } finally {
      setIsAdding(false);
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
      <div className="flex items-center justify-center min-h-[80vh] bg-surface-base">
        <div className="w-12 h-12 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col text-center justify-center items-center font-inter text-white min-h-[80vh] bg-surface-base">
        <h1 className="text-3xl mb-4 kinetic-heading uppercase tracking-widest">Gear Not Found</h1>
        <button onClick={() => navigate(-1)} className="text-brand-primary hover:underline">Return to Arena</button>
      </div>
    );
  }

  const displayStock = selectedSize ? selectedSize.stock : product.stock;
  const isOutOfStock = selectedSize ? selectedSize.stock === 0 : false;
  const isOnSale = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);

  return (
    <div className="relative w-full min-h-screen bg-surface-base overflow-hidden">
      
      <Helmet>
        <title>{product.productName} | Kinetic Store</title>
        <meta name="description" content={product.description || "Premium football gear available now at Kinetic Store."} />
        <meta property="og:title" content={`${product.productName} | Kinetic Store`} />
        <meta property="og:description" content={product.description || "Premium football gear available now at Kinetic Store."} />
        <meta property="og:image" content={allImages[0] || 'https://via.placeholder.com/600x800?text=Jersey+Image'} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* --- CINEMATIC BACKGROUND --- */}
      <div className="absolute top-0 left-0 w-full h-[80vh] z-0 pointer-events-none">
        <div className="fixed inset-0 w-full h-[100vh] parallax-bg" style={{ backgroundImage: `url('https://fulltimestore.in/cdn/shop/files/spenia_home_2.png?v=1777196748&width=1200')` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-[#050505]/95 to-[#131313]"></div>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
        </div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 md:pt-32 pb-20 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6 font-inter text-xs uppercase tracking-widest w-max bg-black/40 backdrop-blur-md py-2 px-4 rounded-full border border-white/5">
          <ArrowLeft size={16} /> Back to Arena
        </button>

        {/* --- MAIN PRODUCT SPLIT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start relative">
          
          {/* ========================================================= */}
          {/* LEFT: IMAGE GALLERY (Desktop Split vs. Mobile Slider)     */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 w-full">
            
            {/* --- DESKTOP VIEW: Main Image + Vertical Thumbnail Column --- */}
            <div className="hidden lg:grid grid-cols-7 gap-4 h-[600px] xl:h-[650px]">
              
              {/* Big Main Image (Takes 5 columns) */}
              <div className="col-span-5 relative rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border border-white/5 bg-transparent animate-in fade-in zoom-in-95 duration-500">
                {isOnSale && (
                  <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-[10px] font-bold font-inter px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg animate-pulse">
                    Sale
                  </div>
                )}
                <img 
                  src={allImages[activeImageIndex]} 
                  alt={product.productName}
                  className="w-full h-full object-contain relative z-10 p-0 transition-opacity duration-300"
                  key={activeImageIndex} 
                  loading="eager"
                />
              </div>

              {/* Scrollable Vertical Thumbnail Column (Takes 2 columns) */}
              {allImages.length > 1 && (
                <div 
                  className="col-span-2 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide h-full" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-full aspect-[4/5] shrink-0 rounded-2xl overflow-hidden transition-all bg-transparent flex items-center justify-center border-2 ${
                        activeImageIndex === idx 
                          ? 'border-brand-primary opacity-100 scale-100 shadow-[0_0_15px_rgba(194,243,91,0.3)]' 
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/20 scale-[0.98] hover:scale-100'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`View ${idx + 1}`} 
                        className="w-full h-full object-contain relative z-10 p-1"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* --- MOBILE/TABLET VIEW: Native Swipe Slider with Dots --- */}
            <div className="lg:hidden w-full relative">
              {isOnSale && (
                <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-[10px] font-bold font-inter px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg animate-pulse">
                  Sale
                </div>
              )}

              {/* Scrollable Track */}
              <div 
                ref={mobileGalleryScrollRef}
                onScroll={handleMobileGalleryScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide rounded-2xl bg-transparent"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {allImages.map((img, idx) => (
                  <div 
                    key={`mobile-img-${idx}`} 
                    className="flex-none w-full aspect-[4/5] sm:aspect-[4/5] md:aspect-square snap-center flex items-center justify-center relative p-0"
                  >
                    <img 
                      src={img} 
                      alt={`${product.productName} view ${idx + 1}`}
                      className="w-full h-full object-contain relative z-10"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>

              {/* Mobile Image Pagination Dots */}
              {allImages.length > 1 && (
                <div className="flex justify-center gap-2 mt-4 relative z-30">
                  {[...Array(allImages.length)].map((_, index) => (
                    <div 
                      key={`mobile-dot-${index}`} 
                      className={`transition-all duration-500 ease-out rounded-full h-1.5 ${
                        index === activeMobileGalleryDot 
                          ? 'w-8 bg-brand-primary shadow-[0_0_10px_rgba(194,243,91,0.5)]' 
                          : 'w-2 bg-white/20'
                      }`} 
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT: PRODUCT DETAILS (Sticky on Desktop)                  */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 relative z-20">
            {/* Reduced width and padding slightly to balance the new image layout */}
            <div className="lg:sticky lg:top-28 flex flex-col justify-center bg-surface-base/40 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-6 md:p-0 rounded-3xl border border-white/5 md:border-none lg:max-w-md ml-auto">
              
              <div className="mb-6 border-b border-white/10 pb-6">
                <h1 className="kinetic-heading text-3xl md:text-4xl lg:text-[2.5rem] leading-[1.1] mb-4 uppercase text-white drop-shadow-md">
                  {product.productName}
                </h1>
                
                <div className="flex items-end gap-3">
                  <p className="font-inter text-2xl md:text-3xl text-brand-primary font-bold">
                    ₹{parseFloat(product.price).toFixed(2)}
                  </p>
                  {isOnSale && (
                    <p className="font-inter text-lg text-text-secondary font-bold line-through mb-1">
                      ₹{parseFloat(product.originalPrice).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* SIZE SELECTOR */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="kinetic-heading text-sm text-white uppercase tracking-widest">Select Size</h3>
                  <button className="flex items-center gap-1 text-[10px] sm:text-xs text-text-secondary hover:text-brand-primary font-inter uppercase tracking-widest transition-colors">
                    <Ruler size={14} /> Size Guide
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:gap-3">
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
                          relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 font-inter text-xs sm:text-sm font-bold uppercase transition-all flex items-center justify-center
                          ${!isAvailable 
                            ? 'border-white/5 bg-black/40 text-white/20 cursor-not-allowed backdrop-blur-md' 
                            : isSelected 
                              ? 'border-brand-primary bg-brand-primary text-black scale-105 z-30 shadow-[0_0_15px_rgba(194,243,91,0.4)]' 
                              : 'border-white/10 bg-black/40 backdrop-blur-md text-white hover:border-brand-primary/50 hover:bg-white/5 cursor-pointer z-30'
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
                  <p className={`mt-3 font-inter text-xs font-bold uppercase tracking-widest ${displayStock < 5 ? 'text-orange-500' : 'text-text-secondary'}`}>
                    {isOutOfStock ? "Sold Out" : `${displayStock} units available`}
                  </p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button 
                  onClick={() => handleAddToCart(false)}
                  disabled={isAdding || !selectedSize || isOutOfStock}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-black/40 backdrop-blur-md border-white/20 hover:border-brand-primary/50"
                >
                  <ShoppingCart size={18} />
                  {!selectedSize ? 'Select Size' : isAdding ? 'Processing...' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                </button>
                
                <button 
                  onClick={() => handleAddToCart(true)} 
                  disabled={isAdding || !selectedSize || isOutOfStock}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(194,243,91,0.2)]"
                >
                  <Zap size={18} />
                  Buy It Now
                </button>
              </div>

              {/* --- ACCORDIONS / DROPDOWNS --- */}
              <div className="border-t border-white/10">
                
                {/* Description */}
                <div className="border-b border-white/10">
                  <button 
                    onClick={() => toggleSection('description')}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <span className="kinetic-heading text-sm sm:text-base text-white uppercase tracking-widest group-hover:text-brand-primary transition-colors">Engineering Specs</span>
                    <ChevronDown size={18} className={`text-text-secondary transition-transform duration-300 ${openSection === 'description' ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'description' ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="kinetic-body text-text-secondary text-sm leading-relaxed font-inter">
                      {product.description || "Official high-performance athletic wear engineered for the modern fan. Features moisture-wicking technology, breathable mesh panels, and premium embroidered crests."}
                    </p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="border-b border-white/10">
                  <button 
                    onClick={() => toggleSection('shipping')}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Truck size={18} className="text-text-secondary group-hover:text-brand-primary transition-colors" />
                      <span className="kinetic-heading text-sm sm:text-base text-white uppercase tracking-widest group-hover:text-brand-primary transition-colors">Shipping Info</span>
                    </div>
                    <ChevronDown size={18} className={`text-text-secondary transition-transform duration-300 ${openSection === 'shipping' ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'shipping' ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ul className="kinetic-body text-text-secondary text-sm leading-relaxed font-inter space-y-1">
                      <li>• <strong className="text-white">Standard Delivery:</strong> 3-5 business days (Free over ₹100)</li>
                      <li>• <strong className="text-white">Express Delivery:</strong> 1-2 business days (₹99)</li>
                      <li>• Orders are processed and dispatched within 24 hours.</li>
                    </ul>
                  </div>
                </div>

                {/* Returns */}
                <div className="border-b border-white/10">
                  <button 
                    onClick={() => toggleSection('returns')}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowLeftRight size={18} className="text-text-secondary group-hover:text-brand-primary transition-colors" />
                      <span className="kinetic-heading text-sm sm:text-base text-white uppercase tracking-widest group-hover:text-brand-primary transition-colors">Free Returns</span>
                    </div>
                    <ChevronDown size={18} className={`text-text-secondary transition-transform duration-300 ${openSection === 'returns' ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'returns' ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="kinetic-body text-text-secondary text-sm leading-relaxed font-inter">
                      Not the perfect fit? We offer a hassle-free <strong>30-day return policy</strong>. Items must be unworn with original tags attached.
                    </p>
                  </div>
                </div>

                {/* Share */}
                <div className="py-4">
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group w-max"
                  >
                    {copied ? <Check size={16} className="text-brand-primary" /> : <Share2 size={16} className="group-hover:text-brand-primary transition-colors" />}
                    <span className={`kinetic-heading text-sm uppercase tracking-widest ${copied ? 'text-brand-primary' : ''}`}>
                      {copied ? 'Link Copied!' : 'Share This Gear'}
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RELATED PRODUCTS SECTION (Slider)                           */}
        {/* ========================================================= */}
        <div className="mt-32 border-t border-white/5 pt-20">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="kinetic-heading text-3xl md:text-4xl text-white uppercase tracking-wider drop-shadow-md mb-2">
              You May Also Like
            </h2>
            <div className="w-16 h-1 bg-brand-primary mb-4 shadow-[0_0_15px_rgba(194,243,91,0.5)]"></div>
          </div>
          
          <div className="relative group mt-4">
            
            {/* Left Arrow */}
            <button 
              onClick={scrollRelatedLeft} 
              disabled={loadingRelated || relatedProducts.length < 2}
              className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Edge Masking Wrapper */}
            <div 
              className="w-full relative"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
                maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)'
              }}
            >
              {/* Scrollable Track */}
              <div 
                ref={relatedScrollRef}
                onScroll={handleRelatedScroll}
                className="flex overflow-x-auto gap-6 md:gap-8 pb-10 pt-4 snap-x snap-mandatory scroll-smooth relative z-20 scrollbar-hide" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {loadingRelated ? (
                  <div className="w-full flex justify-center py-10">
                    <div className="w-8 h-8 border-2 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
                  </div>
                ) : relatedProducts.length > 0 ? (
                  relatedProducts.map(relProduct => (
                    <div key={`rel-${relProduct.id}`} className="flex-none w-[75vw] sm:w-[280px] md:w-[320px] snap-center hover:-translate-y-2 transition-transform duration-500">
                      <ProductCard product={relProduct} />
                    </div>
                  ))
                ) : (
                  <div className="w-full text-center text-text-secondary font-inter">
                    No related gear found.
                  </div>
                )}
              </div>
            </div>

            {/* Right Arrow */}
            <button 
              onClick={scrollRelatedRight} 
              disabled={loadingRelated || relatedProducts.length < 2}
              className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronRight size={24} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

          </div>

          {/* Dynamic Pagination Dots */}
          {!loadingRelated && relatedProducts.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 relative z-30">
              {[...Array(relatedDotCount)].map((_, index) => (
                <div 
                  key={`rel-dot-${index}`} 
                  className={`transition-all duration-500 ease-out rounded-full h-1.5 ${
                    index === activeRelatedDotIndex 
                      ? 'w-10 bg-brand-primary shadow-[0_0_12px_rgba(194,243,91,0.6)]' 
                      : 'w-2 bg-white/20 hover:bg-white/40 cursor-pointer'
                  }`} 
                  onClick={() => {
                    if (relatedScrollRef.current) {
                      const cardWidth = window.innerWidth < 768 ? window.innerWidth * 0.75 : 320;
                      relatedScrollRef.current.scrollTo({ left: index * (cardWidth + 24), behavior: 'smooth' });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductDetailsPage;