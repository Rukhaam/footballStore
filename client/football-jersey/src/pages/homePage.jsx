import React from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import ProductGrid from '../components/productGrid'; // <-- Imported the new grid component

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section (The Lander) */}
      <main className="flex-grow pt-32 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Asymmetrical Hero Layout */}
          <div className="relative min-h-[70vh] flex items-center rounded-2xl bg-surface-low overflow-hidden ambient-shadow">
            
            {/* Background Glow */}
            <div className="absolute right-0 top-0 w-1/2 h-full bg-brand-primary/10 blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 w-full md:w-3/5 p-10 md:p-20">
              <div className="athletic-chip athletic-chip-unselected inline-block mb-6 border border-white/10">
                Season 2025/26
              </div>
              <h1 className="kinetic-heading text-5xl md:text-7xl leading-[0.9] mb-6 uppercase">
                Defy <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">Gravity.</span><br />
                <span className="text-brand-primary">Own The Pitch.</span>
              </h1>
              <p className="kinetic-body text-lg md:text-xl mb-10 max-w-md">
                Experience the pinnacle of athletic precision. Official club kits engineered for ultimate performance and digital luxury.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button className="btn-primary">Explore Collection</button>
                <button className="btn-secondary">View Drops</button>
              </div>
            </div>

            {/* Abstract Graphic / Image Placeholder */}
            <div className="hidden md:block absolute right-[-5%] top-1/2 -translate-y-1/2 w-1/2 h-[120%] bg-surface-base rotate-12 border-l border-white/5 overflow-hidden">
              {/* You will eventually put a massive, high-res cutout of a jersey here */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-brand-primary/20 opacity-50"></div>
            </div>
          </div>

          {/* The Live Product Grid */}
          <div className="py-24">
            <div className="flex items-end justify-between mb-12">
              <h2 className="kinetic-heading text-4xl uppercase">Trending Kits</h2>
              <button className="text-sm font-inter text-text-secondary hover:text-brand-primary transition-colors">
                View All →
              </button>
            </div>
            
            {/* Replaced placeholder with the live ProductGrid component */}
            <ProductGrid />

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;