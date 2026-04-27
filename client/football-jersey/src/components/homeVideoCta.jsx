import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA_VIDEO_URL =
  "https://pub-749dd85c25e04947af34140aef9172fc.r2.dev/IMAGES/cdn-kinetic/stock-footage-bangkok-thailand-october-adidas-launch-trionda-the-official-match-ball-for-fifa-world.mp4";
const CTA_POSTER_URL =
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop";

const HomeVideoCta = () => {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className="py-24 px-6 relative max-w-[1400px] mx-auto w-full">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 min-h-[380px] md:min-h-[440px] bg-surface-low shadow-[0_20px_80px_rgba(0,0,0,0.45)] group">
        {!videoFailed ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={CTA_POSTER_URL}
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          >
            <source src={CTA_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${CTA_POSTER_URL})` }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(194,243,91,0.25),transparent_55%)]" />

        <div className="relative z-10 h-full flex flex-col justify-center p-8 sm:p-10 md:p-14 max-w-2xl">
          <p className="inline-flex items-center gap-2 w-max px-3 py-1 rounded-full border border-brand-primary/35 bg-brand-primary/10 text-brand-primary text-xs uppercase tracking-[0.18em] font-bold mb-5">
            <Sparkles size={14} /> New Season Drop
          </p>

          <h3 className="kinetic-heading text-4xl sm:text-5xl md:text-6xl uppercase leading-[0.92] mb-4">
            Wear The <span className="text-brand-primary">Home Colors</span>
          </h3>

          <p className="kinetic-body text-base sm:text-lg mb-8 max-w-xl">
            Match-day energy, stitched into every kit. Explore the latest Home
            Kits collection and own the tunnel walk.
          </p>

          <div>
            <Link
              to="/category/home-kits"
              className="inline-flex items-center gap-2 btn-primary px-8 py-4 text-sm sm:text-base font-bold uppercase tracking-[0.08em]"
            >
              Shop Now <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeVideoCta;
