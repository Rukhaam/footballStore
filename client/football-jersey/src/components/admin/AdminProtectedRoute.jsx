import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminProtectedRoute = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get('/user/profile');
        if (res.data.role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error('Access denied. Admin role required.');
          setIsAdmin(false);
        }
      } catch (err) {
        console.error(err);
        setIsAdmin(false);
      }
    };
    if (isAuthenticated) checkAdmin();
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (isAdmin === null) return <div className="h-screen bg-surface-base text-white flex items-center justify-center animate-pulse">Verifying Credentials...</div>;

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminProtectedRoute;
