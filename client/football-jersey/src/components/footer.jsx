import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

// --- CUSTOM SOCIAL ICONS ---
// These guarantee your brand logos never break and give you the modern "X" logo
const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
// ----------------------------

const Footer = () => {
  return (
    <footer className="relative bg-[#050505] pt-24 pb-10 px-6 border-t border-white/10 mt-0 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1: Brand & Description (Spans 4 columns on large screens) */}
          <div className="lg:col-span-4 flex flex-col pr-4">
            <Link to="/" className="kinetic-heading text-4xl mb-6 block tracking-tighter drop-shadow-md">
              KINETIC<span className="text-brand-primary">.</span>
            </Link>
            <p className="text-text-secondary font-inter leading-relaxed mb-8 max-w-sm">
              The Kinetic Arena. Engineered for the modern fan. High-performance football apparel delivered with precision and passion.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface-deep border border-white/10 flex items-center justify-center text-white/70 hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all duration-300 hover:scale-110">
                <InstagramIcon size={18} />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface-deep border border-white/10 flex items-center justify-center text-white/70 hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all duration-300 hover:scale-110">
                <XIcon size={16} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface-deep border border-white/10 flex items-center justify-center text-white/70 hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all duration-300 hover:scale-110">
                <FacebookIcon size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Shop Links (Spans 2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="font-inter font-bold text-white mb-6 uppercase tracking-[0.2em] text-xs">Shop Gear</h4>
            <ul className="flex flex-col gap-4 font-inter text-sm">
              <li>
                <Link to="/category/home-kits" className="group flex items-center gap-2 text-text-secondary hover:text-brand-primary transition-all duration-300">
                  <span className="w-0 h-[1px] bg-brand-primary transition-all duration-300 group-hover:w-4"></span>
                  Club Jerseys
                </Link>
              </li>
              <li>
                <Link to="/category/away-kits" className="group flex items-center gap-2 text-text-secondary hover:text-brand-primary transition-all duration-300">
                  <span className="w-0 h-[1px] bg-brand-primary transition-all duration-300 group-hover:w-4"></span>
                  National Teams
                </Link>
              </li>
              <li>
                <Link to="/category/retro-classics" className="group flex items-center gap-2 text-text-secondary hover:text-brand-primary transition-all duration-300">
                  <span className="w-0 h-[1px] bg-brand-primary transition-all duration-300 group-hover:w-4"></span>
                  Retro Classics
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support Links (Spans 2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="font-inter font-bold text-white mb-6 uppercase tracking-[0.2em] text-xs">Support</h4>
            <ul className="flex flex-col gap-4 font-inter text-sm">
              <li>
                <Link to="/faq" className="group flex items-center gap-2 text-text-secondary hover:text-white transition-all duration-300">
                  <span className="w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-4"></span>
                  Help & FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping-returns" className="group flex items-center gap-2 text-text-secondary hover:text-white transition-all duration-300">
                  <span className="w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-4"></span>
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/contact" className="group flex items-center gap-2 text-text-secondary hover:text-white transition-all duration-300">
                  <span className="w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-4"></span>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter (Spans 4 columns) */}
          <div className="lg:col-span-4">
            <h4 className="font-inter font-bold text-white mb-6 uppercase tracking-[0.2em] text-xs">Stay in the loop</h4>
            <p className="text-text-secondary text-sm font-inter mb-6">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            
            <form className="relative flex items-center group" onSubmit={(e) => e.preventDefault()}>
              <div className="absolute left-4 text-white/30 group-focus-within:text-brand-primary transition-colors">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-surface-deep/50 border border-white/10 rounded-full py-4 pl-12 pr-14 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 transition-all font-inter text-sm"
                required
              />
              <button 
                type="submit" 
                className="absolute right-2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-brand-primary hover:text-black transition-all duration-300"
                aria-label="Subscribe"
              >
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

        </div>
        
        {/* Bottom Copyright Section */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-xs text-white/40 font-inter uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Kinetic Football. All rights reserved.</p>
          <div className="flex gap-8 mt-6 md:mt-0">
            <Link to="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;