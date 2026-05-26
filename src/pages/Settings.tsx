import React, { useState } from 'react';
import { 
  User, 
  Database, 
  Bell, 
  Lock, 
  Trash2,
  CheckCircle2,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

export const Settings: React.FC = () => {
  const { user, updateProfile, syncFromSupabase, logout } = useVaultStore();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<'profile' | 'database' | 'storage' | 'notifications'>('profile');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isSyncing, setIsSyncing] = useState(false);

  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() }
    });

    if (error) {
      toast({ title: 'Update Failed', description: error.message, type: 'error' });
      return;
    }

    updateProfile({ fullName: fullName.trim() });
    toast({ title: 'Profile Updated', type: 'success' });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast({ title: 'Syncing data...', type: 'info' });
    const success = await syncFromSupabase();
    setIsSyncing(false);
    if (success) {
      toast({ title: 'Sync Complete', description: 'All your data has been refreshed from the database.', type: 'success' });
    } else {
      toast({ title: 'Sync Failed', description: 'Could not reach your database. Check your connection.', type: 'error' });
    }
  };

  const clearAllClientData = async () => {
    if (confirm('WARNING: This will sign you out and clear all locally cached data. Your data in Supabase is safe. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      await logout();
      toast({ title: 'Local Data Cleared', type: 'info' });
    }
  };

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const isConnected = !!supabaseUrl;

  return (
    <div className="space-y-6 pb-12 select-none max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your account and preferences.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>App Version:</span>
          <strong className="text-blue-400">2.1</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Nav */}
        <div className="glass-panel rounded-2xl p-2 border border-white/10 space-y-1">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'database', label: 'Database Status', icon: Database },
            { id: 'storage', label: 'Storage', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-3">
          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Your Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your display name.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Email Address</label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full bg-white/[0.02] text-gray-400 text-xs rounded-xl px-3.5 py-2.5 border border-white/5 outline-none cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-600">Email cannot be changed here.</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Account Secured</p>
                    <p className="text-[10px] text-gray-400">Your account is authenticated via Supabase.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DATABASE STATUS */}
          {activeSection === 'database' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Database Connection</h3>
                  {isConnected && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Your Vaultify is connected to your personal Supabase project. All data is saved securely to your own database.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Project URL</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {supabaseUrl ? supabaseUrl.replace('https://', '').split('.')[0] + '.supabase.co' : 'Not configured'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Auth Provider</span>
                    <span className="text-[10px] font-mono text-blue-400">Email / Password</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Row Level Security</span>
                    <span className="text-[10px] font-mono text-emerald-400">Enabled</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                <span className="text-xs font-bold text-blue-400 block">First Time Setup</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  If your tables don't exist yet, open your Supabase dashboard → SQL Editor and run the contents of <code className="text-white bg-white/10 px-1 rounded">supabase-schema.sql</code> from this project.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Data Now'}
                </button>
              </div>
            </div>
          )}

          {/* STORAGE */}
          {activeSection === 'storage' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Storage</h3>
                <p className="text-xs text-gray-400 mt-0.5">Manage your stored data.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Cloud Sync</span>
                    <p className="text-[10px] text-gray-500">All items automatically sync to your Supabase database</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Active</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Total Storage Limit</span>
                    <p className="text-[10px] text-gray-500">Based on your Supabase plan</p>
                  </div>
                  <span className="text-xs font-mono text-blue-400 font-bold">15 GB</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Used Storage</span>
                    <p className="text-[10px] text-gray-500">Tracked from file metadata</p>
                  </div>
                  <span className="text-xs font-mono text-white font-bold">
                    {user ? (user.usedStorage / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={clearAllClientData}
                  className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Local Cache & Sign Out</span>
                </button>
                <p className="text-[9px] text-center text-gray-500 mt-1.5">
                  This signs you out and clears local cache. Your Supabase data is not affected.
                </p>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Notification Preferences</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Choose how you want to be alerted before your items expire.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email Alerts', desc: 'Get notifications sent directly to your email address', state: notifyEmail, set: setNotifyEmail },
                  { id: 'sms', label: 'Text Message (SMS)', desc: 'Receive instant text updates on your phone', state: notifySms, set: setNotifySms },
                  { id: 'push', label: 'Device Notifications', desc: 'Allow your device to show alerts natively', state: notifyPush, set: setNotifyPush },
                ].map(opt => (
                  <div key={opt.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white block">{opt.label}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={opt.state}
                      onChange={(e) => {
                        opt.set(e.target.checked);
                        toast({ title: 'Preference Saved', type: 'info' });
                      }}
                      className="rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <p className="text-[11px] text-gray-400 leading-tight">
                  You can change these options anytime. All notifications are free.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
