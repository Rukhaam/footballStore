import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Search, User, LogOut } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { setUser } from '../features/authSlice';
import { toggleCart } from '../features/cartSlice';
const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dispatch(setUser(null));
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      {/* The floating glass pill */}
      <div className="max-w-7xl mx-auto glass-panel rounded-full px-8 py-4 flex items-center justify-between">
        
        {/* Logo area */}
        <Link to="/" className="kinetic-heading text-2xl tracking-tighter hover:text-brand-primary transition-colors">
          KINETIC<span className="text-brand-primary">.</span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-inter text-text-secondary">
          <Link to="/" className="hover:text-white transition-colors">New Arrivals</Link>
          <Link to="/collections" className="hover:text-white transition-colors">Collections</Link>
          <Link to="/sale" className="hover:text-brand-primary transition-colors">Clearance</Link>
        </div>

        {/* Icons & Actions */}
        <div className="flex items-center gap-6">
          <button className="text-text-secondary hover:text-white transition-colors">
            <Search size={20} />
          </button>
          
          {/* Cart Icon with Notification Dot */}
          <button 
            onClick={() => dispatch(toggleCart())} // <-- Added onClick event
            className="relative text-text-secondary hover:text-white transition-colors"
          >
            <ShoppingCart size={20} />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-primary text-brand-on-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>

          {/* Auth State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4 border-l border-white/10 pl-4 ml-2">
              <span className="hidden lg:block text-xs font-inter text-text-secondary">
                {user?.email?.split('@')[0]}
              </span>
              <button onClick={handleLogout} className="text-text-secondary hover:text-red-400 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-white/10 pl-4 ml-2">
               <Link to="/auth" className="text-text-secondary hover:text-white transition-colors">
                 <User size={20} />
               </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;