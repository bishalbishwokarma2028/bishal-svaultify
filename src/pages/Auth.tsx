import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Key, ArrowRight, Eye, EyeOff, Fingerprint, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { registerUser, setAdminSession } from '../lib/premiumRequests';

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function isInsideIframe(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState('');
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [inIframe] = useState(isInsideIframe);

  const { login } = useVaultStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const ADMIN_EMAIL = 'bishalbishwokarma089@gmail.com';
  const ADMIN_PASSWORD = 'bishal@ado@9746294386';

  useEffect(() => {
    const enabled = localStorage.getItem('vaultify-biometric-enabled') === 'true';
    const storedEmail = localStorage.getItem('vaultify-biometric-email') || '';
    // Show button if enabled + email stored, regardless of which tokens are present
    if (enabled && storedEmail) {
      setBiometricEnabled(true);
      setBiometricEmail(storedEmail);
    }
  }, []);

  const doLoginFromSession = async (session: { user: any; refresh_token?: string }) => {
    const u = session.user;
    const profile = {
      id: u.id,
      email: u.email!,
      fullName: u.user_metadata?.full_name || (u.email as string).split('@')[0],
      avatarUrl: u.user_metadata?.avatar_url || undefined,
      securityScore: 100,
      totalStorageLimit: 15 * 1024 * 1024 * 1024,
      usedStorage: 0,
      createdAt: u.created_at,
      isPremium: true,
    };
    login(profile);
    toast({ title: 'Welcome back!', description: `Signed in as ${profile.fullName}`, type: 'success' });
    navigate('/dashboard');
  };

  const handleBiometricLogin = async () => {
    if (!supabase) {
      toast({ title: 'Service Unavailable', description: 'Auth service not configured.', type: 'error' });
      return;
    }

    if (inIframe) {
      toast({
        title: 'Open App in Browser',
        description: 'Biometric sign-in is blocked inside preview frames. Open the app URL directly in your browser.',
        type: 'error',
      });
      return;
    }

    const credentialIdB64 = localStorage.getItem('vaultify-biometric-credential-id');
    const storedRefreshToken = localStorage.getItem('vaultify-biometric-refresh-token');

    // If no credential ID, the device was never actually registered — guide to re-setup
    if (!credentialIdB64) {
      toast({
        title: 'Re-setup Required',
        description: 'Please sign in with your password, then go to Settings → Security to re-enable biometric.',
        type: 'error',
      });
      setEmail(biometricEmail);
      return;
    }

    setIsBiometricLoading(true);
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credentialId = base64urlToUint8Array(credentialIdB64).buffer;

      // Ask device to verify — this triggers fingerprint / face / PIN on the device
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: credentialId, transports: ['internal'] as AuthenticatorTransport[] }],
          userVerification: 'required',
          rpId: window.location.hostname,
          timeout: 60000,
        },
      });

      // Device verified — now restore the Supabase session
      // Priority 1: use stored refresh token (most reliable)
      if (storedRefreshToken) {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: storedRefreshToken });
        if (!error && data.session?.user) {
          if (data.session.refresh_token) {
            localStorage.setItem('vaultify-biometric-refresh-token', data.session.refresh_token);
          }
          await doLoginFromSession(data.session);
          return;
        }
      }

      // Priority 2: existing in-memory session (user just signed in this tab)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await doLoginFromSession(session);
        return;
      }

      // Refresh token expired — need to re-login once manually
      localStorage.removeItem('vaultify-biometric-refresh-token');
      toast({
        title: 'Session Expired',
        description: 'Your login session expired (usually after 60 days). Sign in once with your password to relink biometric.',
        type: 'error',
      });
      setEmail(biometricEmail);
    } catch (err: any) {
      const name = err?.name || '';
      const msg = (err?.message || '').toLowerCase();

      if (name === 'NotAllowedError' || msg.includes('cancel') || msg.includes('abort') || msg.includes('user')) {
        toast({ title: 'Cancelled', description: 'Device verification was cancelled. Try again.', type: 'info' });
      } else if (name === 'SecurityError' || msg.includes('rpid') || msg.includes('origin') || msg.includes('security')) {
        // This happens when the credential was registered on a different domain
        toast({
          title: 'Domain Mismatch',
          description: 'Credential was registered on a different URL. Please disable then re-enable biometric in Settings.',
          type: 'error',
        });
      } else if (name === 'InvalidStateError' || msg.includes('not found') || msg.includes('no credential')) {
        toast({
          title: 'Credential Not Found',
          description: 'Your device cannot find the biometric key. Please re-setup biometric in Settings.',
          type: 'error',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: `Could not verify: ${err?.message || 'unknown error'}. Use email and password instead.`,
          type: 'error',
        });
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

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
        toast({ title: 'Recovery Email Sent', description: 'Check your inbox for the reset link.', type: 'success' });
        setMode('login');
        setIsLoading(false);
        return;
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || email.split('@')[0] } },
        });
        if (error) throw error;

        if (data.user && data.session) {
          const profile = {
            id: data.user.id, email: data.user.email!, fullName: fullName || email.split('@')[0],
            securityScore: 100, totalStorageLimit: 15 * 1024 * 1024 * 1024, usedStorage: 0,
            createdAt: new Date().toISOString(), isPremium: true,
          };
          login(profile);
          registerUser({ id: data.user.id, email: data.user.email!, fullName: profile.fullName });
          toast({ title: 'Account Created!', description: 'Welcome to your secure vault.', type: 'success' });
          navigate('/dashboard');
        } else if (data.user && !data.session) {
          toast({ title: 'Check Your Email', description: `Confirmation sent to ${email}. Click it, then sign in.`, type: 'success' });
          setMode('login');
          setPassword('');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const profile = {
            id: data.user.id, email: data.user.email!,
            fullName: data.user.user_metadata?.full_name || email.split('@')[0],
            securityScore: 100, totalStorageLimit: 15 * 1024 * 1024 * 1024,
            usedStorage: 0, createdAt: data.user.created_at, isPremium: true,
          };
          login(profile);
          registerUser({ id: data.user.id, email: data.user.email!, fullName: profile.fullName });
          toast({ title: 'Welcome back!', description: 'Your vault is ready.', type: 'success' });
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      toast({ title: 'Authentication Error', description: err?.message || 'Something went wrong.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
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
            {mode === 'login' && 'Enter your credentials to access your vault'}
            {mode === 'signup' && 'Create an account to start storing files securely'}
            {mode === 'forgot' && 'We will send you a link to reset your password'}
          </p>
        </div>

        <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] text-gray-400">
            <Lock className="w-2.5 h-2.5 text-emerald-400" />
            <span>Secured by Supabase</span>
          </div>

          {/* Biometric sign-in block — only on login mode */}
          {mode === 'login' && biometricEnabled && (
            <div className="mb-5">
              {inIframe ? (
                /* ── Inside preview/iframe: WebAuthn is blocked ── */
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">Biometric blocked in preview</p>
                      <p className="text-[11px] text-amber-400/80 mt-0.5 leading-relaxed">
                        Open the app directly in your browser to use fingerprint / device lock sign-in.
                      </p>
                    </div>
                  </div>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open App in Browser
                  </a>
                </div>
              ) : (
                /* ── Not in iframe: show biometric button normally ── */
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isBiometricLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 font-bold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isBiometricLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span>Waiting for device verification...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5" />
                      <span>Sign in with Fingerprint / Device Lock</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-center text-[10px] text-gray-600 mt-2 leading-relaxed">
                {inIframe
                  ? `Biometric set up for: ${biometricEmail}`
                  : <>Your device will ask for fingerprint, face, or PIN.<br /><span className="text-gray-700">Account: {biometricEmail}</span></>
                }
              </p>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-gray-500 font-medium">or sign in with password</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                    <button type="button" onClick={() => setMode('forgot')} className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] focus:bg-white/[0.06] text-white text-sm rounded-xl pl-10 pr-10 py-2.5 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && <p className="text-[10px] text-gray-500 mt-1">Must be at least 6 characters.</p>}
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
                  <span>{mode === 'login' && 'Sign In'}{mode === 'signup' && 'Create Account'}{mode === 'forgot' && 'Send Reset Link'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-gray-400">
            {mode === 'login' && (
              <p>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-blue-400 hover:text-blue-300 font-bold">Sign up for free</button>
              </p>
            )}
            {mode === 'signup' && (
              <p>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">Sign in</button>
              </p>
            )}
            {mode === 'forgot' && (
              <p>Remembered your password?{' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">Back to sign in</button>
              </p>
            )}
          </div>
        </div>

        <div className="text-center text-[10px] text-gray-600 space-y-1">
          <p>All data is stored privately on your device.</p>
          <div className="flex items-center justify-center gap-3">
            <span>End-to-End Private</span><span>•</span>
            <span>Your Data, Your Control</span><span>•</span>
            <span>AES-256 Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
