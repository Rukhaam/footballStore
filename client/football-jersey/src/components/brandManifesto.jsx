import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users } from 'lucide-react';

// Custom component to smoothly animate numbers when they scroll into view
const AnimatedCounter = ({ target, isVisible, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime;
    const updateCounter = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutQuart) for a slick slowdown at the end
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(easeProgress * target));
      
      if (progress < 1) {
        window.requestAnimationFrame(updateCounter);
      }
    };
    
    window.requestAnimationFrame(updateCounter);
  }, [target, isVisible, duration]);

  // Format with commas (e.g., 10,000)
  return <span>{count.toLocaleString()}{suffix}</span>;
};

const BrandManifesto = ({ sectionRef, isVisible }) => {
  return (
    <section 
      ref={sectionRef}
      className={`relative w-full py-20 md:py-28 overflow-hidden border-b border-white/5 animate-reveal-up ${isVisible ? 'is-visible' : ''}`}
    >
      {/* Cinematic Parallax Background */}
      <div className="absolute inset-0 w-full h-full z-0 parallax-bg" style={{ backgroundImage: `url('https://fulltimestore.in/cdn/shop/files/afa_home.png?v=1777196374&width=1200')` }}>
        {/* <div className="absolute inset-0 bg-[#050505]/80"></div> */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/60 to-[#050505]/95"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] opacity-90"></div>
        {/* Subtle blur to make text pop */}
        <div className="absolute inset-0 backdrop-blur-[4px]"></div>
      </div>
      
      {/* Ambient Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        
        {/* Small Accent Label */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-brand-primary/50"></div>
          <span className="text-brand-primary font-inter uppercase tracking-[0.3em] text-[10px] sm:text-xs font-bold">
            The Kinetic Standard
          </span>
          <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-brand-primary/50"></div>
        </div>

        {/* Main Heading (Scaled down slightly from before) */}
        <h2 className="kinetic-heading text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-wider leading-[1.1] mb-6 drop-shadow-lg">
          Engineered for the <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">
            Pitch.
          </span>{" "}
          <span className="text-brand-primary">
            Worn for the Culture.
          </span>
        </h2>

        {/* Muted Body Text (Scaled down to base/sm) */}
        <p className="text-text-secondary font-inter text-sm sm:text-base leading-relaxed max-w-2xl mx-auto opacity-80 mb-16">
          We don't just sell jerseys. We curate the armor of the modern fan. 
          From retro classics to the latest drops, every piece in the Arena is 
          authenticated, premium, and designed to make a statement.
        </p>

        {/* --- STATS & SOCIAL PROOF SECTION --- */}
        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 border-t border-white/10 pt-12">
          
          {/* Customers Stat */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-500">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(194,243,91,0.2)]">
              <Users size={20} />
            </div>
            <h3 className="kinetic-heading text-4xl sm:text-5xl text-white mb-2">
              <AnimatedCounter target={10000} isVisible={isVisible} suffix="+" />
            </h3>
            <p className="text-text-secondary font-inter text-xs font-bold uppercase tracking-widest">
              Trusted Customers
            </p>
          </div>

          {/* Brands/Clubs Stat */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-500">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(194,243,91,0.2)]">
              <ShieldCheck size={20} />
            </div>
            <h3 className="kinetic-heading text-4xl sm:text-5xl text-white mb-2">
              <AnimatedCounter target={100} isVisible={isVisible} suffix="+" />
            </h3>
            <p className="text-text-secondary font-inter text-xs font-bold uppercase tracking-widest">
              Official Partners & Clubs
            </p>
            
            {/* Brand Logos Row (Using SVG/Image Placeholders that match the dark theme) */}
            <div className="flex items-center justify-center gap-4 mt-6 opacity-40 grayscale">
              {/* Replace these URLs with actual brand logo SVGs (Nike, Adidas, Puma, etc.) */}
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" alt="Brand 1" className="h-6 object-contain invert brightness-0" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="Brand 2" className="h-4 object-contain invert brightness-0" />
              <img src="https://pub-749dd85c25e04947af34140aef9172fc.r2.dev/IMAGES/cdn-kinetic/puma-logo.svg" alt="Brand 3" className="h-5 object-contain invert brightness-0" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default BrandManifesto;