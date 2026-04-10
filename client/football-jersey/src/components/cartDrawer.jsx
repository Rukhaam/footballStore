import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { toggleCart, setCartItems, updateItemQuantityLocal, removeItemFromLocalCart } from '../features/cartSlice';
import api from '../services/api';

const CartDrawer = () => {
  const navigate = useNavigate(); 
  const dispatch = useDispatch();
  
  const { isOpen, items } = useSelector((state) => state.cart);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated || !isOpen) return; 
      
      setLoading(true);
      try {
        const response = await api.get('/cart');
        dispatch(setCartItems(response.data));
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [isOpen, isAuthenticated, dispatch]);

  // --- BUG FIX: Added 'size' parameter to handler ---
  const handleQuantityChange = async (productId, size, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId, size);
      return;
    }

    // 1. Optimistic UI update instantly
    dispatch(updateItemQuantityLocal({ productId, size, quantity: newQuantity }));

    // 2. Background database sync
    if (isAuthenticated) {
      try {
        // Send size in the body so the backend updates the correct variant
        await api.put('/cart/update', { productId, size, quantity: newQuantity });
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    }
  };

  // --- BUG FIX: Added 'size' parameter to handler ---
  const handleRemoveItem = async (productId, size) => {
    // 1. Optimistic UI update instantly
    dispatch(removeItemFromLocalCart({ productId, size }));

    // 2. Background database sync
    if (isAuthenticated) {
      try {
        // Pass size as a query parameter as configured in our cartController
        const endpoint = size ? `/cart/remove/${productId}?size=${size}` : `/cart/remove/${productId}`;
        await api.delete(endpoint);
      } catch (error) {
        console.error('Failed to remove item:', error);
      }
    }
  };

  const handleCheckout = () => {
    dispatch(toggleCart()); 
    navigate('/checkout');  
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => {
      return sum + (parseFloat(item.priceAtTime) * item.quantity);
    }, 0);
    return total.toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-surface-deep/80 backdrop-blur-sm transition-opacity" onClick={() => dispatch(toggleCart())}></div>

      <div className="relative w-full max-w-md bg-surface-low h-full flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5 animate-slide-in">
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-base">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-brand-primary" size={24} />
            <h2 className="kinetic-heading text-xl uppercase">Your Gear</h2>
          </div>
          <button onClick={() => dispatch(toggleCart())} className="text-text-secondary hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center mt-10">
              <div className="w-8 h-8 border-2 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-text-secondary mt-10 font-inter">Your cart is empty. <br/> Time to hit the pitch.</div>
          ) : (
            items.map((item) => {
              // Ensure we read size correctly whether it's at the root level or nested
              const itemSize = item.size || item.product?.size;
              
              return (
                // BUG FIX: Key now incorporates size so React doesn't get confused by identical products
                <div key={`${item.product.id}-${itemSize || 'nosize'}`} className="flex gap-4 bg-surface-base p-4 rounded-large border border-white/5">
                  <div className="w-20 h-24 bg-surface-deep rounded-md p-2 flex-shrink-0">
                    <img src={item.product.imageUrl || 'https://via.placeholder.com/150'} alt={item.product.name} className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="flex flex-col justify-between flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="kinetic-heading text-sm text-white line-clamp-2 pr-4">{item.product.name}</h3>
                        
                        {/* Display Size Badge if item has a size */}
                        {itemSize && (
                          <div className="inline-block mt-1 px-2 py-0.5 bg-surface-high border border-white/10 rounded text-[10px] text-text-secondary uppercase tracking-widest font-bold">
                            Size: <span className="text-white">{itemSize}</span>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveItem(item.product.id, itemSize)}
                        className="text-text-secondary hover:text-red-400 transition-colors mt-1 shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-brand-primary font-bold font-inter">
                      ₹{parseFloat(item.priceAtTime).toFixed(2)}
                      </span>
                      
                      <div className="flex items-center gap-2 bg-surface-high rounded-full border border-white/5 px-1 py-1">
                        <button 
                          onClick={() => handleQuantityChange(item.product.id, itemSize, item.quantity - 1)}
                          className="p-1 text-text-secondary hover:text-white transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-inter w-4 text-center font-bold text-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => handleQuantityChange(item.product.id, itemSize, item.quantity + 1)}
                          className="p-1 text-text-secondary hover:text-white transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-surface-base border-t border-white/5">
            <div className="flex items-center justify-between mb-6 font-inter">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-xl text-white font-bold">₹{calculateTotal()}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              className="btn-primary w-full flex justify-center items-center py-4 text-lg"
            >
              Secure Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;