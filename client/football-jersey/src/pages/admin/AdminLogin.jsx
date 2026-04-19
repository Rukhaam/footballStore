import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Authenticating admin...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Ensure the user actually has the admin role in the DB
      const res = await api.get('/user/profile');
      if (res.data.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Unauthorized: Admin access required');
      }

      toast.success('Admin login successful', { id: toastId });
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Login failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-low p-8 rounded-lg border border-white/10 shadow-2xl">
        <h2 className="kinetic-heading text-3xl text-brand-primary text-center tracking-widest mb-2">ADMIN PANEL</h2>
        <p className="text-text-secondary text-center mb-8 font-inter">Restricted Access Only</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-text-secondary mb-2 font-inter">Admin Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-surface-deep text-white px-4 py-3 rounded border border-white/10 focus:outline-none focus:border-brand-primary transition font-inter"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@kinetic.com"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2 font-inter">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-surface-deep text-white px-4 py-3 rounded border border-white/10 focus:outline-none focus:border-brand-primary transition font-inter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-primary text-black font-bold py-3 rounded tracking-wide hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] transition disabled:opacity-50 mt-4"
          >
            {loading ? 'VERIFYING...' : 'SECURE LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
