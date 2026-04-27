import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'; // Added useSearchParams
import { ArrowLeft, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import ProductCard from '../components/productCard';
import { getCollectionSlug } from '../utils/slugify';

const ProductCardSkeleton = () => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-low animate-pulse">
    <div className="h-64 w-full bg-surface-high/70" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-3/4 rounded bg-surface-high/80" />
      <div className="h-3 w-1/2 rounded bg-surface-high/70" />
      <div className="h-6 w-1/3 rounded bg-surface-high/80" />
    </div>
  </div>
);

const CollectionPage = () => {
  const { collectionSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // Manage URL params
  
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Read initial page from URL, default to 1
  const initialPage = parseInt(searchParams.get('page')) || 1;
  const [pagination, setPagination] = useState({ currentPage: initialPage, totalPages: 1, totalItems: 0 });

  // If the collection slug changes, force reset to page 1 in both state and URL
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSearchParams({ page: 1 }, { replace: true });
  }, [collectionSlug, setSearchParams]);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        // Use the current page from state for the API call
        const { data } = await api.get(`/store/collections/${collectionSlug}?page=${pagination.currentPage}&limit=15`);
        
        setCollection(data.collection);
        setProducts(data.products);
        
        if (data.pagination) {
            setPagination(data.pagination);
        } else {
            setPagination(prev => ({ ...prev, totalItems: data.products?.length || 0 }));
        }

        const canonicalSlug = getCollectionSlug(data.collection);
        if (canonicalSlug && collectionSlug !== canonicalSlug) {
          navigate(`/collection/${canonicalSlug}?page=${pagination.currentPage}`, { replace: true });
        }

        // Only scroll to top if we actually have data loaded
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error("Error fetching collection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [collectionSlug, pagination.currentPage, navigate]);

  // Pagination Handlers - Update both State and URL
  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      const nextPage = pagination.currentPage + 1;
      setPagination(prev => ({ ...prev, currentPage: nextPage }));
      setSearchParams({ page: nextPage });
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      const prevPage = pagination.currentPage - 1;
      setPagination(prev => ({ ...prev, currentPage: prevPage }));
      setSearchParams({ page: prevPage });
    }
  };

  if (loading && !collection) {
    return (
      <div className="min-h-screen bg-surface-base pb-24">
        <div className="max-w-[1400px] mx-auto px-6 mt-16">
          <div className="mb-10">
            <div className="h-8 w-72 max-w-full rounded bg-surface-low animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, index) => (
              <ProductCardSkeleton key={`collection-initial-skeleton-${index}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <>
        <Helmet>
          <title>Collection Not Found | Kinetic Store</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
          <h1 className="kinetic-heading text-4xl mb-4">Collection Not Found</h1>
          <button onClick={() => navigate('/')} className="text-brand-primary hover:underline">Return Home</button>
        </div>
      </>
    );
  }

  const bannerImage = collection.logoUrl || collection.logo_url || 'https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=2000&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-surface-base pb-24">
      
      <Helmet>
        <title>
          {collection.collectionName} Collection {pagination.currentPage > 1 ? `- Page ${pagination.currentPage}` : ''} | Kinetic Store
        </title>
        <meta 
          name="description" 
          content={collection.description || `Shop the official ${collection.collectionName} gear at Kinetic Store. Premium kits and merchandise.`} 
        />
        <meta property="og:title" content={`${collection.collectionName} Collection | Kinetic Store`} />
        <meta property="og:description" content={collection.description || `Shop the official ${collection.collectionName} gear at Kinetic Store.`} />
        <meta property="og:image" content={bannerImage} />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      {/* 1. HERO BANNER */}
      <div className="relative w-full h-[40vh] md:h-[50vh] flex items-end justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImage} 
            alt={collection.collectionName} 
            className="w-full h-full object-cover opacity-30"
          />
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <h2 className="kinetic-heading text-2xl text-white uppercase tracking-widest">
            Explore The Collection
          </h2>
          <div className="text-sm font-inter text-text-secondary font-bold uppercase tracking-widest bg-surface-low px-4 py-2 rounded-lg border border-white/5 w-max">
            {pagination.totalItems || products.length} Items Found
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, index) => (
              <ProductCardSkeleton key={`collection-grid-skeleton-${index}`} />
            ))}
          </div>
        ) : products.length === 0 ? (
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

        {/* 3. PAGINATION CONTROLS */}
        {pagination.totalPages > 1 && (
          <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-center gap-6">
            <button 
              onClick={handlePrevPage} 
              disabled={pagination.currentPage === 1 || loading}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-low border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface-low disabled:hover:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="font-inter font-bold text-white text-lg flex items-center gap-2">
              Page <span className="text-brand-primary">{pagination.currentPage}</span> of {pagination.totalPages}
            </div>

            <button 
              onClick={handleNextPage} 
              disabled={pagination.currentPage === pagination.totalPages || loading}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-low border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface-low disabled:hover:text-white"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CollectionPage;