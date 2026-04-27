import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async'; // <-- 1. Imported Helmet
import api from '../services/api';
import ProductCard from '../components/productCard';
import { slugify } from '../utils/slugify';

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

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ category: null, products: [] });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [categorySlug]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/store/category/${categorySlug}?page=${pagination.currentPage}&limit=15`);
        setData({
          category: response.data.category,
          products: response.data.products
        });
        setPagination(response.data.pagination);

        const canonicalSlug = slugify(response.data.category?.categoryName || '');
        if (canonicalSlug && categorySlug !== canonicalSlug) {
          navigate(`/category/${canonicalSlug}`, { replace: true });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error("Failed to load category data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryData();
  }, [categorySlug, pagination.currentPage, navigate]);

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  if (loading && !data.category) {
    return (
      <div className="px-6 pt-12 pb-24 w-full max-w-7xl mx-auto">
        <div className="mb-12 border-b border-white/10 pb-6">
          <div className="h-10 w-72 max-w-full rounded bg-surface-low animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[50vh]">
          {Array.from({ length: 12 }).map((_, index) => (
            <ProductCardSkeleton key={`category-initial-skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  if (!data.category) {
    return (
      <>
        <Helmet>
          <title>Category Not Found | Kinetic Store</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="text-center text-white mt-20 text-2xl">Category not found</div>
      </>
    );
  }

  return (
    <div className="px-6 pt-12 pb-24 w-full max-w-7xl mx-auto mt-20">
      
      {/* 2. Added Helmet for Dynamic Category SEO */}
      <Helmet>
        <title>
          {data.category.categoryName} Gear {pagination.currentPage > 1 ? `- Page ${pagination.currentPage}` : ''} | Kinetic Store
        </title>
        <meta 
          name="description" 
          content={`Explore our exclusive collection of ${data.category.categoryName} football products. Shop the latest kits and premium fan gear at Kinetic Store.`} 
        />
        <meta property="og:title" content={`${data.category.categoryName} Gear | Kinetic Store`} />
        <meta property="og:description" content={`Explore our exclusive collection of ${data.category.categoryName} football products.`} />
        <meta property="og:url" content={window.location.href} />
      </Helmet>

      {/* Category Header */}
      <div className="mb-12 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="kinetic-heading text-4xl md:text-5xl uppercase text-white mb-2">
            {data.category.categoryName} Gear
          </h1>
          <p className="text-text-secondary font-inter">
            Explore our collection of {data.category.categoryName} products.
          </p>
        </div>
        {/* Total Items Counter */}
        <div className="text-sm font-inter text-text-secondary font-bold uppercase tracking-widest bg-surface-low px-4 py-2 rounded-lg border border-white/5">
          {pagination.totalItems} Items Found
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[50vh]">
          {Array.from({ length: 12 }).map((_, index) => (
            <ProductCardSkeleton key={`category-grid-skeleton-${index}`} />
          ))}
        </div>
      ) : data.products.length === 0 ? (
        <div className="text-center text-text-secondary font-inter py-20 bg-surface-low rounded-xl border border-white/5">
          No products found in this category yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[50vh]">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* --- PAGINATION CONTROLS --- */}
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
  );
};

export default CategoryPage;