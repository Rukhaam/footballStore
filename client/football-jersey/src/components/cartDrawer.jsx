import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { toggleCart, setCartItems } from '../features/cartSlice';
import api from '../services/api';

const CartDrawer = () => {
  const { isOpen, items } = useSelector((state) => state.cart);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch the cart whenever the drawer opens
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

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      // In a real app, you'd collect the address via a form. 
      // For now, we'll pass a default kinetic snapshot address to test the API.
      await api.post('/orders/checkout', { 
        addressSnapshot: "100 Kinetic Ave, Stadium District, Neo City" 
      });
      
      alert("Checkout Successful! Your gear is on the way.");
      dispatch(setCartItems([])); // Empty the Redux cart
      dispatch(toggleCart()); // Close the drawer
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Calculate the total price safely
  const calculateTotal = () => {
    const total = items.reduce((sum, item) => {
      return sum + (parseFloat(item.priceAtTime) * item.quantity);
    }, 0);
    return total.toFixed(2);
  };

  // If not open, don't render the UI blocking the screen
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Dark Overlay (Click to close) */}
      <div 
        className="absolute inset-0 bg-surface-deep/80 backdrop-blur-sm transition-opacity"
        onClick={() => dispatch(toggleCart())}
      ></div>

      {/* The Sliding Drawer */}
      <div className="relative w-full max-w-md bg-surface-low h-full flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5 animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-base">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-brand-primary" size={24} />
            <h2 className="kinetic-heading text-xl uppercase">Your Gear</h2>
          </div>
          <button 
            onClick={() => dispatch(toggleCart())}
            className="text-text-secondary hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
          {!isAuthenticated ? (
            <div className="text-center text-text-secondary mt-10 font-inter">
              Please log in to view your cart.
            </div>
          ) : loading ? (
            <div className="flex justify-center mt-10">
              <div className="w-8 h-8 border-2 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-text-secondary mt-10 font-inter">
              Your cart is empty. <br/> Time to hit the pitch.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 bg-surface-base p-4 rounded-large border border-white/5">
                <div className="w-20 h-24 bg-surface-deep rounded-md p-2 flex-shrink-0">
                  <img 
                    src={item.product.imageUrl || 'https://via.placeholder.com/150'} 
                    alt={item.product.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-between flex-grow">
                  <div>
                    <h3 className="kinetic-heading text-sm text-white line-clamp-2">{item.product.name}</h3>
                    <p className="text-xs text-text-secondary font-inter mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-brand-primary font-bold font-inter">
                      ${parseFloat(item.priceAtTime).toFixed(2)}
                    </span>
                    <button className="text-text-secondary hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {isAuthenticated && items.length > 0 && (
          <div className="p-6 bg-surface-base border-t border-white/5">
            <div className="flex items-center justify-between mb-6 font-inter">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-xl text-white font-bold">${calculateTotal()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="btn-primary w-full flex justify-center items-center py-4 text-lg disabled:opacity-50"
            >
              {checkoutLoading ? 'Processing...' : 'Secure Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;