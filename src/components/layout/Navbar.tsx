import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, Bell, Shield, LogOut, User, Sun, Moon } from 'lucide-react';
import { useVaultStore } from '../../store/useVaultStore';
import { useToast } from '../ui/Toast';

interface NavbarProps {
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const { user, logout, clearAuth, reminders, theme, setTheme } = useVaultStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const activeReminders = reminders.filter(r => !r.isResolved);
  const isLight = theme === 'light';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    clearAuth();
    toast({ title: 'Logged out successfully', type: 'info' });
    navigate('/');
  };

  const toggleTheme = () => {
    const next = isLight ? 'dark' : 'light';
    setTheme(next);
    toast({ title: next === 'light' ? 'Switched to Light Mode' : 'Switched to Dark Mode', type: 'info' });
  };

  return (
    <header className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents, tags, secure notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] text-white text-sm rounded-xl pl-10 pr-24 py-2 border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-500"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-gray-400 hover:text-white transition-colors"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </form>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Security Score */}
        {user && (
          <div
            onClick={() => navigate('/security')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all"
            title="Overall Security Health Score"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">
              Score: {user.securityScore}%
            </span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {activeReminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950 glow-blue animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel-premium rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Expiry Alerts</span>
                <span className="text-[10px] text-blue-400 font-medium">{activeReminders.length} Active</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {activeReminders.length > 0 ? (
                  activeReminders.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => { setShowNotifications(false); navigate('/reminders'); }}
                    >
                      <p className="text-xs font-semibold text-white">{r.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Expires: {new Date(r.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    No active warnings. You are fully secure.
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-white/10 text-center bg-white/[0.01]">
                <button
                  onClick={() => { setShowNotifications(false); navigate('/reminders'); }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  View All Reminders
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── THEME TOGGLE ── */}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`p-2 rounded-xl border transition-all active:scale-95 ${
            isLight
              ? 'bg-amber-50/80 border-amber-200/60 text-amber-500 hover:bg-amber-100'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300 hover:text-amber-300'
          }`}
        >
          {isLight ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Profile + Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white transition-colors"
            title="Profile Settings"
          >
            <User className="w-5 h-5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
            title="Secure Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
