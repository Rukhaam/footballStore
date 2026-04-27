import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, User, Menu, X, ChevronDown, ChevronRight, ArrowLeft, LogOut, Search } from 'lucide-react';
import { clearLocalCart, toggleCart } from '../features/cartSlice';
import { toggleSearch } from '../features/searchSlice'; 
import { logout } from '../features/authSlice';
import api from '../services/api';
import { supabase } from '../services/supabaseClient';
import { slugify } from '../utils/slugify';

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=800&auto=format&fit=crop';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  
  const [categories, setCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false); 
  const [isScrolled, setIsScrolled] = useState(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // --- Scroll Listener for Transparent to Blurred Navbar ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Fetch Navbar Categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch page 1 with a limit of 8 (perfect for a 4-column mega menu)
        const res = await api.get('/store/categories?page=1&limit=8');
        
        // Safely handle the response structure
        if (res.data && res.data.data) {
          setCategories(res.data.data); 
        } else if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // --- Handlers ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch(logout());
      dispatch(clearLocalCart());
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setTimeout(() => setShowMobileCategories(false), 300); 
  };

  const handleMobileSearch = () => {
    closeMobileMenu();
    dispatch(toggleSearch());
  };

  return (
    <>
      {/* --- DESKTOP & TOP NAVBAR --- */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out ${
          isScrolled 
            ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-0' 
            : 'bg-transparent py-2'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 -ml-2 text-white" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>

          {/* Logo */}
          <Link to="/" className="kinetic-heading text-2xl text-white tracking-wider flex items-center gap-2 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <span className="text-brand-primary">KINETIC</span> ARENA
          </Link>

          {/* Center Desktop Nav */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2 h-full">
            <Link to="/" className="text-sm font-inter font-semibold text-text-secondary hover:text-white transition-colors uppercase tracking-widest">
              Home
            </Link>
            
            {/* --- DESKTOP MEGA MENU --- */}
            <div className="group h-full w-full flex items-center justify-center">
              <button className="flex items-center justify-center gap-1 text-sm font-inter font-semibold text-text-secondary group-hover:text-white transition-colors uppercase tracking-widest h-full">
                Categories <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              <div className="fixed top-20 w-max bg-[#0a0a0a] border-b border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 z-50 rounded-b-3xl">
                <div className="w-max px-6 lg:px-12 py-12">
                  <div className="flex items-center justify-center mb-8">
                    <h2 className="kinetic-heading text-2xl text-white uppercase tracking-widest">Shop By Category</h2>
                    <Link to="/category/all" className="text-brand-primary text-sm font-bold uppercase tracking-widest hover:underline ml-4">View All Gear →</Link>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((cat) => (
                      <Link 
                        key={cat.id} 
                        to={`/category/${cat.slug || slugify(cat.categoryName)}`} 
                        className="group/card relative h-[250px] w-[200px] xl:w-[250px] xl:h-[300px] rounded-2xl overflow-hidden bg-surface-deep block border border-white/5 shadow-lg"
                      >
                        <img 
                          src={cat.categoryUrl || cat.category_url || DEFAULT_CATEGORY_IMAGE} 
                          alt={cat.categoryName} 
                          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover/card:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 group-hover/card:opacity-90"></div>
                        <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300">
                          <h3 className="kinetic-heading text-white text-xl uppercase leading-tight mb-1">
                            {cat.categoryName}
                          </h3>
                          <span className="text-brand-primary text-xs font-bold uppercase tracking-widest opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                            Shop Now <ChevronRight size={14} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <Link to="/orders" className="text-sm font-inter font-semibold text-text-secondary hover:text-white transition-colors uppercase tracking-widest">
              Orders
            </Link>
            <Link to="/contact" className="text-sm font-inter font-semibold text-text-secondary hover:text-white transition-colors uppercase tracking-widest">
              Contact 
            </Link>
          </div>

          {/* Icons (Right Side) */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* Search Icon */}
            <button 
              onClick={() => dispatch(toggleSearch())} 
              className="p-2 text-text-secondary hover:text-white transition-colors hidden md:block"
              title="Search"
            >
              <Search size={22} />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => dispatch(toggleCart())} className="relative p-2 text-text-secondary hover:text-white transition-colors">
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-brand-primary text-surface-base text-xs font-bold rounded-full flex items-center justify-center translate-x-1 -translate-y-1">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button onClick={handleLogout} className="hidden md:block p-2 text-text-secondary hover:text-red-400 transition-colors" title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => dispatch(toggleCart())} className="md:hidden relative p-2 text-text-secondary hover:text-white transition-colors">
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-brand-primary text-surface-base text-xs font-bold rounded-full flex items-center justify-center translate-x-1 -translate-y-1">
                      {cartCount}
                    </span>
                  )}
                </button>
                <Link to="/auth" className="hidden md:flex items-center gap-2 text-sm font-inter font-semibold text-text-secondary hover:text-white transition-colors">
                  <User size={20} /> Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* --- MOBILE SIDEBAR --- */}
      <div className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={closeMobileMenu}></div>

      <div className={`md:hidden fixed inset-y-0 left-0 w-[85%] max-w-sm bg-surface-base border-r border-white/10 z-[80] transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-surface-low/50">
          <span className="kinetic-heading text-xl text-white tracking-wider flex items-center gap-2">
            <span className="text-brand-primary">MENU</span>
          </span>
          <button onClick={closeMobileMenu} className="p-2 text-text-secondary hover:text-white transition-colors bg-white/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className={`absolute top-0 left-0 h-full w-[200%] flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${showMobileCategories ? '-translate-x-1/2' : 'translate-x-0'}`}>
            
            {/* Primary Mobile Menu */}
            <div className="w-1/2 h-full p-6 flex flex-col gap-2">
              <Link to="/" onClick={closeMobileMenu} className="flex items-center justify-between py-4 text-xl kinetic-heading text-white border-b border-white/5">
                Home
              </Link>
              
              <button onClick={handleMobileSearch} className="flex items-center justify-between py-4 text-xl kinetic-heading text-white border-b border-white/5 group">
                Search
                <div className="bg-white/5 p-2 rounded-full group-hover:bg-brand-primary/20 transition-colors">
                  <Search size={20} className="text-text-secondary group-hover:text-brand-primary" />
                </div>
              </button>

              <button onClick={() => setShowMobileCategories(true)} className="flex items-center justify-between py-4 text-xl kinetic-heading text-white border-b border-white/5 group">
                Categories 
                <div className="bg-white/5 p-2 rounded-full group-hover:bg-brand-primary/20 transition-colors">
                  <ChevronRight size={20} className="text-text-secondary group-hover:text-brand-primary" />
                </div>
              </button>
              <Link to="/orders" onClick={closeMobileMenu} className="flex items-center justify-between py-4 text-xl kinetic-heading text-white border-b border-white/5">
                Orders
              </Link>
              <Link to="/contact" onClick={closeMobileMenu} className="flex items-center justify-between py-4 text-xl kinetic-heading text-white border-b border-white/5">
                Contact
              </Link>
              
              <div className="mt-auto pt-8">
                {!isAuthenticated ? (
                  <Link to="/auth" onClick={closeMobileMenu} className="btn-primary w-full py-4 text-center flex justify-center">Login / Sign Up</Link>
                ) : (
                  <button onClick={handleLogout} className="btn-secondary text-red-400 w-full py-4 text-center flex items-center justify-center gap-2">
                    <LogOut size={20} /> Logout
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Categories Drill-Down */}
            <div className="w-1/2 h-full p-4 flex flex-col gap-3 bg-[#0a0a0a] overflow-y-auto pb-20">
              <button onClick={() => setShowMobileCategories(false)} className="flex items-center gap-2 py-4 mb-2 text-sm font-inter font-bold text-text-secondary hover:text-white transition-colors uppercase tracking-widest border-b border-white/5">
                <ArrowLeft size={18} /> Back
              </button>
              <h3 className="kinetic-heading text-2xl text-white mb-4 px-2 mt-4">Shop Gear</h3>
              {categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/category/${cat.slug || slugify(cat.categoryName)}`} 
                  onClick={closeMobileMenu} 
                  className="flex items-center gap-4 p-3 rounded-xl bg-surface-deep border border-white/5 hover:border-brand-primary/50 transition-all group"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative border border-white/5">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                    <img 
                      src={cat.categoryUrl || cat.category_url || DEFAULT_CATEGORY_IMAGE} 
                      alt={cat.categoryName} 
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-sm font-inter font-bold text-white group-hover:text-brand-primary transition-colors uppercase tracking-wider">
                      {cat.categoryName}
                    </h4>
                  </div>
                  <ChevronRight size={18} className="text-text-secondary group-hover:text-brand-primary mr-2" />
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;