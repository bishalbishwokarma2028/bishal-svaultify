import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Key, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { registerUser, setAdminSession } from '../lib/premiumRequests';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useVaultStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const ADMIN_EMAIL = 'bishalbishwokarma089@gmail.com';
  const ADMIN_PASSWORD = 'bishal@ado@9802485583';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    if (mode !== 'forgot' && password.length < 6) {
      toast({ title: 'Password Too Short', description: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    // Admin credentials → validate and redirect directly without double sign-in
    if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (mode !== 'forgot' && password.trim() === ADMIN_PASSWORD) {
        setAdminSession();
        toast({ title: 'Admin Access Granted', description: 'Welcome to the Admin Panel.', type: 'success' });
        navigate('/admin');
        return;
      } else if (mode !== 'forgot') {
        toast({ title: 'Invalid Admin Credentials', description: 'Check your admin email and password.', type: 'error' });
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast({ title: 'Recovery Email Sent', description: 'Check your inbox for the password reset link.', type: 'success' });
        setMode('login');
        setIsLoading(false);
        return;
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split('@')[0] },
            emailRedirectTo: undefined,
          },
        });

        if (error) throw error;

        if (data.user) {
          const profile = {
            id: data.user.id,
            email: data.user.email!,
            fullName: fullName || email.split('@')[0],
            securityScore: 100,
            totalStorageLimit: 15 * 1024 * 1024 * 1024,
            usedStorage: 0,
            createdAt: new Date().toISOString(),
            isPremium: true,
          };
          login(profile);
          registerUser({ id: data.user.id, email: data.user.email!, fullName: profile.fullName });
          toast({ title: 'Account Created!', description: 'Welcome to your secure vault.', type: 'success' });
          navigate('/dashboard');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          const profile = {
            id: data.user.id,
            email: data.user.email!,
            fullName: data.user.user_metadata?.full_name || email.split('@')[0],
            securityScore: 100,
            totalStorageLimit: 15 * 1024 * 1024 * 1024,
            usedStorage: 0,
            createdAt: data.user.created_at,
            isPremium: true,
          };
          login(profile);
          registerUser({ id: data.user.id, email: data.user.email!, fullName: profile.fullName });
          toast({ title: 'Welcome back!', description: 'Your vault is ready.', type: 'success' });
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      toast({ title: 'Authentication Error', description: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-2">
          <div 
            onClick={() => navigate('/')}
            className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl glow-blue cursor-pointer hover:scale-105 transition-transform"
          >
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Sign in to your Vault'}
            {mode === 'signup' && 'Create your Secure Vault'}
            {mode === 'forgot' && 'Reset your Password'}
          </h2>
          <p className="text-xs text-gray-400">
            {mode === 'login' && 'Enter your email and password to access your vault'}
            {mode === 'signup' && 'Create an account to start storing your files securely'}
            {mode === 'forgot' && 'We will send you a link to reset your password'}
          </p>
        </div>

        <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] text-gray-400">
            <Lock className="w-2.5 h-2.5 text-emerald-400" />
            <span>Secured by Supabase</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/[0.03] focus:bg-white/[0.06] text-white text-sm rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] focus:bg-white/[0.06] text-white text-sm rounded-xl pl-10 pr-3.5 py-2.5 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] focus:bg-white/[0.06] text-white text-sm rounded-xl pl-10 pr-10 py-2.5 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Must be at least 6 characters.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg glow-blue flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-gray-400">
            {mode === 'login' && (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-blue-400 hover:text-blue-300 font-bold">
                  Sign up for free
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                Remembered your password?{' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="text-center text-[10px] text-gray-600 space-y-1">
          <p>All data is stored privately on your device.</p>
          <div className="flex items-center justify-center gap-3">
            <span>End-to-End Private</span>
            <span>•</span>
            <span>Your Data, Your Control</span>
            <span>•</span>
            <span>AES-256 Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
