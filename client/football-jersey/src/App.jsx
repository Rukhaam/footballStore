import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {setUser , logout } from './features/authSlice';
import {supabase} from './services/supabaseClient';

import HomePage from './pages/homePage';
import AuthPage from './pages/authPage';
import ProductDetailsPage from './pages/proudctDetailPage';
import Layout from './components/layout';
import CategoryPage from './pages/categoryPage';
import CollectionPage from './pages/collectionPage';
import SearchResultsPage from './pages/searchResultsPage';
import CheckoutPage from './pages/checkoutPage';
import ContactPage from './pages/contactPage';
import OrdersPage from './pages/ordersPage';
import ForgotPasswordPage from './pages/forgotPasswordPage';
import UpdatePasswordPage from './pages/updatePasswordPage';
import ComingSoonPage from './pages/comingSoonPage';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCollections from './pages/admin/AdminCollections';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import { ScrollToTopOnRouteChange } from './hooks/useScrollToTop';
import { Toaster } from 'react-hot-toast';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        dispatch(setUser({
          user: session.user,
          token: session.access_token,
        }));
      }
    };
    checkSession();
  }, [dispatch]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#181A1B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <Router>
      <ScrollToTopOnRouteChange />
      <Routes>
        {/* Admin Login */}
        <Route path="/admin/login" element={!isAuthenticated ? <AdminLogin /> : <Navigate to="/admin/dashboard" />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:orderId" element={<AdminOrderDetail />} />
            <Route path="coupons" element={<AdminCoupons />} />
          </Route>
        </Route>

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:productSlug" element={<ProductDetailsPage />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/collection/:collectionSlug" element={<CollectionPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/search" element={<SearchResultsPage />} /> {/* <-- Add the Route here! */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Route>

        {/* --- ROUTES WITHOUT NAVBAR & FOOTER --- */}
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} 
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;