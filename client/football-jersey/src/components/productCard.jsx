import React, { useState } from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/contextHook';
import { getProductSlug } from '../utils/slugify';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const productSlug = getProductSlug(product);

  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    addToast('Choose a size to add this gear.', 'success');
    navigate(`/product/${productSlug}`);
  };

  const isOnSale = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  
  // Logic for Hover Image Swap
  const primaryImage = product.productImageUrl || 'https://via.placeholder.com/600x800?text=Jersey+Image';
  const hoverImage = (product.gallery && product.gallery.length > 0) ? product.gallery[0] : primaryImage;

  return (
    <Link 
      to={`/product/${productSlug}`}
      className="group flex flex-col gap-3 md:gap-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary w-full"
      tabIndex="0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      onTouchCancel={() => setIsHovered(false)}
    >
      {/* --- IMAGE CONTAINER --- */}
      <div className="relative w-full aspect-[4/5] bg-surface-high/10 rounded-none md:rounded-2xl overflow-hidden transition-transform duration-500 md:group-hover:-translate-y-2 md:group-active:-translate-y-2 border-none md:border md:border-white/5 md:group-hover:border-white/10 md:group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Primary Image */}
        <img 
          src={primaryImage} 
          alt={product.productName}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${isHovered ? 'opacity-0 md:scale-105' : 'opacity-100 scale-100'}`}
        />
        {/* Hover/Secondary Image */}
        <img 
          src={hoverImage} 
          alt={`${product.productName} alternate view`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 md:scale-95'}`}
        />

        {/* Subtle Gradient for Button/Badge Contrast (Desktop Only) */}
        <div className="hidden md:block absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        {/* --- FLOATING BADGES (TOP LEFT) --- */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1.5 items-start z-20">
          {isOnSale && (
            <div className="bg-red-500 text-white text-[9px] md:text-[10px] font-bold font-inter px-2 py-1 rounded-sm md:rounded-md uppercase tracking-[0.1em] shadow-lg animate-pulse">
              Sale
            </div>
          )}
          {product.stock < 10 && product.stock > 0 && !isOnSale && (
            <div className="bg-surface-base/80 backdrop-blur-md border border-red-500/30 text-red-400 text-[9px] md:text-[10px] font-bold font-inter px-2 py-1 rounded-sm md:rounded-md uppercase tracking-[0.1em] shadow-lg">
              Low Stock
            </div>
          )}
          {product.stock === 0 && (
            <div className="bg-black/80 backdrop-blur-md border border-white/20 text-text-secondary text-[9px] md:text-[10px] font-bold font-inter px-2 py-1 rounded-sm md:rounded-md uppercase tracking-[0.1em] shadow-lg">
              Sold Out
            </div>
          )}
        </div>

        {/* --- FLOATING ACTION BUTTON (BOTTOM RIGHT - DESKTOP ONLY) --- */}
        <button 
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="hidden md:flex absolute bottom-3 right-3 items-center justify-center h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-brand-primary hover:border-brand-primary hover:text-black hover:scale-110 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white/10 disabled:hover:text-white disabled:hover:border-white/20 shadow-xl z-30 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-active:translate-y-0 group-active:opacity-100"
          aria-label="Select size"
        >
          <ShoppingCart size={18} strokeWidth={2.5} className="group-hover:translate-x-[1px] group-hover:-translate-y-[1px] transition-transform" />
        </button>
      </div>

      {/* --- CONTENT LAYER (BELOW IMAGE) --- */}
      <div className="flex flex-col px-0.5 md:px-1">
        
        {/* Title with Expanding Underline */}
        <div className="inline-block relative w-fit mb-0.5 max-w-full">
          <h3 className="kinetic-heading text-sm md:text-lg lg:text-xl leading-snug text-white line-clamp-2 transition-colors duration-300 relative z-10">
            {product.productName}
          </h3>
          <span className="absolute left-0 bottom-0 h-[1.5px] md:h-[2px] w-0 bg-brand-primary transition-all duration-500 ease-out group-hover:w-full group-active:w-full shadow-[0_0_10px_rgba(194,243,91,0.4)]"></span>
        </div>
        
        {/* Price Block */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-inter font-black text-sm md:text-lg text-brand-primary tracking-tight">
            ₹{parseFloat(product.price).toFixed(2)}
          </span>
          {isOnSale && (
            <span className="font-inter font-bold text-[10px] md:text-xs text-text-secondary line-through">
              ₹{parseFloat(product.originalPrice).toFixed(2)}
            </span>
          )}
        </div>

      </div>
    </Link>
  );
};

export default ProductCard;