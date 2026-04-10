import React, { useState } from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { addItemToLocalCart } from '../features/cartSlice';

const ProductCard = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevents the Link from firing if they click the cart button
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

    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Could not add item to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-surface-low/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:bg-surface-low hover:border-white/10 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
      
      {/* Dynamic Background Glow that follows the hover state */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/0 via-brand-primary/0 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      {/* IMAGE CONTAINER */}
      <Link 
        to={`/product/${product.id}`} 
        className="relative aspect-[4/5] bg-surface-deep/50 flex items-center justify-center p-8 overflow-hidden block cursor-pointer"
      >
        {/* Subtle radial glow behind the jersey */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
        
        {/* The Product Image with dynamic floating & rotating animation */}
        <img 
          src={product.productImageUrl || 'https://via.placeholder.com/400x500?text=Jersey+Image'} 
          alt={product.productName}
          className="w-full h-full object-contain relative z-10 transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-110 group-hover:-rotate-3 group-hover:drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
        />
        
        {/* Low Stock Badge - Upgraded to look like a premium tag */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-4 left-4 z-20 bg-red-500/10 backdrop-blur-md border border-red-500/30 text-red-400 text-[10px] font-bold font-inter px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
            Low Stock
          </div>
        )}

        {/* Sold Out Badge */}
        {product.stock === 0 && (
          <div className="absolute top-4 left-4 z-20 bg-surface-high/80 backdrop-blur-md border border-white/20 text-text-secondary text-[10px] font-bold font-inter px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
            Sold Out
          </div>
        )}

        {/* "View Product" Overlay Pill that slides up on hover */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center z-20 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full">
            View Gear <ArrowRight size={14} />
          </div>
        </div>
      </Link>

      {/* DETAILS CONTAINER */}
      <div className="p-6 flex flex-col flex-grow justify-between relative z-20">
        <div>
          <Link to={`/product/${product.id}`}>
            <h3 className="kinetic-heading text-xl leading-tight mb-2 text-white group-hover:text-brand-primary transition-colors cursor-pointer line-clamp-1">
              {product.productName}
            </h3>
          </Link>
          <p className="kinetic-body text-sm text-text-secondary line-clamp-2 mb-6">
            {product.description || 'Premium athletic fit engineered for peak performance.'}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Price</span>
            <span className="font-inter font-black text-xl text-white tracking-tight">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
          </div>
          
          {/* Upgraded Cart Button: Expands to pill shape on hover */}
          <button 
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="group/btn relative flex items-center justify-center h-12 w-12 hover:w-32 rounded-full bg-surface-high border border-white/5 text-white hover:bg-brand-primary hover:border-brand-primary hover:text-black transition-all duration-300 ease-out disabled:opacity-50 disabled:hover:w-12 disabled:hover:bg-surface-high disabled:hover:text-white disabled:hover:border-white/5 overflow-hidden shadow-lg"
            aria-label="Add to cart"
          >
            {isAdding ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <ShoppingCart size={18} className="absolute group-hover/btn:opacity-0 transition-opacity duration-200" />
                <span className="absolute opacity-0 group-hover/btn:opacity-100 font-bold uppercase tracking-widest text-xs transition-opacity duration-300 delay-100">
                  Add to Cart
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;