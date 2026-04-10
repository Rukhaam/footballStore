import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/productCard';

const CollectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/store/collections/${id}`);
        setCollection(data.collection);
        setProducts(data.products);
      } catch (error) {
        console.error("Error fetching collection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <h1 className="kinetic-heading text-4xl mb-4">Collection Not Found</h1>
        <button onClick={() => navigate('/')} className="text-brand-primary hover:underline">Return Home</button>
      </div>
    );
  }

  // Fallback banner if the database doesn't have a logoUrl
  const bannerImage = collection.logoUrl || collection.logo_url || 'https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=2000&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-surface-base pb-24">
      
      {/* 1. HERO BANNER */}
      <div className="relative w-full h-[40vh] md:h-[50vh] flex items-end justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImage} 
            alt={collection.collectionName} 
            className="w-full h-full object-cover opacity-30"
          />
          {/* Kinetic gradients for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-surface-base/50 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pb-12">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6 font-inter text-sm uppercase tracking-wider w-max">
            <ArrowLeft size={16} /> Back to Arena
          </button>
          
          <div className="flex items-center gap-3 text-brand-primary mb-3">
            <Shield size={24} />
            <span className="text-sm font-bold uppercase tracking-[0.3em]">Official Partner</span>
          </div>
          <h1 className="kinetic-heading text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-tighter drop-shadow-2xl">
            {collection.collectionName}
          </h1>
          {collection.description && (
            <p className="mt-4 text-text-secondary font-inter max-w-2xl text-lg">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* 2. PRODUCT GRID */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="kinetic-heading text-2xl text-white uppercase tracking-widest">
            Explore The Collection <span className="text-brand-primary ml-2">({products.length})</span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface-low border border-white/5 rounded-3xl text-center">
            <Shield size={48} className="text-white/20 mb-4" />
            <h3 className="kinetic-heading text-2xl text-white mb-2">No Gear Available Yet</h3>
            <p className="text-text-secondary font-inter mb-6">We are currently restocking our inventory for {collection.collectionName}. Check back soon!</p>
            <Link to="/" className="btn-primary px-8 py-3">View Other Clubs</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CollectionPage;