// client/src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // --- LOG IN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // If successful, redirect to home
        navigate('/');
      } else {
        // --- SIGN UP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // This triggers your Postgres webhook!
            },
          },
        });
        if (error) throw error;
        
        alert('Registration successful! You can now log in.');
        setIsLogin(true); // Switch to login view
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glowing effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="glass-panel p-10 rounded-large w-full max-w-md relative z-10 ambient-shadow">
        <h1 className="kinetic-heading text-4xl mb-2 text-center uppercase">
          {isLogin ? 'Access Arena' : 'Join the Club'}
        </h1>
        <p className="kinetic-body text-center mb-8">
          {isLogin ? 'Enter your credentials to continue.' : 'Create an account to unlock premium gear.'}
        </p>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-button text-sm mb-6 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="kinetic-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email Address"
            className="kinetic-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            className="kinetic-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-text-secondary hover:text-brand-primary transition-colors text-sm font-inter"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;