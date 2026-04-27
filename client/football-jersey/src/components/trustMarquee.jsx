import React from 'react';
import { Award, Hand, ShieldCheck, Shirt } from 'lucide-react';

const MARQUEE_ITEMS = [
  { icon: Hand, label: 'Fan-Approved Quality' },
  { icon: Shirt, label: 'Premium, Priced Right' },
  { icon: ShieldCheck, label: 'Fresh Weekly Drops' },
  { icon: Award, label: 'Trusted Support' }
];

const TrustMarquee = () => {
  return (
    <section className="w-full border-y border-white/5 bg-[#050505]">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="trust-marquee-wrap relative overflow-hidden">
          
          {/* Updated Gradients to match the dark background seamlessly */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-20"
            style={{ backgroundImage: 'linear-gradient(to right, #050505 0%, transparent 100%)' }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-20"
            style={{ backgroundImage: 'linear-gradient(to left, #050505 0%, transparent 100%)' }}
          />

          {/* Increased vertical padding for more breathing room */}
          <div className="trust-marquee-track py-8 sm:py-12">
            {[0, 1].map((groupIndex) => (
              <div className="trust-marquee-group" key={`trust-group-${groupIndex}`}>
                {MARQUEE_ITEMS.map(({ icon: Icon, label }, itemIndex) => (
                  <div
                    className="mx-8 sm:mx-16 flex min-w-[200px] flex-col items-center text-center group"
                    key={`trust-item-${groupIndex}-${itemIndex}`}
                  >
                    {/* Scaled up the icon container, added glassmorphism and stronger neon glow */}
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 text-brand-primary shadow-[0_0_20px_rgba(194,243,91,0.15)] group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-black group-hover:shadow-[0_0_30px_rgba(194,243,91,0.4)] transition-all duration-500 ease-out">
                      <Icon size={24} strokeWidth={2} />
                    </div>
                    
                    {/* Scaled up typography and brightened the text */}
                    <p className="font-inter text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-white/80 group-hover:text-white transition-colors duration-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>

    );
};

export default TrustMarquee;