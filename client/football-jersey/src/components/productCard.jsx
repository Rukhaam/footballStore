import React, { useState } from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { addItemToLocalCart } from '../features/cartSlice';
import { useToast } from '../context/contextHook';

const ProductCard = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleAddToCart = async (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setIsAdding(true);
    try {
      await api.post('/cart/add', {
        productId: product.id,
        quantity: 1,
      });
      
      dispatch(addItemToLocalCart({
        cartItemId: `temp-${Date.now()}`, 
        quantity: 1,
        priceAtTime: product.price,
        product: {
          id: product.id,
          name: product.productName,
          imageUrl: product.productImageUrl
        }
      }));
      addToast('Gear added to your cart!', 'success');

    } catch (error) {
      console.error('Failed to add to cart:', error);
      addToast('Could not add item to cart.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const isOnSale = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  
  // Logic for Hover Image Swap
  const primaryImage = product.productImageUrl || 'https://via.placeholder.com/600x800?text=Jersey+Image';
  // Use the first image in the gallery array if available, otherwise stick to primary
  const hoverImage = (product.gallery && product.gallery.length > 0) ? product.gallery[0] : primaryImage;

  return (
    <Link 
      to={`/product/${product.id}`}
      className="group relative flex flex-col aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      tabIndex="0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      onTouchCancel={() => setIsHovered(false)}
    >
      {/* --- IMAGE LAYER --- */}
      {/* Primary Image */}
      <img 
        src={primaryImage} 
        alt={product.productName}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      />
      {/* Hover/Secondary Image */}
      <img 
        src={hoverImage} 
        alt={`${product.productName} alternate view`}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      />

      {/* --- GRADIENT OVERLAYS --- */}
      {/* Top Gradient for Badges */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
      
      {/* Bottom Deep Gradient for Text Legibility */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none transition-opacity duration-500 group-hover:from-[#0a0a0a]/95"></div>

      {/* --- FLOATING BADGES (TOP RIGHT) --- */}
      <div className="absolute top-5 right-5 flex flex-col gap-2 items-end z-20">
        {isOnSale && (
          <div className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold font-inter px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg animate-pulse">
            Sale
          </div>
        )}
        {product.stock < 10 && product.stock > 0 && !isOnSale && (
          <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 text-red-400 text-[10px] font-bold font-inter px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
            Low Stock
          </div>
        )}
        {product.stock === 0 && (
          <div className="bg-black/60 backdrop-blur-md border border-white/20 text-text-secondary text-[10px] font-bold font-inter px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
            Sold Out
          </div>
        )}
      </div>

      {/* --- CONTENT LAYER (BOTTOM) --- */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between z-20">
        
        {/* Text Information */}
        <div className="flex flex-col max-w-[70%]">
          <h3 className="kinetic-heading text-2xl md:text-3xl leading-none text-white drop-shadow-md group-hover:-translate-y-1 transition-transform duration-500 line-clamp-2 mb-2">
            {product.productName}
          </h3>
          
          {/* Price Block */}
          <div className="flex items-center gap-2 group-hover:-translate-y-1 transition-transform duration-500 delay-75">
            <span className="font-inter font-black text-xl text-brand-primary tracking-tight drop-shadow-sm">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
            {isOnSale && (
              <span className="font-inter font-bold text-sm text-text-secondary line-through">
                ₹{parseFloat(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Slide-in Action Text (Hover Only) */}
          <div className="overflow-hidden mt-1">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 -translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              View Details <ArrowRight size={14} />
            </p>
          </div>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={handleAddToCart}
          disabled={isAdding || product.stock === 0}
          className="relative flex items-center justify-center h-14 w-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-brand-primary hover:border-brand-primary hover:text-black hover:scale-110 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white/10 disabled:hover:text-white disabled:hover:border-white/20 shadow-2xl z-30 mb-2"
          aria-label="Add to cart"
        >
          {isAdding ? (
            <div className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
          ) : (
            <ShoppingCart size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          )}
        </button>

      </div>
    </Link>
  );
};

export default ProductCard;