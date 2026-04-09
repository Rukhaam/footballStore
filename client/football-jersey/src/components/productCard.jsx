import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useSelector ,useDispatch} from 'react-redux';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setIsAdding(true);
    try {
      // 1. THE FIX: Corrected the endpoint URL to '/cart/add'
      await api.post('/cart/add', {
        productId: product.id,
        quantity: 1,
      });
      
      // 2. THE UPGRADE: Optimistically update Redux so the UI badge instantly changes!
      dispatch(addItemToLocalCart({
        cartItemId: `temp-${Date.now()}`, // Temporary ID for the UI
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
    <div className="group flex flex-col bg-surface-low rounded-large overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(194,243,91,0.05)]">
      
      {/* Image Container */}
      <div className="relative aspect-[4/5] bg-surface-deep flex items-center justify-center p-6 overflow-hidden">
        {/* Subtle background glow behind the jersey */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <img 
          src={product.productImageUrl || 'https://via.placeholder.com/400x500?text=Jersey+Image'} 
          alt={product.productName}
          className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Category/Stock Badge */}
        {product.stock < 10 && (
          <div className="absolute top-4 left-4 z-20 bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold font-inter px-2 py-1 rounded-sm uppercase tracking-wider">
            Low Stock
          </div>
        )}
      </div>

      {/* Product Info Container */}
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="kinetic-heading text-lg leading-tight mb-2 group-hover:text-brand-primary transition-colors">
            {product.productName}
          </h3>
          <p className="kinetic-body text-sm line-clamp-2 mb-4">
            {product.description || 'Premium athletic fit jersey.'}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <span className="font-inter font-semibold text-lg text-white">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          
          <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-high text-white hover:bg-brand-primary hover:text-brand-on-primary transition-colors disabled:opacity-50"
            aria-label="Add to cart"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;