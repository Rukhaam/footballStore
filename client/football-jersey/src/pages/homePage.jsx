import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Star,
  Shield,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import api from "../services/api";
import ProductCard from "../components/productCard";
import HomeVideoCta from "../components/homeVideoCta";
import { HERO_SLIDES } from "../utils/constants";
import { getCollectionSlug } from "../utils/slugify";
import TrustMarquee from "../components/trustMarquee";
import BrandManifesto from "../components/brandManifesto";

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

// UPDATED SKELETON: Matches the new clean layout with no box
const CollectionCardSkeleton = () => (
  <div className="relative flex-none w-[240px] md:w-[280px] flex flex-col gap-6 snap-center animate-pulse">
    <div className="w-full h-[240px] md:h-[280px] bg-surface-high/20 rounded-full"></div>
    <div className="flex flex-col items-center text-center gap-3">
      <div className="h-6 w-3/4 rounded bg-surface-high/60"></div>
      <div className="h-3 w-10/12 rounded bg-surface-high/40"></div>
    </div>
  </div>
);

// --- Custom Hook for Intersection Observer ---
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      { threshold: 0.1, ...options },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) observer.unobserve(elementRef.current);
    };
  }, [options]);

  return [elementRef, isIntersecting];
};

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

  // --- Observer Refs for Animation Triggers ---
  const [clubsRef, clubsVisible] = useIntersectionObserver();
  const [bestSellersSectionRef, bestSellersVisible] = useIntersectionObserver();
  const [passionRef, passionVisible] = useIntersectionObserver();
  const [trendingRef, trendingVisible] = useIntersectionObserver();
  const [ctaRef, ctaVisible] = useIntersectionObserver();
const [manifestoRef, manifestoVisible] = useIntersectionObserver();
  // --- 1. HERO AUTO-PLAY & CONTROLS ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextHeroSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevHeroSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));

  // --- 2. FETCH DATA (Jerseys & Collections) ---
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const jerseyRes = await api.get("/store/jerseys");
        const allJerseys = jerseyRes.data.data || jerseyRes.data || [];
        setBestSellers(
          allJerseys.length >= 5 ? allJerseys.slice(0, 5) : allJerseys,
        );
        setPassionClubs(
          allJerseys.length >= 10 ? allJerseys.slice(5, 10) : allJerseys,
        );
        setTrendingKits(
          allJerseys.length >= 20 ? allJerseys.slice(10, 20) : allJerseys,
        );

        const collectionsRes = await api.get("/store/collections");
        setCollections(collectionsRes.data);
      } catch (err) {
        console.error("Failed to load store data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, []);

  // --- SLIDER LOGIC (Best Sellers) ---
  const bestSellersScrollRef = useRef(null);
  const [activeBestSellerDotIndex, setActiveBestSellerDotIndex] = useState(0);
  const bestSellerDotCount = bestSellers.length;

  const handleBestSellerScroll = () => {
    if (!bestSellersScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } =
      bestSellersScrollRef.current;
    if (scrollWidth <= clientWidth) {
      setActiveBestSellerDotIndex(0);
      return;
    }
    const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
    const newIndex = Math.round(scrollPercentage * (bestSellerDotCount - 1));
    setActiveBestSellerDotIndex(newIndex);
  };

  const scrollBestSellersLeft = () =>
    bestSellersScrollRef.current?.scrollBy({
      left: window.innerWidth < 768 ? -300 : -400,
      behavior: "smooth",
    });
  const scrollBestSellersRight = () =>
    bestSellersScrollRef.current?.scrollBy({
      left: window.innerWidth < 768 ? 300 : 400,
      behavior: "smooth",
    });

  // --- SLIDER LOGIC (Collections) ---
  const collectionScrollRef = useRef(null);
  const [collectionScrollProgress, setCollectionScrollProgress] = useState(0);

  const handleCollectionScroll = () => {
    if (collectionScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        collectionScrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) setCollectionScrollProgress(scrollLeft / maxScroll);
    }
  };

  const scrollCollectionLeft = () =>
    collectionScrollRef.current?.scrollBy({
      left: -collectionScrollRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  const scrollCollectionRight = () =>
    collectionScrollRef.current?.scrollBy({
      left: collectionScrollRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });

  const collectionDotCount = loading
    ? 4
    : Math.min(5, Math.max(1, collections.length));
  const activeCollectionDotIndex =
    !loading && collections.length > 0
      ? Math.min(
          collectionDotCount - 1,
          Math.max(
            0,
            Math.round(collectionScrollProgress * (collectionDotCount - 1)),
          ),
        )
      : 0;

  // --- SLIDER LOGIC (Passion) ---
  const passionScrollRef = useRef(null);
  const [activePassionDotIndex, setActivePassionDotIndex] = useState(0);
  const passionDotCount = passionClubs.length;

  const handlePassionScroll = () => {
    if (!passionScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = passionScrollRef.current;
    if (scrollWidth <= clientWidth) {
      setActivePassionDotIndex(0);
      return;
    }
    const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
    const newIndex = Math.round(scrollPercentage * (passionDotCount - 1));
    setActivePassionDotIndex(newIndex);
  };

  const scrollPassionLeft = () =>
    passionScrollRef.current?.scrollBy({
      left: window.innerWidth < 768 ? -300 : -400,
      behavior: "smooth",
    });
  const scrollPassionRight = () =>
    passionScrollRef.current?.scrollBy({
      left: window.innerWidth < 768 ? 300 : 400,
      behavior: "smooth",
    });

  // --- SLIDER LOGIC (Trending) ---
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) setScrollProgress(scrollLeft / maxScroll);
    }
  };

  const scrollTrendingLeft = () =>
    scrollRef.current?.scrollBy({
      left: -scrollRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  const scrollTrendingRight = () =>
    scrollRef.current?.scrollBy({
      left: scrollRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });

  const dotCount = 5;
  const activeDotIndex = Math.min(
    dotCount - 1,
    Math.max(0, Math.round(scrollProgress * (dotCount - 1))),
  );
  const firstHeroImage = HERO_SLIDES[0]?.image;

  return (
    <div className="flex flex-col w-full overflow-hidden bg-surface-base">
      <Helmet>
        <title>Kinetic Store | Premium Football Jerseys & Gear</title>
        <meta
          name="description"
          content="Shop the latest 2024/25 football kits, retro classic jerseys, and premium fan gear at Kinetic Store. Engineered for performance, worn with passion."
        />
        <meta
          property="og:title"
          content="Kinetic Store | Premium Football Jerseys"
        />
        <meta
          property="og:description"
          content="Shop the latest 2024/25 football kits and premium fan gear at Kinetic Store."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta
          property="og:image"
          content="https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=1200&auto=format&fit=crop"
        />
        {firstHeroImage && (
          <link
            rel="preload"
            as="image"
            href={firstHeroImage}
            fetchpriority="high"
          />
        )}
      </Helmet>

      {/* =========================================
          SECTION 1: HERO CAROUSEL
      ========================================= */}
      <section className="relative w-full h-[100svh] min-h-[560px] md:min-h-[640px] overflow-hidden group border-b border-white/5">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              width="1920"
              height="1080"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[10000ms] ${index === currentSlide ? "scale-105" : "scale-100"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-base/95 via-surface-base/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-transparent to-transparent opacity-80"></div>

            <div className="relative z-20 max-w-7xl mx-auto px-6 h-full flex items-center pt-24">
              <div className="w-full md:w-2/3 lg:w-1/2 pt-6 md:pt-10">
                <div
                  className={`transition-all duration-700 delay-300 ${index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                  <div className="inline-block px-3 py-1 mb-4 md:mb-6 border border-brand-primary/30 bg-brand-primary/10 text-brand-primary font-inter text-xs font-bold uppercase tracking-widest rounded-full">
                    {slide.chip}
                  </div>
                  <div className="min-h-[280px] sm:min-h-[320px] md:min-h-[360px]">
                    <h1 className="kinetic-heading text-[clamp(2.4rem,11vw,4rem)] md:text-7xl lg:text-8xl leading-[0.92] mb-5 md:mb-6 uppercase text-white drop-shadow-lg">
                      {slide.title} <br />
                      <span className="text-brand-primary">
                        {slide.titleHighlight}
                      </span>
                    </h1>
                    <p className="kinetic-body text-base sm:text-lg md:text-xl mb-8 md:mb-10 max-w-md text-text-secondary leading-relaxed min-h-[72px] md:min-h-[84px] drop-shadow-md">
                      {slide.desc}
                    </p>
                  </div>
                  <Link
                    to={slide.link}
                    className="btn-primary py-4 px-8 inline-flex items-center gap-2"
                  >
                    Explore Collection <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={prevHeroSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 text-white hover:bg-brand-primary hover:text-black transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block hover:scale-110"
        >
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>
        <button
          onClick={nextHeroSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 text-white hover:bg-brand-primary hover:text-black transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:block hover:scale-110"
        >
          <ChevronRight size={28} strokeWidth={1.5} />
        </button>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full h-2 ${index === currentSlide ? "w-10 bg-brand-primary" : "w-2 bg-white/30 hover:bg-white/50"}`}
            />
          ))}
        </div>
      </section>

      {/* =========================================
          SECTION 2: EDGE-MASKED MARQUEE
      ========================================= */}
      <section className=" bg-[#050505] py-4 overflow-hidden relative z-10">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #050505 0%, transparent 10%, transparent 90%, #050505 100%)",
          }}
        ></div>
        <div className="animate-marquee flex items-center justify-around">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-12 whitespace-nowrap px-6"
            >
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest">
                <Star size={16} className="text-brand-primary" /> Trusted By
                Champions
              </span>
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest">
                <Star size={16} className="text-brand-primary" /> Engineered For
                Performance
              </span>
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest">
                <Star size={16} className="text-brand-primary" /> Official
                Kinetic Gear
              </span>
              <span className="flex items-center gap-2 text-text-secondary font-inter text-sm font-bold uppercase tracking-widest">
                <Star size={16} className="text-brand-primary" /> Over 10,000+
                Kits Sold
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          SECTION 3: SHOP BY CLUB (Cinematic & Clean)
      ========================================= */}
      <section
        ref={clubsRef}
        className="relative w-full min-h-[600px] md:min-h-[700px] overflow-hidden border-b border-white/5"
      >
        <div
          className={`absolute inset-0 w-full h-full z-0 parallax-bg animate-reveal-left ${clubsVisible ? "is-visible" : ""}`}
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=2000&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent opacity-90"></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-20 max-w-[1800px] mx-auto px-6 py-20 flex flex-col h-full justify-center">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2 text-brand-primary mb-3">
                <Shield size={20} strokeWidth={2.5} />
                <span className="text-sm font-bold uppercase tracking-[0.2em] opacity-90">
                  Official Partners
                </span>
              </div>
              <h2 className="kinetic-heading text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-wider drop-shadow-lg">
                Shop By Club
              </h2>
            </div>
            <Link
              to="/category/all"
              className="btn-primary py-3 px-6 hidden md:flex items-center gap-2 border-none"
            >
              View All Clubs <ArrowRight size={18} />
            </Link>
          </div>

          <div className="relative group mt-4">
            <button
              onClick={scrollCollectionLeft}
              disabled={loading || collections.length < 2}
              className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft
                size={24}
                strokeWidth={2.5}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>

            <div
              className="w-full relative"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
                maskImage:
                  "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
              }}
            >
              <div
                ref={collectionScrollRef}
                onScroll={handleCollectionScroll}
                className="flex overflow-x-auto gap-8 pb-8 pt-4 snap-x snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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
                      className="group/card relative flex-none w-[240px] md:w-[280px] flex flex-col gap-6 snap-center cursor-pointer"
                    >
                      {/* Clean Image Container (No Background Box) */}
                      <div className="w-full h-[240px] md:h-[280px] flex items-center justify-center p-4 transition-transform duration-500 group-hover/card:-translate-y-3 group-active/card:-translate-y-3">
                        <img
                          src={
                            club.logoUrl ||
                            club.logo_url ||
                            "https://via.placeholder.com/150"
                          }
                          alt={club.collectionName}
                          loading="lazy"
                          className="w-full h-full object-contain opacity-80 group-hover/card:opacity-100 group-active/card:opacity-100 transition-all duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover/card:drop-shadow-[0_10px_30px_rgba(194,243,91,0.2)] group-active/card:drop-shadow-[0_10px_30px_rgba(194,243,91,0.2)]"
                        />
                      </div>

                      {/* Text Container Below Image */}
                      <div className="flex flex-col items-center text-center px-2">
                        {/* Title with Expanding Underline */}
                        <h3 className="kinetic-heading text-2xl md:text-3xl text-white uppercase mb-3 relative inline-block pb-1">
                          {club.collectionName}
                          <span className="absolute left-1/2 bottom-0 h-[2px] w-0 bg-brand-primary -translate-x-1/2 transition-all duration-500 group-hover/card:w-full group-active/card:w-full shadow-[0_0_10px_rgba(194,243,91,0.5)]"></span>
                        </h3>
                        <p className="text-text-secondary text-sm font-inter line-clamp-2 opacity-80 group-hover/card:opacity-100 transition-opacity duration-500">
                          {club.description || "Explore the official collection."}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex-none w-full min-h-[400px] flex items-center justify-center text-text-secondary font-inter">
                    Collections will appear here soon.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={scrollCollectionRight}
              disabled={loading || collections.length < 2}
              className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronRight
                size={24}
                strokeWidth={2.5}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-4 min-h-2 relative z-30">
            {[...Array(collectionDotCount)].map((_, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ease-out rounded-full h-1.5 ${index === activeCollectionDotIndex ? "w-10 bg-brand-primary shadow-[0_0_12px_rgba(194,243,91,0.6)]" : "w-2 bg-white/20 hover:bg-white/40 cursor-pointer"}`}
              />
            ))}
          </div>

          <Link
            to="/category/all"
            className="btn-secondary mt-10 w-full flex md:hidden items-center justify-center gap-2 relative z-30 border-white/20 hover:border-brand-primary/50 bg-black/40 backdrop-blur-md"
          >
            View All Clubs <ArrowRight size={18} />
          </Link>
        </div>
      </section>

<BrandManifesto sectionRef={manifestoRef} isVisible={manifestoVisible} />
      {/* =========================================
          SECTION 4: BEST SELLERS (Cinematic)
      ========================================= */}
      <section
        ref={bestSellersSectionRef}
        className="relative w-full min-h-[600px] md:min-h-[700px] overflow-hidden border-b border-white/5"
      >
        <div
          className={`absolute inset-0 w-full h-full z-0 parallax-bg animate-reveal-right ${bestSellersVisible ? "is-visible" : ""}`}
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=2000&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/60 to-[#050505]/95"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90"></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"></div>
        </div>

        <div className="relative z-20 max-w-[1800px] mx-auto px-6 py-20 flex flex-col h-full justify-center">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="kinetic-heading text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-wider drop-shadow-xl mb-4">
              Best Sellers
            </h2>
            <div className="w-24 h-1 bg-brand-primary mb-6 shadow-[0_0_15px_rgba(194,243,91,0.5)]"></div>
            <p className="text-text-secondary font-inter uppercase tracking-[0.2em] text-sm font-bold opacity-90 drop-shadow-md">
              The Gear Everyone Is Talking About
            </p>
          </div>

          <div className="relative group">
            <button
              onClick={scrollBestSellersLeft}
              className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            >
              <ChevronLeft
                size={24}
                strokeWidth={2.5}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>

            <div
              className="w-full relative"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
                maskImage:
                  "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
              }}
            >
              <div
                ref={bestSellersScrollRef}
                onScroll={handleBestSellerScroll}
                className="flex overflow-x-auto gap-6 md:gap-8 pb-10 pt-4 snap-x snap-mandatory scroll-smooth relative z-20"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`best-skeleton-${index}`}
                        className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center"
                      >
                        <ProductCardSkeleton />
                      </div>
                    ))
                  : bestSellers.map((product) => (
                      <div
                        key={`best-${product.id}`}
                        className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center hover:-translate-y-2 transition-transform duration-500"
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
              </div>
            </div>

            <button
              onClick={scrollBestSellersRight}
              className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            >
              <ChevronRight
                size={24}
                strokeWidth={2.5}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>

          {!loading && bestSellers.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 relative z-30">
              {[...Array(bestSellerDotCount)].map((_, index) => (
                <div
                  key={`dot-${index}`}
                  className={`transition-all duration-500 ease-out rounded-full h-1.5 ${index === activeBestSellerDotIndex ? "w-10 bg-brand-primary shadow-[0_0_12px_rgba(194,243,91,0.6)]" : "w-2 bg-white/20 hover:bg-white/40 cursor-pointer"}`}
                  onClick={() => {
                    if (bestSellersScrollRef.current)
                      bestSellersScrollRef.current.scrollTo({
                        left:
                          index *
                          (window.innerWidth < 768
                            ? window.innerWidth * 0.85 + 24
                            : 374),
                        behavior: "smooth",
                      });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          SECTION 5: WEAR FOR PASSION (Cinematic)
      ========================================= */}
      <section
        ref={passionRef}
        className="relative w-full min-h-[600px] md:min-h-[700px] overflow-hidden border-b border-white/5"
      >
        <div
          className={`absolute inset-0 w-full h-full z-0 parallax-bg animate-reveal-up ${passionVisible ? "is-visible" : ""}`}
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/50 to-[#050505]/95"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] opacity-90"></div>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"></div>
        </div>

        <div className="relative z-20 max-w-[1800px] mx-auto px-6 py-20 flex flex-col h-full justify-center">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="kinetic-heading text-4xl sm:text-5xl md:text-6xl uppercase text-white mb-2 drop-shadow-xl">
                Wear For Passion
              </h2>
              <div className="w-16 h-1 bg-brand-primary mb-4 shadow-[0_0_15px_rgba(194,243,91,0.5)]"></div>
              <p className="text-white/80 font-inter uppercase tracking-widest text-sm font-bold">
                Represent Your Club Colours
              </p>
            </div>
            <Link
              to="/category/home-kits"
              className="btn-secondary hidden md:flex items-center gap-2 border-white/20 hover:border-brand-primary/50 bg-black/40 backdrop-blur-md"
            >
              Shop All Clubs <ArrowRight size={18} />
            </Link>
          </div>

          <div className="relative group">
            <button
              onClick={scrollPassionLeft}
              className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            >
              <ChevronLeft
                size={24}
                strokeWidth={2.5}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>

            <div
              className="w-full relative"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
                maskImage:
                  "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
              }}
            >
              <div
                ref={passionScrollRef}
                onScroll={handlePassionScroll}
                className="flex overflow-x-auto gap-6 md:gap-8 pb-10 pt-4 snap-x snap-mandatory scroll-smooth relative z-20"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`passion-skeleton-${index}`}
                        className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center"
                      >
                        <ProductCardSkeleton />
                      </div>
                    ))
                  : passionClubs.map((product) => (
                      <div
                        key={`passion-${product.id}`}
                        className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center hover:-translate-y-2 transition-transform duration-500"
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
              </div>
            </div>

            <button
              onClick={scrollPassionRight}
              className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            >
              <ChevronRight
                size={24}
                strokeWidth={2.5}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>

          {!loading && passionClubs.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 relative z-30">
              {[...Array(passionDotCount)].map((_, index) => (
                <div
                  key={`passion-dot-${index}`}
                  className={`transition-all duration-500 ease-out rounded-full h-1.5 ${index === activePassionDotIndex ? "w-10 bg-brand-primary shadow-[0_0_12px_rgba(194,243,91,0.6)]" : "w-2 bg-white/20 hover:bg-white/40 cursor-pointer"}`}
                  onClick={() => {
                    if (passionScrollRef.current)
                      passionScrollRef.current.scrollTo({
                        left:
                          index *
                          (window.innerWidth < 768
                            ? window.innerWidth * 0.85 + 24
                            : 374),
                        behavior: "smooth",
                      });
                  }}
                />
              ))}
            </div>
          )}

          <Link
            to="/category/home-kits"
            className="btn-secondary mt-10 w-full flex md:hidden items-center justify-center gap-2 border-white/20 bg-black/40 backdrop-blur-md relative z-30"
          >
            Shop All Clubs <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* =========================================
          SECTION 6: TOP 10 TRENDING SLIDER (Cinematic)
      ========================================= */}
      <section
        ref={trendingRef}
        className="relative w-full min-h-[600px] md:min-h-[700px] overflow-hidden border-b border-white/5"
      >
        <div
          className={`absolute inset-0 w-full h-full z-0 parallax-bg animate-reveal-left ${trendingVisible ? "is-visible" : ""}`}
          style={{
            backgroundImage: `url('https://fulltimestore.in/cdn/shop/files/kitsmain2-min.jpg?v=1760299935&width=1800')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/60 to-[#050505]/95"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/30 to-[#050505] opacity-90"></div>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"></div>
        </div>

        <div className="relative z-20 max-w-[1800px] mx-auto px-6 py-20 flex flex-col h-full justify-center">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="kinetic-heading text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-wider drop-shadow-xl mb-4">
              Trending Kits
            </h2>
            <div className="w-24 h-1 bg-brand-primary mb-6 shadow-[0_0_15px_rgba(194,243,91,0.5)]"></div>
            <p className="text-text-secondary font-inter uppercase tracking-[0.2em] text-sm font-bold opacity-90 drop-shadow-md">
              Top 10 Most Cop'd This Week
            </p>
          </div>

          <div className="relative group">
            <button
              onClick={scrollTrendingLeft}
              className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            >
              <ChevronLeft
                size={24}
                strokeWidth={2.5}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>

            <div
              className="w-full relative"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
                maskImage:
                  "linear-gradient(to right, transparent, black 2%, black 98%, transparent)",
              }}
            >
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto gap-6 md:gap-8 pb-10 pt-4 snap-x snap-mandatory scroll-smooth relative z-20"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`trend-skeleton-${index}`}
                        className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center"
                      >
                        <ProductCardSkeleton />
                      </div>
                    ))
                  : trendingKits.map((product) => (
                      <div
                        key={`trend-${product.id}`}
                        className="flex-none w-[85vw] sm:w-[320px] md:w-[350px] lg:w-[380px] snap-center hover:-translate-y-2 transition-transform duration-500"
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
              </div>
            </div>

            <button
              onClick={scrollTrendingRight}
              className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-brand-primary hover:text-black hover:scale-110 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            >
              <ChevronRight
                size={24}
                strokeWidth={2.5}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>

          {!loading && trendingKits.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 relative z-30">
              {[...Array(dotCount)].map((_, index) => (
                <div
                  key={`trend-dot-${index}`}
                  className={`transition-all duration-500 ease-out rounded-full h-1.5 ${index === activeDotIndex ? "w-10 bg-brand-primary shadow-[0_0_12px_rgba(194,243,91,0.6)]" : "w-2 bg-white/20 hover:bg-white/40 cursor-pointer"}`}
                  onClick={() => {
                    if (scrollRef.current)
                      scrollRef.current.scrollTo({
                        left:
                          index *
                          (window.innerWidth < 768
                            ? window.innerWidth * 0.85 + 24
                            : 374),
                        behavior: "smooth",
                      });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          SECTION 7: VIDEO CTA (Cinematic)
      ========================================= */}
      <section
        ref={ctaRef}
        className="relative w-full overflow-hidden border-b border-white/5"
      >
        <div
          className={`absolute inset-0 w-full h-full z-0 parallax-bg animate-reveal-up ${ctaVisible ? "is-visible" : ""}`}
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1508344928928-7137b29de216?q=80&w=2000&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/40 to-[#050505]/95"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/20 to-[#050505] opacity-90"></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"></div>
        </div>

        <div className="relative z-20 w-full h-full">
          <HomeVideoCta />
        </div>
      </section>

      <TrustMarquee />
    </div>
  );
};

export default HomePage;