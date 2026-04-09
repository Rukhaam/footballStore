import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ProductCard from './ProductCard';

const ProductGrid = () => {
  const [jerseys, setJerseys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJerseys = async () => {
      try {
        // Fetch from our public product route
        const response = await api.get('/store/jerseys');
        setJerseys(response.data);
      } catch (err) {
        console.error("Error fetching jerseys:", err);
        setError("Failed to load the collection. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJerseys();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-large text-center font-inter">
        {error}
      </div>
    );
  }

  if (jerseys.length === 0) {
    return (
      <div className="h-64 rounded-large border border-white/10 border-dashed flex items-center justify-center text-text-secondary font-inter">
        No gear available right now. We are restocking the arena!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {jerseys.map((jersey) => (
        <ProductCard key={jersey.id} product={jersey} />
      ))}
    </div>
  );
};

export default ProductGrid;