import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useVaultStore } from './store/useVaultStore';
import { ToastProvider, useToast } from './components/ui/Toast';
import { supabase } from './lib/supabase';

import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { CommandPalette } from './components/command/CommandPalette';
import { InstallPromptModal } from './components/pwa/InstallPromptModal';
import { StorageConsentModal } from './components/ui/StorageConsentModal';

import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Admin } from './pages/Admin';
import { Dashboard } from './pages/Dashboard';
import { Vault } from './pages/Vault';
import { Passwords } from './pages/Passwords';
import { Notes } from './pages/Notes';
import { Reminders } from './pages/Reminders';
import { Search } from './pages/Search';
import { Security } from './pages/Security';
import { HiddenVault } from './pages/HiddenVault';
import { Settings } from './pages/Settings';
import { MobileScanner } from './components/scanner/MobileScanner';

const PlanGate: React.FC<{ sectionId: string; children: React.ReactNode }> = ({ sectionId, children }) => {
  const { planAccess, isPremium } = useVaultStore();
  const isLocked = (planAccess[sectionId] || 'free') === 'premium' && !isPremium;
  if (!isLocked) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <span className="text-4xl">👑</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Premium Feature</h2>
        <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
          This section is available to Premium subscribers only. Upgrade your plan to unlock full access.
        </p>
      </div>
      <a
        href="/settings"
        className="px-6 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-sm transition-all"
      >
        Upgrade to Premium →
      </a>
    </div>
  );
};

const SyncStatusNotifier: React.FC = () => {
  const { syncStats, syncError, isAuthenticated } = useVaultStore();
  const { toast } = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) { shownRef.current = false; return; }
    if (!syncStats || shownRef.current) return;
    shownRef.current = true;
    const total = syncStats.passwords + syncStats.files + syncStats.notes + syncStats.reminders;
    if (total > 0) {
      toast({
        title: 'Vault Synced',
        description: `${syncStats.passwords} passwords · ${syncStats.files} files · ${syncStats.notes} notes`,
        type: 'success',
      });
    }
  }, [syncStats, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !syncError) return;
    if (syncError.includes('does not exist') || syncError.includes('permission') || syncError.includes('denied')) {
      toast({
        title: 'Cloud Setup Required',
        description: 'Please run the database schema SQL in your Supabase project to enable sync.',
        type: 'error',
      });
    }
  }, [syncError, isAuthenticated]);

  return null;
};

const AdminBanner: React.FC = () => {
  const [msg, setMsg] = React.useState('');
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const active = localStorage.getItem('vaultify-admin-announcement-active');
    const text = localStorage.getItem('vaultify-admin-announcement');
    if (active === '1' && text) setMsg(text);
  }, []);

  if (!msg || dismissed) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-0 left-0 right-0 z-[200] bg-amber-500/95 text-amber-950 text-xs font-semibold px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg backdrop-blur-xl"
    >
      <span className="flex items-center gap-2">
        <span className="text-base">📢</span>
        <span>{msg}</span>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-amber-600/30 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const useReminderNotifications = (isAuthenticated: boolean) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const requestPerm = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };
    requestPerm();

    const check = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const { reminders } = useVaultStore.getState();
      const now = new Date();
      let shown: string[] = [];
      try { shown = JSON.parse(localStorage.getItem('vaultify-notif-shown') || '[]'); } catch { shown = []; }

      const newlyShown: string[] = [];
      reminders.forEach(reminder => {
        if (reminder.isResolved) return;
        const expiry = new Date(reminder.expiryDate);
        const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const notifId = `${reminder.id}-d${daysUntil}`;
        if (!shown.includes(notifId) && daysUntil >= 0 && daysUntil <= reminder.notifyBeforeDays) {
          try {
            new Notification('Vaultify — Expiry Alert 🔔', {
              body: `"${reminder.title}" expires ${daysUntil === 0 ? 'today!' : `in ${daysUntil} day(s)`}`,
              icon: '/favicon.ico',
              tag: notifId,
            });
            newlyShown.push(notifId);
          } catch { /* ignore */ }
        }
      });

      if (newlyShown.length > 0) {
        try { localStorage.setItem('vaultify-notif-shown', JSON.stringify([...shown.slice(-100), ...newlyShown])); } catch { /* ignore */ }
      }
    };

    check();
    intervalRef.current = setInterval(check, 30 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAuthenticated]);
};

export const App: React.FC = () => {
  const { isAuthenticated, login, clearAuth, theme, syncPremiumFromGlobal, syncFromSupabase, refreshAdminSettings } = useVaultStore();
  useReminderNotifications(isAuthenticated);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme ?? 'dark');
  }, [theme]);

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        login({
          id: u.id,
          email: u.email!,
          fullName: u.user_metadata?.full_name || u.email!.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url || undefined,
          securityScore: 100,
          totalStorageLimit: 15 * 1024 * 1024 * 1024,
          usedStorage: 0,
          createdAt: u.created_at,
          isPremium: false,
        });
        setTimeout(() => syncPremiumFromGlobal(), 100);
        // Sync data from Supabase to restore any server-side data
        setTimeout(() => syncFromSupabase(), 200);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        login({
          id: u.id,
          email: u.email!,
          fullName: u.user_metadata?.full_name || u.email!.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url || undefined,
          securityScore: 100,
          totalStorageLimit: 15 * 1024 * 1024 * 1024,
          usedStorage: 0,
          createdAt: u.created_at,
          isPremium: false,
        });
        setTimeout(() => syncPremiumFromGlobal(), 100);
        // Sync data from Supabase — merges server data with local data
        setTimeout(() => syncFromSupabase(), 200);
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
        sessionStorage.removeItem('VAULTIFY_PWA_PROMPT_SHOWN');
      }
    });

    // Re-sync whenever the user returns to this tab/app so that deletions
    // or additions from another device are reflected within seconds.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const { isAuthenticated: authed } = useVaultStore.getState();
        if (authed) syncFromSupabase();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Periodically re-sync user data so changes made on Device A (new password,
  // note, file, delete) appear on Device B within ~30 seconds automatically.
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => { syncFromSupabase(); }, 30_000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  // Periodically re-sync admin settings (price, storage, access) so changes
  // made in the admin panel propagate to all devices within ~60 seconds.
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => { refreshAdminSettings(); }, 60_000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isInstalled) return;
    const timer = setTimeout(() => {
      const promptShown = sessionStorage.getItem('VAULTIFY_PWA_PROMPT_SHOWN');
      if (!promptShown) {
        setShowInstallPrompt(true);
        sessionStorage.setItem('VAULTIFY_PWA_PROMPT_SHOWN', 'true');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <SyncStatusNotifier />
      <AdminBanner />
      <Router>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />}
          />
          <Route
            path="/auth"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />}
          />

          <Route
            path="/*"
            element={
              !isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <div className="flex h-screen bg-[#030712] text-gray-100 overflow-hidden font-sans">
                  <Sidebar onQuickUpload={() => {}} />

                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <Navbar
                      onOpenCommandPalette={() => setShowCommandPalette(true)}
                      onOpenMenu={() => setMobileMenuOpen(true)}
                    />

                    <main className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-8 pt-4 md:pt-6 pb-6">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/vault" element={<PlanGate sectionId="vault"><Vault /></PlanGate>} />
                        <Route path="/passwords" element={<PlanGate sectionId="passwords"><Passwords /></PlanGate>} />
                        <Route path="/notes" element={<PlanGate sectionId="notes"><Notes /></PlanGate>} />
                        <Route path="/reminders" element={<PlanGate sectionId="reminders"><Reminders /></PlanGate>} />
                        <Route path="/search" element={<PlanGate sectionId="search"><Search /></PlanGate>} />
                        <Route path="/security" element={<Security />} />
                        <Route path="/hidden-vault" element={<PlanGate sectionId="hidden-vault"><HiddenVault /></PlanGate>} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/scanner" element={<PlanGate sectionId="scanner"><div className="py-4"><MobileScanner /></div></PlanGate>} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </div>

                  <MobileDrawer
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    onQuickUpload={() => {}}
                  />

                  <CommandPalette
                    isOpen={showCommandPalette}
                    onClose={() => setShowCommandPalette(false)}
                    onTriggerUpload={() => {}}
                    onTriggerCreateFolder={() => {}}
                  />

                  <InstallPromptModal
                    isOpen={showInstallPrompt}
                    onClose={() => setShowInstallPrompt(false)}
                  />
                </div>
              )
            }
          />
        </Routes>
      </Router>
      <StorageConsentModal />
    </ToastProvider>
  );
};

export default App;
