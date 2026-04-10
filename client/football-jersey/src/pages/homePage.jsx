import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ArrowRight, Star, Shield } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/productCard';
import { HERO_SLIDES } from '../utils/constants';

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
        const allJerseys = jerseyRes.data;
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
  const collectionDotCount = Math.min(5, collections.length);
  const activeCollectionDotIndex = collections.length > 0 
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

  return (
    <div className="flex flex-col w-full overflow-hidden bg-surface-base">

      {/* =========================================
          SECTION 1: HERO CAROUSEL
      ========================================= */}
      <section className="relative w-full h-[calc(100vh-80px)] overflow-hidden group border-b border-white/5">
        {HERO_SLIDES.map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src={slide.image} alt={slide.title} className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-105' : 'scale-100'}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-base/95 via-surface-base/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-transparent to-transparent opacity-80"></div>

            <div className="relative z-20 max-w-7xl mx-auto px-6 h-full flex items-center">
              <div className="w-full md:w-2/3 lg:w-1/2 pt-10">
                <div className={`transition-all duration-700 delay-300 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  <div className="inline-block px-3 py-1 mb-6 border border-brand-primary/30 bg-brand-primary/10 text-brand-primary font-inter text-xs font-bold uppercase tracking-widest rounded-full">
                    {slide.chip}
                  </div>
                  <h1 className="kinetic-heading text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-6 uppercase text-white">
                    {slide.title} <br />
                    <span className="text-brand-primary">{slide.titleHighlight}</span>
                  </h1>
                  <p className="kinetic-body text-lg md:text-xl mb-10 max-w-md text-text-secondary leading-relaxed">{slide.desc}</p>
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
   {/* =========================================
          SECTION 3: SHOP BY CLUB (Collections)
      ========================================= */}
      {collections.length > 0 && (
        <section className="py-24 bg-surface-base border-b border-white/5 overflow-hidden">
          <div className="max-w-[1800px] mx-auto px-6">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-brand-primary mb-2">
                  <Shield size={20} />
                  <span className="text-sm font-bold uppercase tracking-[0.2em]">Official Partners</span>
                </div>
                <h2 className="kinetic-heading text-4xl md:text-5xl text-white uppercase tracking-widest">
                  Shop By Club
                </h2>
              </div>
            </div>

            {/* Slider Container with Mask & Arrows */}
            <div className="relative group">
              
              {/* Left Arrow */}
              <button 
                onClick={scrollCollectionLeft} 
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-surface-deep/80 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)]"
              >
                <ChevronLeft size={24} strokeWidth={2} />
              </button>

              {/* Edge Masking Wrapper */}
              <div 
                className="w-full relative"
                style={{
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                  maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
                }}
              >
                {/* Scrollable Track */}
                <div 
                  ref={collectionScrollRef}
                  onScroll={handleCollectionScroll}
                  className="flex overflow-x-auto gap-10 pb-8 snap-x snap-mandatory scroll-smooth" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {collections.map((club) => (
                    <Link 
                      key={`club-${club.id}`} 
                      to={`/collection/${club.id}`} 
                      className="group/card relative flex-none w-[280px] h-[380px] md:w-[320px] md:h-[420px] rounded-[2rem] overflow-hidden snap-center bg-surface-deep border border-white/5 transition-all duration-500 hover:border-brand-primary/50 hover:shadow-[0_0_40px_rgba(194,243,91,0.1)]"
                    >
                      {/* Image with scaling and brightening effect */}
                      <img 
                        src={club.logoUrl || club.logo_url || 'https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=800&auto=format&fit=crop'} 
                        alt={club.collectionName} 
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover/card:opacity-70 transition-all duration-700 group-hover/card:scale-110 ease-[cubic-bezier(0.33,1,0.68,1)]"
                      />
                      
                      {/* Dual Gradients for deep contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] opacity-80 group-hover/card:opacity-100 transition-opacity duration-500"></div>

                      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                        <h3 className="kinetic-heading text-3xl text-white uppercase mb-2 group-hover/card:-translate-y-2 transition-transform duration-500 drop-shadow-lg">
                          {club.collectionName}
                        </h3>
                        <p className="text-text-secondary text-sm font-inter line-clamp-2 mb-6 group-hover/card:-translate-y-2 transition-transform duration-500 delay-75">
                          {club.description || 'Explore the official collection.'}
                        </p>
                        
                        {/* Animated Explore Tag */}
                        <div className="flex items-center gap-2 text-brand-primary font-bold uppercase tracking-widest text-xs opacity-0 -translate-x-4 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-500 delay-150">
                          Explore Gear <ArrowRight size={16} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <button 
                onClick={scrollCollectionRight} 
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-surface-deep/80 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)]"
              >
                <ChevronRight size={24} strokeWidth={2} />
              </button>

            </div>

            {/* Dynamic Pagination Dots */}
            <div className="flex justify-center gap-2 mt-2">
              {[...Array(collectionDotCount)].map((_, index) => (
                <div 
                  key={index} 
                  className={`transition-all duration-500 ease-out rounded-full h-1.5 ${
                    index === activeCollectionDotIndex 
                      ? 'w-10 bg-brand-primary shadow-[0_0_10px_rgba(194,243,91,0.5)]' 
                      : 'w-2 bg-white/20 hover:bg-white/40 cursor-pointer'
                  }`} 
                />
              ))}
            </div>

          </div>
        </section>
      )}
      {/* =========================================
          SECTION 4: BEST SELLERS
      ========================================= */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto w-full border-b border-white/5 overflow-hidden">
        <div className="text-center mb-16 flex flex-col items-center">
          <h2 className="kinetic-heading text-5xl md:text-6xl uppercase text-white mb-4">Best Sellers</h2>
          <div className="w-24 h-1 bg-brand-primary mb-6"></div>
          <p className="text-text-secondary font-inter uppercase tracking-[0.2em] text-sm font-bold text-center">The Gear Everyone Is Talking About</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div></div>
        ) : (
          <div 
            className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 md:gap-6 pb-8 md:pb-0 md:grid-cols-3 lg:grid-cols-5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {bestSellers.map(product => (
              <div key={`best-${product.id}`} className="shrink-0 w-[75vw] sm:w-[45vw] md:w-auto snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================
          SECTION 5: WEAR FOR PASSION
      ========================================= */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto w-full border-b border-white/5 overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="kinetic-heading text-5xl md:text-6xl uppercase text-white mb-2">Wear For Passion</h2>
            <p className="text-brand-primary font-inter uppercase tracking-widest text-sm font-bold">Represent Your Club Colours</p>
          </div>
          <Link to="/category/1" className="btn-secondary hidden md:flex items-center gap-2">
            Shop All Clubs <ArrowRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div></div>
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
        
        <Link to="/category/1" className="btn-secondary mt-10 w-full flex md:hidden items-center justify-center gap-2">
          Shop All Clubs <ArrowRight size={18} />
        </Link>
      </section>

      {/* =========================================
          SECTION 6: TOP 10 TRENDING SLIDER
      ========================================= */}
      <section className="py-24 px-6 relative max-w-[1400px] mx-auto w-full">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="kinetic-heading text-4xl md:text-5xl uppercase text-white mb-2">Trending Kits</h2>
            <p className="text-text-secondary font-inter uppercase tracking-widest text-sm font-bold">Top 10 Most Cop'd This Week</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div></div>
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

    </div>
  );
};

export default HomePage;