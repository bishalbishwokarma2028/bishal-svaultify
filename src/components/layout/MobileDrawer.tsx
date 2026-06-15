import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderLock,
  KeyRound,
  FileText,
  Scan,
  BellRing,
  ShieldCheck,
  EyeOff,
  Settings,
  HardDrive,
  Crown,
  X,
  Plus,
  LogOut,
} from 'lucide-react';
import { useVaultStore, FREE_STORAGE_LIMIT } from '../../store/useVaultStore';
import { useToast } from '../ui/Toast';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickUpload?: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
  { name: 'Digital Vault', path: '/vault', icon: FolderLock, color: 'text-blue-400' },
  { name: 'Password Vault', path: '/passwords', icon: KeyRound, color: 'text-purple-400' },
  { name: 'Secure Notes', path: '/notes', icon: FileText, color: 'text-emerald-400' },
  { name: 'Document Scanner', path: '/scanner', icon: Scan, color: 'text-cyan-400' },
  { name: 'Expiry Reminders', path: '/reminders', icon: BellRing, color: 'text-amber-400' },
  { name: 'Security Center', path: '/security', icon: ShieldCheck, color: 'text-emerald-400' },
  { name: 'Hidden Vault', path: '/hidden-vault', icon: EyeOff, color: 'text-purple-400', isAdvanced: true },
  { name: 'Settings', path: '/settings', icon: Settings, color: 'text-gray-400' },
];

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, onQuickUpload }) => {
  const { user, files, isPremium, logout, clearAuth, freeStorageLimitGB } = useVaultStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const freeLimitBytes = freeStorageLimitGB * 1024 * 1024 * 1024;
  const pct = isPremium ? 0 : Math.min(100, Math.round((usedBytes / freeLimitBytes) * 100));

  const handleLogout = async () => {
    onClose();
    await logout();
    clearAuth();
    toast({ title: 'Logged out successfully', type: 'info' });
    navigate('/');
  };

  const handleNav = () => onClose();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-slate-950 border-r border-white/10 z-50 md:hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-white/[0.02]">
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => { navigate('/dashboard'); onClose(); }}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold tracking-wider text-white text-base">VAULTIFY</span>
                  <p className="text-[9px] text-gray-500 leading-none mt-0.5">Built By Bishal</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User profile */}
            {user && (
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center ring-2 ring-blue-500/30 flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user.email[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
                {isPremium && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
              </div>
            )}

            {/* Quick Upload */}
            <div className="px-4 pt-3 pb-2">
              <button
                onClick={() => { onQuickUpload?.(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Quick Upload
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNav}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white border border-blue-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                    <span className="flex-1">{item.name}</span>
                    {item.isAdvanced && (
                      <span className="text-[10px] bg-purple-950/80 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-md font-semibold">
                        ADV
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Device Storage */}
            <div className="px-4 py-3 border-t border-white/10 bg-white/[0.01]">
              {isPremium ? (
                <div className="flex items-center gap-2 py-1">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Premium — Unlimited Storage</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                      <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                      Device Storage
                    </span>
                    <span className="font-semibold text-gray-200">{usedMB} MB used</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{usedGB} GB used</span>
                    <span>{freeStorageLimitGB} GB free limit</span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="px-4 pb-6 pt-2 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-sm font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
