import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ArrowRight, Star, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async'; // <-- 1. Imported Helmet
import api from '../services/api';
import ProductCard from '../components/productCard';
import HomeVideoCta from '../components/homeVideoCta';
import { HERO_SLIDES } from '../utils/constants';
import { getCollectionSlug } from '../utils/slugify';
import TrustMarquee from '../components/trustMarquee';

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

const CollectionCardSkeleton = () => (
  <div className="relative flex-none w-[280px] h-[380px] md:w-[300px] md:h-[400px] rounded-3xl overflow-hidden snap-center bg-[#0d0d0d] border border-white/5 animate-pulse">
    <div className="absolute inset-0 bg-surface-high/20"></div>
    <div className="absolute inset-x-0 bottom-0 p-8 space-y-3">
      <div className="h-7 w-3/4 rounded bg-surface-high/70"></div>
      <div className="h-3 w-11/12 rounded bg-surface-high/60"></div>
      <div className="h-3 w-8/12 rounded bg-surface-high/60"></div>
    </div>
  </div>
);

const HomePage = () => {
  // --- STATE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [collections, setCollections] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [passionClubs, setPassionClubs] = useState([]);
  const [trendingKits, setTrendingKits] = useState([]);
  
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // --- 1. HERO AUTO-PLAY & CONTROLS ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000); 
    return () => clearInterval(timer);
  }, []);

  const nextHeroSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevHeroSlide = () => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));

  // --- 2. FETCH DATA (Jerseys & Collections) ---
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        // Fetch Jerseys
        const jerseyRes = await api.get('/store/jerseys');
        const allJerseys = jerseyRes.data.data || jerseyRes.data || [];
        setBestSellers(allJerseys.length >= 5 ? allJerseys.slice(0, 5) : allJerseys);
        setPassionClubs(allJerseys.length >= 10 ? allJerseys.slice(5, 10) : allJerseys);
        setTrendingKits(allJerseys.length >= 20 ? allJerseys.slice(10, 20) : allJerseys);

        // Fetch Collections
        const collectionsRes = await api.get('/store/collections');
        setCollections(collectionsRes.data);

      } catch (err) {
        console.error("Failed to load store data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, []);
  // --- BEST SELLERS SLIDER STATE ---
  const bestSellersScrollRef = useRef(null);
  const [activeBestSellerDotIndex, setActiveBestSellerDotIndex] = useState(0);
  
  // Calculate how many dots we need (e.g., 5 total items / 1 item per scroll = 5 dots)
  const bestSellerDotCount = bestSellers.length;

  const handleBestSellerScroll = () => {
    if (!bestSellersScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = bestSellersScrollRef.current;
    
    if (scrollWidth <= clientWidth) {
      setActiveBestSellerDotIndex(0);
      return;
    }
    
    // Calculate which item is currently centered
    const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
    const newIndex = Math.round(scrollPercentage * (bestSellerDotCount - 1));
    setActiveBestSellerDotIndex(newIndex);
  };

  const scrollBestSellersLeft = () => {
    if (bestSellersScrollRef.current) {
      // Scroll by roughly the width of one card + gap
      const scrollAmount = window.innerWidth < 768 ? 300 : 400;
      bestSellersScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollBestSellersRight = () => {
    if (bestSellersScrollRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 300 : 400;
      bestSellersScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const collectionScrollRef = useRef(null);
  const [collectionScrollProgress, setCollectionScrollProgress] = useState(0);

  const handleCollectionScroll = () => {
    if (collectionScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = collectionScrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) setCollectionScrollProgress(scrollLeft / maxScroll);
    }
  };

  const scrollCollectionLeft = () => collectionScrollRef.current?.scrollBy({ left: -collectionScrollRef.current.clientWidth * 0.75, behavior: 'smooth' });
  const scrollCollectionRight = () => collectionScrollRef.current?.scrollBy({ left: collectionScrollRef.current.clientWidth * 0.75, behavior: 'smooth' });

  // Calculate dynamic dots based on scroll percentage
  const collectionDotCount = loading ? 4 : Math.min(5, Math.max(1, collections.length));
  const activeCollectionDotIndex = !loading && collections.length > 0
    ? Math.min(collectionDotCount - 1, Math.max(0, Math.round(collectionScrollProgress * (collectionDotCount - 1))))
    : 0;

  // --- 3. TRENDING SLIDER LOGIC ---
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) setScrollProgress(scrollLeft / maxScroll);
    }
  };

  const scrollTrendingLeft = () => scrollRef.current?.scrollBy({ left: -scrollRef.current.clientWidth * 0.75, behavior: 'smooth' });
  const scrollTrendingRight = () => scrollRef.current?.scrollBy({ left: scrollRef.current.clientWidth * 0.75, behavior: 'smooth' });

  const dotCount = 5;
  const activeDotIndex = Math.min(dotCount - 1, Math.max(0, Math.round(scrollProgress * (dotCount - 1))));
  const firstHeroImage = HERO_SLIDES[0]?.image;

  return (
    <div className="flex flex-col w-full overflow-hidden bg-surface-base">
      
      {/* 2. Added Helmet for Homepage SEO */}
      <Helmet>
        <title>Kinetic Store | Premium Football Jerseys & Gear</title>
        <meta name="description" content="Shop the latest 2024/25 football kits, retro classic jerseys, and premium fan gear at Kinetic Store. Engineered for performance, worn with passion." />
        <meta property="og:title" content="Kinetic Store | Premium Football Jerseys" />
        <meta property="og:description" content="Shop the latest 2024/25 football kits and premium fan gear at Kinetic Store." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        {/* If you have a specific banner image you want to show on WhatsApp, replace the URL below */}
        <meta property="og:image" content="https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=1200&auto=format&fit=crop" />
        {firstHeroImage && <link rel="preload" as="image" href={firstHeroImage} fetchpriority="high" />}
      </Helmet>

      {/* =========================================
          SECTION 1: HERO CAROUSEL
      ========================================= */}
      <section className="relative w-full h-[calc(100svh-80px)] min-h-[560px] md:min-h-[640px] overflow-hidden group border-b border-white/5">
        {HERO_SLIDES.map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img
              src={slide.image}
              alt={slide.title}
              width="1920"
              height="1080"
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'low'}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-105' : 'scale-100'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-base/95 via-surface-base/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-transparent to-transparent opacity-80"></div>

            <div className="relative z-20 max-w-7xl mx-auto px-6 h-full flex items-center">
              <div className="w-full md:w-2/3 lg:w-1/2 pt-6 md:pt-10">
                <div className={`transition-all duration-700 delay-300 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  <div className="inline-block px-3 py-1 mb-4 md:mb-6 border border-brand-primary/30 bg-brand-primary/10 text-brand-primary font-inter text-xs font-bold uppercase tracking-widest rounded-full">
                    {slide.chip}
                  </div>
                  <div className="min-h-[280px] sm:min-h-[320px] md:min-h-[360px]">
                    <h1 className="kinetic-heading text-[clamp(2.4rem,11vw,4rem)] md:text-7xl lg:text-8xl leading-[0.92] mb-5 md:mb-6 uppercase text-white">
                      {slide.title} <br />
                      <span className="text-brand-primary">{slide.titleHighlight}</span>
                    </h1>
                    <p className="kinetic-body text-base sm:text-lg md:text-xl mb-8 md:mb-10 max-w-md text-text-secondary leading-relaxed min-h-[72px] md:min-h-[84px]">{slide.desc}</p>
                  </div>
                  <Link to={slide.link} className="btn-primary py-4 px-8 inline-flex items-center gap-2">
                    Explore Collection <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button onClick={prevHeroSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 text-white hover:bg-brand-primary hover:text-black transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block hover:scale-110">
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>
        <button onClick={nextHeroSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 text-white hover:bg-brand-primary hover:text-black transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block hover:scale-110">
          <ChevronRight size={28} strokeWidth={1.5} />
        </button>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {HERO_SLIDES.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`transition-all duration-300 rounded-full h-2 ${index === currentSlide ? 'w-10 bg-brand-primary' : 'w-2 bg-white/30 hover:bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* =========================================
          SECTION 2: EDGE-MASKED MARQUEE
      ========================================= */}
      <section className="border-b border-white/5 bg-surface-low py-4 overflow-hidden relative">
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #0a0a0a 0%, transparent 10%, transparent 90%, #0a0a0a 100%)' }}></div>
        <div className="animate-marquee flex items-center justify-around">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 whitespace-nowrap px-6">
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest"><Star size={16} className="text-brand-primary" /> Trusted By Champions</span>
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest"><Star size={16} className="text-brand-primary" /> Engineered For Performance</span>
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest"><Star size={16} className="text-brand-primary" /> Official Kinetic Gear</span>
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest"><Star size={16} className="text-brand-primary" /> Over 10,000+ Kits Sold</span>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          SECTION 3: SHOP BY CLUB (Collections)
      ========================================= */}
      <section className="py-24 bg-surface-base border-b border-white/5 overflow-hidden min-h-[720px]">
          <div className="max-w-[1800px] mx-auto px-6">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-2 text-brand-primary mb-3">
                  <Shield size={20} strokeWidth={2.5} />
                  <span className="text-sm font-bold uppercase tracking-[0.2em] opacity-90">Official Partners</span>
                </div>
                <h2 className="kinetic-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-wider drop-shadow-sm">
                  Shop By Club
                </h2>
              </div>
            </div>

            {/* Slider Container with Mask & Arrows */}
            <div className="relative group">
              
              {/* Left Arrow */}
              <button 
                onClick={scrollCollectionLeft} 
                disabled={loading || collections.length < 2}
                className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-surface-deep/60 backdrop-blur-2xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary/50 hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] disabled:opacity-0 disabled:pointer-events-none"
              >
                <ChevronLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>

              {/* Edge Masking Wrapper */}
              <div 
                className="w-full relative"
                style={{
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
                  maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)'
                }}
              >
                {/* Scrollable Track */}
                <div 
                  ref={collectionScrollRef}
                  onScroll={handleCollectionScroll}
                  className="flex overflow-x-auto gap-8 pb-10 pt-4 snap-x snap-mandatory scroll-smooth" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <CollectionCardSkeleton key={`club-skeleton-${index}`} />
                    ))
                  ) : collections.length > 0 ? (
                    collections.map((club) => (
                      <Link 
                        key={`club-${club.id}`} 
                        to={`/collection/${getCollectionSlug(club)}`} 
                        className="group/card relative flex-none w-[280px] h-[380px] md:w-[300px] md:h-[400px] rounded-3xl overflow-hidden snap-center bg-[#0d0d0d] border border-white/5 transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] hover:border-brand-primary/30 hover:shadow-[0_10px_40px_rgba(194,243,91,0.15)] hover:-translate-y-2"
                      >
                        {/* Background Ambient Glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] opacity-50 group-hover/card:opacity-100 transition-opacity duration-700"></div>

                        {/* Centered Logo Container */}
                        <div className="absolute inset-0 flex items-center justify-center p-12 pb-24 z-0">
                          <img 
                            src={club.logoUrl || club.logo_url || 'https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=800&auto=format&fit=crop'} 
                            alt={club.collectionName} 
                            width="400"
                            height="400"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain opacity-40 group-hover/card:opacity-80 transition-all duration-700 group-hover/card:scale-110 group-hover/card:drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] ease-[cubic-bezier(0.33,1,0.68,1)]"
                          />
                        </div>
                        
                        {/* Deep Cinematic Gradient for Text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent h-full z-10 opacity-90"></div>

                        {/* Content Container */}
                        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end z-20">
                          <h3 className="kinetic-heading text-3xl md:text-2xl text-white uppercase mb-2 group-hover/card:-translate-y-1 transition-transform duration-500 ease-out drop-shadow-md">
                            {club.collectionName}
                          </h3>
                          
                          <p className="text-text-secondary text-sm font-inter line-clamp-2 mb-4 group-hover/card:-translate-y-1 transition-transform duration-500 delay-75 ease-out opacity-80">
                            {club.description || 'Explore the official collection.'}
                          </p>
                          
                          {/* Animated Explore Button */}
                          <div className="flex items-center gap-2 text-brand-primary font-bold uppercase tracking-[0.2em] text-xs mt-2 overflow-hidden">
                            <span className="transform translate-y-full opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500 delay-100">
                              Explore Gear
                            </span>
                            <ArrowRight 
                              size={16} 
                              strokeWidth={2.5} 
                              className="transform -translate-x-4 opacity-0 group-hover/card:translate-x-0 group-hover/card:opacity-100 transition-all duration-500 delay-150" 
                            />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="flex-none w-full min-h-[400px] rounded-3xl border border-white/5 bg-surface-low flex items-center justify-center text-text-secondary font-inter">
                      Collections will appear here soon.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Arrow */}
              <button 
                onClick={scrollCollectionRight} 
                disabled={loading || collections.length < 2}
                className="absolute -right-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-surface-deep/60 backdrop-blur-2xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary/50 hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] disabled:opacity-0 disabled:pointer-events-none"
              >
                <ChevronRight size={24} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>

            {/* Dynamic Pagination Dots */}
            <div className="flex justify-center gap-2 mt-4 min-h-2">
              {[...Array(collectionDotCount)].map((_, index) => (
                <div 
                  key={index} 
                  className={`transition-all duration-500 ease-out rounded-full h-1.5 ${
                    index === activeCollectionDotIndex 
                      ? 'w-10 bg-brand-primary shadow-[0_0_12px_rgba(194,243,91,0.6)]' 
                      : 'w-2 bg-white/10 hover:bg-white/30 cursor-pointer'
                  }`} 
                />
              ))}
            </div>

          </div>
        </section>

      {/* =========================================
          SECTION 4: BEST SELLERS
      ========================================= */}
      <section className="py-24 bg-surface-base border-b border-white/5 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="kinetic-heading text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-wider drop-shadow-sm mb-4">
              Best Sellers
            </h2>
            <div className="w-24 h-1 bg-brand-primary mb-6 shadow-[0_0_15px_rgba(194,243,91,0.5)]"></div>
            <p className="text-text-secondary font-inter uppercase tracking-[0.2em] text-sm font-bold opacity-80">
              The Gear Everyone Is Talking About
            </p>
          </div>

          {/* Slider Container */}
          <div className="relative group">
            
            {/* Left Arrow (Hidden on Mobile) */}
            <button 
              onClick={scrollBestSellersLeft} 
              className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-surface-deep/60 backdrop-blur-2xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary/50 hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <ChevronLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Edge Masking Wrapper */}
            <div 
              className="w-full relative"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
                maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)'
              }}
            >
              {/* Scrollable Track */}
              <div 
                ref={bestSellersScrollRef}
                onScroll={handleBestSellerScroll}
                className="flex overflow-x-auto gap-6 md:gap-8 pb-10 pt-4 snap-x snap-mandatory scroll-smooth" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={`best-skeleton-${index}`} className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center">
                      <ProductCardSkeleton />
                    </div>
                  ))
                ) : (
                  bestSellers.map(product => (
                    <div key={`best-${product.id}`} className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center">
                      <ProductCard product={product} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Arrow (Hidden on Mobile) */}
            <button 
              onClick={scrollBestSellersRight} 
              className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-surface-deep/60 backdrop-blur-2xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary/50 hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <ChevronRight size={24} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

          </div>

          {/* Dynamic Pagination Dots */}
          {!loading && bestSellers.length > 0 && (
            <div className="flex justify-center gap-2 mt-2">
              {[...Array(bestSellerDotCount)].map((_, index) => (
                <div 
                  key={`dot-${index}`} 
                  className={`transition-all duration-500 ease-out rounded-full h-1.5 ${
                    index === activeBestSellerDotIndex 
                      ? 'w-10 bg-brand-primary shadow-[0_0_12px_rgba(194,243,91,0.6)]' 
                      : 'w-2 bg-white/10 hover:bg-white/30 cursor-pointer'
                  }`} 
                  // Optional: Make dots clickable to jump to that item
                  onClick={() => {
                    if (bestSellersScrollRef.current) {
                      const cardWidth = window.innerWidth < 768 ? window.innerWidth * 0.85 : 350;
                      bestSellersScrollRef.current.scrollTo({ left: index * (cardWidth + 24), behavior: 'smooth' });
                    }
                  }}
                />
              ))}
            </div>
          )}

        </div>
      </section>
      {/* =========================================
          SECTION 5: WEAR FOR PASSION
      ========================================= */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto w-full border-b border-white/5 overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="kinetic-heading text-4xl sm:text-5xl md:text-6xl uppercase text-white mb-2">Wear For Passion</h2>
            <p className="text-brand-primary font-inter uppercase tracking-widest text-sm font-bold">Represent Your Club Colours</p>
          </div>
          <Link to="/category/home-kits" className="btn-secondary hidden md:flex items-center gap-2">
            Shop All Clubs <ArrowRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div 
            className="flex md:grid md:grid-cols-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 md:gap-6 pb-8 md:pb-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {Array.from({ length: 5 }).map((_, index) => {
              const gridSpan = index < 2 ? 'md:col-span-3' : 'md:col-span-2';
              return (
                <div key={`passion-skeleton-${index}`} className={`shrink-0 w-[80vw] sm:w-[50vw] md:w-auto snap-start ${gridSpan}`}>
                  <ProductCardSkeleton />
                </div>
              );
            })}
          </div>
        ) : (
          <div 
            className="flex md:grid md:grid-cols-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 md:gap-6 pb-8 md:pb-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {passionClubs.map((product, index) => {
              const gridSpan = index < 2 ? 'md:col-span-3' : 'md:col-span-2';
              return (
                <div key={`passion-${product.id}`} className={`shrink-0 w-[80vw] sm:w-[50vw] md:w-auto snap-start ${gridSpan}`}>
                  <ProductCard product={product} />
                </div>
              );
            })}
          </div>
        )}
        
        <Link to="/category/home-kits" className="btn-secondary mt-10 w-full flex md:hidden items-center justify-center gap-2">
          Shop All Clubs <ArrowRight size={18} />
        </Link>
      </section>

      {/* =========================================
          SECTION 6: TOP 10 TRENDING SLIDER
      ========================================= */}
      <section className="py-24 px-6 relative max-w-[1400px] mx-auto w-full">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="kinetic-heading text-3xl sm:text-4xl md:text-5xl uppercase text-white mb-2">Trending Kits</h2>
            <p className="text-text-secondary font-inter uppercase tracking-widest text-sm font-bold">Top 10 Most Cop'd This Week</p>
          </div>
        </div>
        
        {loading ? (
          <div className="relative group">
            <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory hide-scrollbar pb-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`trend-skeleton-${index}`} className="snap-start shrink-0 w-[85vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(dotCount)].map((_, index) => (
                <div key={index} className="transition-all duration-300 rounded-full h-1.5 w-2 bg-white/20" />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative group">
            <button onClick={scrollTrendingLeft} className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-surface-high/80 text-white hover:bg-brand-primary hover:text-black transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block shadow-xl hover:scale-110">
              <ChevronLeft size={24} />
            </button>

            <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto gap-6 snap-x snap-mandatory hide-scrollbar pb-10 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {trendingKits.map((product) => (
                <div key={`trend-${product.id}`} className="snap-start shrink-0 w-[85vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <button onClick={scrollTrendingRight} className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-surface-high/80 text-white hover:bg-brand-primary hover:text-black transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block shadow-xl hover:scale-110">
              <ChevronRight size={24} />
            </button>

            <div className="flex justify-center gap-2 mt-4">
              {[...Array(dotCount)].map((_, index) => (
                <div key={index} className={`transition-all duration-300 rounded-full h-1.5 ${index === activeDotIndex ? 'w-8 bg-brand-primary' : 'w-2 bg-white/20'}`} />
              ))}
            </div>
          </div>
        )}
      </section>

      <HomeVideoCta />
      <TrustMarquee />

    </div>
  );
};

export default HomePage;