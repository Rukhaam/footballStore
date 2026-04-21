import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../features/authSlice";
import { supabase } from "../services/supabaseClient";
import api from "../services/api";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "../context/contextHook";


const ALLOWED_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "rediffmail.com"
];

// Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;

// Requires: Only letters and spaces, minimum 2 characters
const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanFullName = fullName.trim();

    try {
      if (!isLogin) {
        if (!NAME_REGEX.test(cleanFullName)) {
          throw new Error("Please enter a valid full name (letters only).");
        }

        const emailDomain = cleanEmail.split("@")[1];
        if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
          throw new Error("Please use a recognized email provider (e.g., Gmail, Yahoo, Outlook).");
        }

        if (!PASSWORD_REGEX.test(cleanPassword)) {
          throw new Error("Password must be at least 8 characters long, including an uppercase letter, a lowercase letter, and a number.");
        }
        if(isLogin && cleanPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        if(isLogin && cleanPassword.length > 100) { 
          throw new Error("Password is too long. Please enter a password under 100 characters.");
        }
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;

        dispatch(setUser(data.user));
        navigate("/");
      } else {
        const { data: checkData } = await api.get(`/user/check-email/${cleanEmail}`);

        if (checkData.exists) {
          throw new Error("This email is already registered in the Arena.");
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { full_name: cleanFullName },
          },
        });

        if (signUpError) throw signUpError;

        addToast("Registration successful! Welcome to the club. Please log in.", "success");
        setIsLogin(true);
        setPassword("");
        setFullName("");
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden w-full bg-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white blur-[160px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white blur-[100px] rounded-full pointer-events-none"></div>
      <h1 className=" absolute  text-5xl font-extrabold top-13 md:text-7xl text-black md:top-40 md:font-bold  ">WELCOME</h1>
      <div className="relative z-10 w-full max-w-md bg-surface-low/40 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl">
      
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full"></div>
            <div className="relative w-20 h-20 bg-surface-deep border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-all duration-500">
              <Zap
                className="text-brand-primary fill-brand-primary/10"
                size={32}
              />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="kinetic-heading text-4xl text-white tracking-tighter uppercase mb-2">
            {isLogin ? "Access" : "Enlist"}
          </h1>
          <p className="text-text-secondary font-inter text-sm tracking-wide opacity-80 uppercase">
            {isLogin
              ? "Enter the Kinetic Arena"
              : "Become a part of the legacy"}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-6 font-inter animate-in fade-in slide-in-from-top-2">
            <ShieldAlert size={18} className="shrink-0" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative group animate-in slide-in-from-left-4 duration-300">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors"
                size={18}
              />
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
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors"
              size={18}
            />
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
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors"
              size={18}
            />
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
                onClick={() => navigate("/forgot-password")}
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
                <span className="tracking-[0.2em] font-black">
                  {isLogin ? "ENTER" : "REGISTER"}
                </span>
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
              setPassword(""); // clear password on switch
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