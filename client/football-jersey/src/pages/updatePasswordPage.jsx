import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import { useToast } from '../context/contextHook';

const UpdatePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const {addToast } =useToast();
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Supabase automatically picks up the secure session from the URL hash
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      addToast('Password updated successfully! You can now use your new password.');
      navigate('/'); // Send them to the shop logged in!
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-primary/10 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md bg-surface-low/40 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl">
        
        <div className="flex justify-center mb-8 mt-4">
          <div className="relative w-20 h-20 bg-surface-deep border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
            <KeyRound className="text-brand-primary" size={32} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="kinetic-heading text-3xl text-white tracking-tighter uppercase mb-2">New Password</h1>
          <p className="text-text-secondary font-inter text-sm tracking-wide opacity-80 uppercase">
            Secure your account
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-8 font-inter">
            <ShieldAlert size={18} className="shrink-0" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
            <input
              type="password"
              placeholder="ENTER NEW PASSWORD"
              className="w-full bg-surface-deep/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-primary/50 transition-all font-inter text-sm tracking-widest"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-5 rounded-2xl mt-4 flex items-center justify-center gap-3 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span className="tracking-[0.2em] font-black">UPDATE PASSWORD</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;