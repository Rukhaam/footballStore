import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, ArrowLeft, Loader2, ShieldAlert, CheckCircle2, KeyRound } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      // Supabase sends the reset email. The redirectTo is where they go AFTER clicking the email link!
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      setMessage('Recovery link sent! Check your email inbox (and spam folder).');
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

      <div className="relative z-10 w-full max-w-md bg-surface-low/40 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl">
        
        <button onClick={() => navigate('/auth')} className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>

        <div className="flex justify-center mb-8 mt-4">
          <div className="relative w-20 h-20 bg-surface-deep border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
            <KeyRound className="text-brand-primary" size={32} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="kinetic-heading text-3xl text-white tracking-tighter uppercase mb-2">Recover Access</h1>
          <p className="text-text-secondary font-inter text-sm tracking-wide opacity-80 uppercase">
            We will send you a reset link
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-8 font-inter">
            <ShieldAlert size={18} className="shrink-0" /> {errorMsg}
          </div>
        )}

        {message ? (
          <div className="flex flex-col items-center gap-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary p-6 rounded-2xl text-center font-inter animate-in zoom-in duration-300">
            <CheckCircle2 size={32} />
            <p className="text-sm font-bold">{message}</p>
            <Link to="/auth" className="mt-4 text-xs text-white hover:text-brand-primary uppercase tracking-widest border-b border-white/20 pb-1">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
              <input
                type="email"
                placeholder="ACCOUNT EMAIL"
                className="w-full bg-surface-deep/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary/50 transition-all font-inter text-sm tracking-widest"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-5 rounded-2xl mt-4 flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <span className="tracking-[0.2em] font-black">SEND LINK</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;