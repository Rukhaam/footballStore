import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../features/authSlice';
import { supabase } from '../services/supabaseClient';
import api from '../services/api'; 
import { Mail, Lock, User, ArrowRight, Loader2, Zap, ShieldAlert } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- NEW: GOOGLE OAUTH HANDLER ---
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      

    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        dispatch(setUser(data.user)); 
        navigate('/');
      } else {
        const { data: checkData } = await api.get(`/users/check-email/${email}`);
        
        if (checkData.exists) {
          throw new Error("This email is already registered in the Arena.");
        }
        
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        
        if (signUpError) throw signUpError;
        
        alert('Registration successful! Welcome to the club. Please log in.');
        setIsLogin(true); 
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden w-full">
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-primary/10 blur-[160px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md bg-surface-low/40 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl">
        
        {/* Animated Icon Header */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full"></div>
            <div className="relative w-20 h-20 bg-surface-deep border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-all duration-500">
              <Zap className="text-brand-primary fill-brand-primary/10" size={32} />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="kinetic-heading text-4xl text-white tracking-tighter uppercase mb-2">
            {isLogin ? 'Access' : 'Enlist'}
          </h1>
          <p className="text-text-secondary font-inter text-sm tracking-wide opacity-80 uppercase">
            {isLogin ? 'Enter the Kinetic Arena' : 'Become a part of the legacy'}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-6 font-inter animate-in fade-in slide-in-from-top-2">
            <ShieldAlert size={18} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* --- NEW: GOOGLE BUTTON --- */}
        <button
          onClick={handleGoogleAuth}
          type="button"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl mb-6 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="tracking-[0.1em]">CONTINUE WITH GOOGLE</span>
        </button>

        {/* --- OR DIVIDER --- */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-white/10 flex-grow"></div>
          <span className="text-white/40 text-xs font-inter tracking-widest uppercase">OR WITH EMAIL</span>
          <div className="h-px bg-white/10 flex-grow"></div>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative group animate-in slide-in-from-left-4 duration-300">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="FULL NAME"
                className="w-full bg-surface-deep/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary/50 transition-all font-inter text-sm tracking-widest"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="w-full bg-surface-deep/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary/50 transition-all font-inter text-sm tracking-widest"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
            <input
              type="password"
              placeholder="PASSWORD"
              className="w-full bg-surface-deep/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary/50 transition-all font-inter text-sm tracking-widest"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isLogin && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-white/40 hover:text-brand-primary transition-colors font-inter"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary w-full py-5 rounded-2xl mt-2 flex items-center justify-center gap-3 group disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span className="tracking-[0.2em] font-black">{isLogin ? 'ENTER' : 'REGISTER'}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="text-white/40 hover:text-brand-primary transition-all text-xs font-inter uppercase tracking-[0.2em]"
          >
            {isLogin ? "No Access? Join now" : "Back to authentication"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;