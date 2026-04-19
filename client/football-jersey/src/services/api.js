import axios from 'axios';
import { supabase } from './supabaseClient'; // Make sure this path is correct!

const api = axios.create({
  // Use Vercel URL in production, localhost in development
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// --- THE FIX: Intercept every request and add the Supabase token ---
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;