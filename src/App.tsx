import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useVaultStore } from './store/useVaultStore';
import { ToastProvider } from './components/ui/Toast';
import { supabase } from './lib/supabase';

import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { CommandPalette } from './components/command/CommandPalette';
import { InstallPromptModal } from './components/pwa/InstallPromptModal';

import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
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

export const App: React.FC = () => {
  const { isAuthenticated, login, clearAuth, theme } = useVaultStore();

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
          isPremium: true,
        });
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
          isPremium: true,
        });
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const promptShown = sessionStorage.getItem('VAULTIFY_PWA_PROMPT_SHOWN');
      if (!promptShown && isAuthenticated) {
        setShowInstallPrompt(true);
        sessionStorage.setItem('VAULTIFY_PWA_PROMPT_SHOWN', 'true');
      }
    }, 4500);
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
      <Router>
        <Routes>
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
                    <Navbar onOpenCommandPalette={() => setShowCommandPalette(true)} />

                    <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-8">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/vault" element={<Vault />} />
                        <Route path="/passwords" element={<Passwords />} />
                        <Route path="/notes" element={<Notes />} />
                        <Route path="/reminders" element={<Reminders />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/security" element={<Security />} />
                        <Route path="/hidden-vault" element={<HiddenVault />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/scanner" element={<div className="py-4"><MobileScanner /></div>} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>

                    <MobileNav onOpenMenu={() => setMobileMenuOpen(true)} />
                  </div>

                  {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden flex">
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                      <div className="relative w-64 max-w-xs bg-slate-950 h-full z-10 flex flex-col border-r border-white/10 shadow-2xl">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                          <span className="text-xs font-bold text-white tracking-wider">VAULTIFY MENU</span>
                          <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
                          <Sidebar />
                        </div>
                      </div>
                    </div>
                  )}

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
    </ToastProvider>
  );
};

export default App;
