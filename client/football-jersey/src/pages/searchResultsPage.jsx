import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/productCard'; // Check your exact import path/casing!
import { Loader2, SearchX } from 'lucide-react';

const SearchResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/store/search?q=${query}`);
        setResults(data.data || data || []);
      } catch (error) {
        console.error("Failed to fetch search results", error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="min-h-[80vh] bg-surface-base pt-10 pb-24 px-6 mt-20">
      <div className="max-w-7xl mx-auto w-full">
        
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="kinetic-heading text-3xl md:text-5xl text-white uppercase tracking-wider mb-2">
            Search Results
          </h1>
          <p className="text-text-secondary font-inter text-lg">
            Showing matches for <span className="text-brand-primary font-bold">"{query}"</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="animate-spin text-brand-primary" size={48} />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-surface-deep rounded-full border border-white/5 mb-6">
              <SearchX size={48} className="text-white/20" />
            </div>
            <h2 className="text-2xl text-white font-bold mb-3 kinetic-heading tracking-wider uppercase">No match found</h2>
            <p className="text-text-secondary font-inter">Try searching for different keywords, clubs, or players.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;