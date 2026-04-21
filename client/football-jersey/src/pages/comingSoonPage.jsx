import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, HardHat, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const ComingSoonPage = () => {
  // This grabs the wrong URL the user tried to visit so we can show it to them
  const location = useLocation();

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center p-6 overflow-hidden w-full bg-[#050505]">
      
      {/* Dynamic SEO */}
      <Helmet>
        <title>Coming Soon | Kinetic Store</title>
        <meta name="robots" content="noindex" /> {/* Tells Google not to index broken links */}
      </Helmet>

      {/* Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
        
        {/* Floating Icon */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-700"></div>
          <div className="relative w-24 h-24 bg-surface-deep border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-all duration-500">
            <HardHat className="text-brand-primary" size={40} strokeWidth={1.5} />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="kinetic-heading text-6xl md:text-8xl text-white tracking-tighter uppercase mb-4 drop-shadow-lg">
          Coming <span className="text-brand-primary">Soon</span>
        </h1>
        
        <p className="text-text-secondary font-inter text-lg md:text-xl mb-8 max-w-lg leading-relaxed">
          The developers are still building this section of the Arena. New gear and features are dropping shortly.
        </p>

        {/* Show them the broken path they tried to hit */}
        <div className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400/80 px-4 py-2 rounded-xl text-sm mb-10 font-inter font-medium">
          <AlertTriangle size={16} />
          <span>Route <strong className="text-red-400">{location.pathname}</strong> does not exist yet.</span>
        </div>

        {/* Action Button */}
        <Link 
          to="/" 
          className="btn-primary py-4 px-8 rounded-2xl flex items-center justify-center gap-3 group hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(194,243,91,0.2)]"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-[0.2em] font-black uppercase">Return to Arena</span>
        </Link>
        
      </div>
    </div>
  );
};

export default ComingSoonPage;