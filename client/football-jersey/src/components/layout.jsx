// client/src/components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './navbar';
import Footer from './footer';
import CartDrawer from './cartDrawer';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      {/* These stay on the screen forever */}
      <Navbar />
      <CartDrawer />
      
      {/* The current page gets injected right here 👇 */}
      <main className="flex-grow pt-24"> 
        <Outlet />
      </main>

      {/* This stays at the bottom forever */}
      <Footer />
    </div>
  );
};

export default Layout;