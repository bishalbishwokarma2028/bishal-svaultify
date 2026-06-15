import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Plus,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Crown
} from 'lucide-react';
import { useVaultStore, FREE_STORAGE_LIMIT } from '../../store/useVaultStore';

interface SidebarProps {
  onQuickUpload?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onQuickUpload }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, files, isPremium, freeStorageLimitGB } = useVaultStore();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Digital Vault', path: '/vault', icon: FolderLock },
    { name: 'Password Vault', path: '/passwords', icon: KeyRound },
    { name: 'Secure Notes', path: '/notes', icon: FileText },
    { name: 'Document Scanner', path: '/scanner', icon: Scan },
    { name: 'Expiry Reminders', path: '/reminders', icon: BellRing },
    { name: 'Security Center', path: '/security', icon: ShieldCheck },
    { name: 'Hidden Vault', path: '/hidden-vault', icon: EyeOff, isAdvanced: true },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const limitGB = freeStorageLimitGB;
  const freeLimitBytes = freeStorageLimitGB * 1024 * 1024 * 1024;
  const pct = isPremium ? 0 : Math.min(100, Math.round((usedBytes / freeLimitBytes) * 100));

  return (
    <aside 
      className={`relative hidden md:flex flex-col border-r border-white/10 glass-panel-premium transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg glow-blue">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-wider text-white text-base">VAULTIFY</span>
              <p className="text-[9px] text-gray-500 leading-none mt-0.5">Built By Bishal</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg cursor-pointer" onClick={() => navigate('/dashboard')}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors absolute right-[-12px] top-5 bg-slate-900 border border-white/10 shadow"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          onClick={onQuickUpload}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg glow-blue ${
            isCollapsed ? 'px-0' : ''
          }`}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Quick Upload</span>}
        </button>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white border border-blue-500/20 glow-blue' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={item.name}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${item.isAdvanced ? 'text-purple-400' : ''}`} />
              {!isCollapsed && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {!isCollapsed && item.isAdvanced && (
                <span className="text-[10px] bg-purple-950/80 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-md font-semibold tracking-wider">
                  ADV
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Storage / Plan Info */}
      <div className="p-3 border-t border-white/10 bg-white/[0.01]">
        {!isCollapsed ? (
          <div className="space-y-2">
            {isPremium ? (
              <div className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">Premium — Unlimited Storage</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    Device Storage
                  </span>
                  <span className="font-semibold text-gray-200">{usedMB} MB</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct > 80 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>{usedGB} GB used</span>
                  <span>{limitGB} GB free limit</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1" title={isPremium ? 'Premium User' : `${usedMB} MB used`}>
            {isPremium ? (
              <Crown className="w-4 h-4 text-amber-400" />
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold text-gray-400">{pct}%</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* User profile brief */}
      {!isCollapsed && user && (
        <div className="p-3 border-t border-white/5 flex items-center gap-3">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.fullName} 
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center ring-2 ring-blue-500/20 flex-shrink-0">
              <span className="text-white font-bold text-[11px]">
                {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user.email[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      )}
    </aside>
  );
};
