// client/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from './services/supabaseClient';
import { setUser } from './features/authSlice';
 import CartDrawer from './components/cartDrawer';
import AuthPage from './pages/authPage';
import HomePage from './pages/homePage'; // <-- Import the new Homepage

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setUser(session?.user || null));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        dispatch(setUser(session?.user || null));
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <CartDrawer />
      <Routes>
        {/* The Homepage is now accessible to everyone (no auth wrapper needed for browsing!) */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth Page */}
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;