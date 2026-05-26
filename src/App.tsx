import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useVaultStore } from './store/useVaultStore';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';

// Global Overlays
import { CommandPalette } from './components/command/CommandPalette';
import { InstallPromptModal } from './components/pwa/InstallPromptModal';

// Pages
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
import { Timeline } from './pages/Timeline';
import { Sharing } from './pages/Sharing';
import { Settings } from './pages/Settings';

// Scanner simulation
import { MobileScanner } from './components/scanner/MobileScanner';

export const App: React.FC = () => {
  const { isAuthenticated } = useVaultStore();
  
  // App-level state for global triggers
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // Mobile side drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulate optional PWA auto installation prompt after 5 seconds on load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Show install prompt once per user session
      const promptShown = sessionStorage.getItem('VAULTIFY_PWA_PROMPT_SHOWN');
      if (!promptShown) {
        setShowInstallPrompt(true);
        sessionStorage.setItem('VAULTIFY_PWA_PROMPT_SHOWN', 'true');
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public/Unauthenticated Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
            } 
          />
          <Route 
            path="/auth" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />
            } 
          />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              !isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <div className="flex h-screen bg-[#030712] text-gray-100 overflow-hidden font-sans">
                  {/* Left Desktop Sidebar */}
                  <Sidebar 
                    onQuickUpload={() => {
                      // Navigate to vault or trigger upload modal
                      window.location.hash = '#/vault';
                    }} 
                  />

                  {/* Main Application Interface */}
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {/* Top Universal Search Bar */}
                    <Navbar 
                      onOpenCommandPalette={() => setShowCommandPalette(true)} 
                    />

                    {/* Scrollable Viewport */}
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
                        <Route path="/timeline" element={<Timeline />} />
                        <Route path="/sharing" element={<Sharing />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/scanner" element={<div className="py-4"><MobileScanner /></div>} />
                        
                        {/* Fallback routing */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>

                    {/* Bottom Premium Mobile Navigation layout */}
                    <MobileNav onOpenMenu={() => setMobileMenuOpen(true)} />
                  </div>

                  {/* Mobile Side Drawer overlay */}
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

                  {/* Universal Interactive Triggers */}
                  <CommandPalette
                    isOpen={showCommandPalette}
                    onClose={() => setShowCommandPalette(false)}
                    onTriggerUpload={() => {
                      window.location.hash = '#/vault';
                    }}
                    onTriggerCreateFolder={() => {
                      window.location.hash = '#/vault';
                    }}
                  />

                  {/* Premium PWA Install Modals */}
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
