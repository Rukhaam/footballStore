import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface-deep pt-20 pb-10 px-6 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        <div className="md:col-span-2">
          <Link to="/" className="kinetic-heading text-3xl mb-4 block">
            KINETIC<span className="text-brand-primary">.</span>
          </Link>
          <p className="kinetic-body max-w-sm">
            The Kinetic Arena. Engineered for the modern fan. High-performance football apparel delivered with precision.
          </p>
        </div>

        <div>
          <h4 className="font-jakarta font-bold text-white mb-4 uppercase tracking-widest text-sm">Shop</h4>
          <ul className="flex flex-col gap-3 kinetic-body text-sm">
            <li><Link to="/" className="hover:text-brand-primary transition-colors">All Jerseys</Link></li>
            <li><Link to="/" className="hover:text-brand-primary transition-colors">National Teams</Link></li>
            <li><Link to="/" className="hover:text-brand-primary transition-colors">Retro Kits</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-jakarta font-bold text-white mb-4 uppercase tracking-widest text-sm">Support</h4>
          <ul className="flex flex-col gap-3 kinetic-body text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-text-secondary font-inter">
        <p>&copy; {new Date().getFullYear()} Kinetic Football. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link to="/" className="hover:text-white">Privacy Policy</Link>
          <Link to="/" className="hover:text-white">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;