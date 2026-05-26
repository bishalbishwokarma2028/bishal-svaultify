import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Key, ArrowRight } from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useVaultStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid Email Address', description: 'Please provide a legitimate communication endpoint.', type: 'error' });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      
      if (mode === 'forgot') {
        toast({ 
          title: 'Recovery Packet Dispatched', 
          description: 'If verified, an encrypted master reset vector has been sent to your primary keys.', 
          type: 'success' 
        });
        setMode('login');
        return;
      }

      // Login / Signup success
      login(email, fullName || undefined);
      
      toast({ 
        title: mode === 'signup' ? 'Cryptographic Vault Initialized' : 'Session Restored Successfully', 
        description: 'Argon2id client keys locked and loaded.', 
        type: 'success' 
      });

      navigate('/dashboard');
    }, 1200);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login('google.executive@vaultify.io', 'Google Authenticated User');
      toast({ title: 'Google Single Sign-On Active', description: 'Federated token injected with Client Sandbox wrapping.', type: 'success' });
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Floating Animated Background Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, -40, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Top Logo branding */}
        <div className="text-center space-y-2">
          <div 
            onClick={() => navigate('/')}
            className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl glow-blue cursor-pointer hover:scale-105 transition-transform"
          >
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Sign in to your Vault'}
            {mode === 'signup' && 'Create your Secure Enclave'}
            {mode === 'forgot' && 'Master Vector Restoration'}
          </h2>
          <p className="text-xs text-gray-400">
            {mode === 'login' && 'Client-side AES-GCM decryption ready'}
            {mode === 'signup' && 'Zero-Knowledge Client key architecture'}
            {mode === 'forgot' && 'Dual authorization shard recovery'}
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          {/* Subtle live indicator badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] text-gray-400">
            <Lock className="w-2.5 h-2.5 text-emerald-400" />
            <span>Argon2id Hashing</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alexander Mercer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/[0.03] focus:bg-white/[0.06] text-white text-sm rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Secure Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="alex@vaultify.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] focus:bg-white/[0.06] text-white text-sm rounded-xl pl-10 pr-3.5 py-2.5 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Master Keyphrase</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] focus:bg-white/[0.06] text-white text-sm rounded-xl pl-10 pr-3.5 py-2.5 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    ⚠️ Must be at least 12 characters. We cannot recover this if lost.
                  </p>
                )}
              </div>
            )}

            {/* Execute Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg glow-blue flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Decrypt & Sign In'}
                    {mode === 'signup' && 'Generate Key Pair'}
                    {mode === 'forgot' && 'Send Recovery Vector'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social login separator */}
          {mode !== 'forgot' && (
            <>
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-slate-900 px-3 text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                  Or Authenticate With
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google Sign In</span>
              </button>
            </>
          )}

          {/* Bottom links */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-gray-400">
            {mode === 'login' && (
              <p>
                New to Vaultify?{' '}
                <button onClick={() => setMode('signup')} className="text-blue-400 hover:text-blue-300 font-bold">
                  Create an account
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have keys?{' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>
                Remembered your master vector?{' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">
                  Back to login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="text-center text-[10px] text-gray-600 space-y-1">
          <p>Protected by physical secure Enclave & Vercel Web Crypto</p>
          <div className="flex items-center justify-center gap-3">
            <span>HIPAA Ready</span>
            <span>•</span>
            <span>SOC2 Type II</span>
            <span>•</span>
            <span>AES-GCM 256</span>
          </div>
        </div>
      </div>
    </div>
  );
};
