import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { closeSearch } from '../features/searchSlice';
import api from '../services/api';
import { getProductSlug } from '../utils/slugify';

const SearchDrawer = () => {
  const { isOpen } = useSelector(state => state.search);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
      setSuggestions([]);
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/store/search?q=${query}`);
        setSuggestions(data.data || data || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }, 400); // Waits 400ms after the user stops typing
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      dispatch(closeSearch());
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionClick = (product) => {
    dispatch(closeSearch());
    navigate(`/product/${getProductSlug(product)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-surface-deep/80 backdrop-blur-sm transition-opacity" onClick={() => dispatch(closeSearch())}></div>

      {/* Responsiveness: Full width/height on mobile, max-w-md on desktop */}
      <div className="relative w-full h-full md:max-w-md bg-surface-low shadow-[-20px_0_40px_rgba(0,0,0,0.5)] md:border-l border-white/5 animate-slide-in flex flex-col">
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-base shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex-grow relative flex items-center mr-4">
            <Search className="absolute left-4 text-text-secondary" size={20} />
            <input 
              ref={inputRef}
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jerseys, clubs..." 
              className="w-full bg-surface-deep border border-white/10 rounded-full py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary transition-colors font-inter text-sm"
            />
          </form>
          <button onClick={() => dispatch(closeSearch())} className="text-text-secondary hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 shrink-0">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center mt-10 text-brand-primary">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="text-xs font-inter text-text-secondary uppercase tracking-widest px-2 mb-2 mt-2">Top Suggestions</div>
              {suggestions.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleSuggestionClick(item)}
                  className="flex items-center gap-4 bg-surface-base p-3 rounded-xl border border-transparent hover:border-white/10 cursor-pointer transition-all hover:bg-white/5"
                >
                  <div className="w-12 h-16 bg-surface-deep rounded flex items-center justify-center p-1 shrink-0">
                    <img src={item.productImageUrl || 'https://via.placeholder.com/150'} alt={item.productName} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-sm font-inter text-white font-bold line-clamp-1">{item.productName}</h4>
                    <span className="text-brand-primary text-sm font-bold mt-1 block">₹{parseFloat(item.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={handleSearchSubmit}
                className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-primary hover:text-white transition-colors py-4 font-bold tracking-widest uppercase border-t border-white/5"
              >
                View all results <ArrowRight size={16} />
              </button>
            </>
          ) : query.length > 1 ? (
            <div className="text-center text-text-secondary mt-10 font-inter">
              No results found for "<span className="text-white">{query}</span>".
            </div>
          ) : (
            <div className="text-center text-text-secondary mt-10 font-inter flex flex-col items-center gap-3 opacity-50">
              <Search size={48} />
              <span>Start typing to find your next kit.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDrawer;