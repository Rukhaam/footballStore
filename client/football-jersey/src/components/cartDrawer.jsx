import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { toggleCart, setCartItems, updateItemQuantityLocal, removeItemFromLocalCart } from '../features/cartSlice';
import api from '../services/api';

const parseSize = (rawSize) => {
  if (!rawSize) return null;
  if (typeof rawSize === 'object') return parseSize(rawSize.size);
  if (typeof rawSize === 'string' && rawSize.startsWith('{')) {
    try {
      return parseSize(JSON.parse(rawSize).size);
    } catch {
      return rawSize.trim().toUpperCase() || null;
    }
  }
  return String(rawSize).trim().toUpperCase() || null;
};

const CartDrawer = () => {
  const navigate = useNavigate(); 
  const dispatch = useDispatch();
  
  const { isOpen, items } = useSelector((state) => state.cart);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const [loading, setLoading] = useState(false);

  // --- PERFORMANCE REFS ---
  const debounceTimers = useRef({});
  const abortControllers = useRef({}); // Tracks active API calls

  useEffect(() => {
    // 1. Setup AbortController for the initial cart fetch
    const controller = new AbortController();

    const fetchCart = async () => {
      if (!isAuthenticated || !isOpen) return; 
      
      setLoading(true);
      try {
        // Pass the signal to the API request
        const response = await api.get('/cart', { signal: controller.signal });
        dispatch(setCartItems(response.data));
      } catch (error) {
        // Ignore the error if we intentionally aborted it (e.g. user closed drawer quickly)
        if (error.name === 'CanceledError' || error.message === 'canceled') {
          console.log('Cart fetch aborted.');
        } else {
          console.error('Failed to fetch cart:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCart();
    return () => {
      controller.abort();
    };
  }, [isOpen, isAuthenticated, dispatch]);

  const handleQuantityChange = async (productId, size, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId, size);
      return;
    }

    // Instantly update UI
    dispatch(updateItemQuantityLocal({ productId, size, quantity: newQuantity }));

    if (isAuthenticated) {
      const itemKey = `${productId}-${size || 'nosize'}`;

      // 1. Reset the Debounce Timer
      if (debounceTimers.current[itemKey]) {
        clearTimeout(debounceTimers.current[itemKey]);
      }

      debounceTimers.current[itemKey] = setTimeout(async () => {
        
        // 2. ABORT previous in-flight requests for this specific item
        if (abortControllers.current[itemKey]) {
          abortControllers.current[itemKey].abort();
        }

        // 3. Create a NEW controller for this specific request
        const currentController = new AbortController();
        abortControllers.current[itemKey] = currentController;

        try {
          await api.put('/cart/update', 
            { productId, size, quantity: newQuantity },
            { signal: currentController.signal } // Attach signal
          );
        } catch (error) {
          if (error.name === 'CanceledError' || error.message === 'canceled') {
            console.log(`Update aborted for ${itemKey}`);
          } else {
            console.error('Failed to update quantity:', error);
          }
        } finally {
          delete debounceTimers.current[itemKey];
          // Clean up the controller ref if it hasn't been replaced
          if (abortControllers.current[itemKey] === currentController) {
            delete abortControllers.current[itemKey];
          }
        }
      }, 2000); // 2-second debounce
    }
  };

  const handleRemoveItem = async (productId, size) => {
    // Instantly remove from UI
    dispatch(removeItemFromLocalCart({ productId, size }));

    if (isAuthenticated) {
      const itemKey = `${productId}-${size || 'nosize'}`;
      
      // 1. Cancel any pending Debounce timers for this item
      if (debounceTimers.current[itemKey]) {
        clearTimeout(debounceTimers.current[itemKey]);
        delete debounceTimers.current[itemKey];
      }

      // 2. Abort any in-flight database updates for this item
      if (abortControllers.current[itemKey]) {
        abortControllers.current[itemKey].abort();
        delete abortControllers.current[itemKey];
      }

      try {
        const endpoint = size
          ? `/cart/remove/${productId}?size=${encodeURIComponent(size)}`
          : `/cart/remove/${productId}`;
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
              const rawSize = item.size || item.product?.size;
              const displaySize = parseSize(rawSize);
              const productName = item.product?.name || item.product?.productName || 'Jersey';
              const productImage = item.product?.imageUrl || item.product?.productImageUrl || 'https://via.placeholder.com/150';

              return (
                <div key={`${item.product.id}-${displaySize || 'nosize'}`} className="flex gap-4 bg-surface-base p-4 rounded-large border border-white/5">
                  <div className="w-20 h-24 bg-surface-deep rounded-md p-2 flex-shrink-0">
                    <img src={productImage} alt={productName} className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="flex flex-col justify-between flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="kinetic-heading text-sm text-white line-clamp-2 pr-4">{productName}</h3>
                        
                        {displaySize && (
                          <div className="text-xs text-text-secondary mt-1 uppercase font-bold tracking-wider">
                            Size: {displaySize}
                          </div>
                        )}
                        
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveItem(item.product.id, displaySize)}
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
                          onClick={() => handleQuantityChange(item.product.id, displaySize, item.quantity - 1)}
                          className="p-1 text-text-secondary hover:text-white transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-inter w-4 text-center font-bold text-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => handleQuantityChange(item.product.id, displaySize, item.quantity + 1)}
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
