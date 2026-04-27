// client/src/components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './navbar';
import Footer from './footer';
import CartDrawer from './cartDrawer';
import SearchDrawer from './searchdrawer';
import TrustMarquee from './trustMarquee';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <Navbar />
      <CartDrawer />
      <SearchDrawer></SearchDrawer>
      <main className="flex-grow "> 
        <Outlet />
      </main>
   
      <Footer />
    </div>
  );
};

export default Layout;