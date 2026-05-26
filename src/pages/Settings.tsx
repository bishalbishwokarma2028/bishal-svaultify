import React, { useState } from 'react';
import { 
  User, 
  Database, 
  Bell, 
  Lock, 
  Trash2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';

export const Settings: React.FC = () => {
  const { user, updateProfile, syncFromSupabase } = useVaultStore();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<'profile' | 'supabase' | 'storage' | 'notifications'>('profile');

  // Profile Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Supabase Configuration
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem('VAULTIFY_CUSTOM_SUPABASE_URL') || '');
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('VAULTIFY_CUSTOM_SUPABASE_KEY') || '');
  const [isSyncing, setIsSyncing] = useState(false);

  // Notification Options
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  // Theme settings
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, email });
    toast({ title: 'Profile Updated', type: 'success' });
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl && customKey) {
      localStorage.setItem('VAULTIFY_CUSTOM_SUPABASE_URL', customUrl.trim());
      localStorage.setItem('VAULTIFY_CUSTOM_SUPABASE_KEY', customKey.trim());
      
      setIsSyncing(true);
      toast({ title: 'Connecting to Supabase...', type: 'info' });
      
      const success = await syncFromSupabase();
      setIsSyncing(false);

      if (success) {
        toast({ 
          title: 'Connected & Synced!', 
          description: 'Your app is now saving data permanently to your Supabase project.', 
          type: 'success' 
        });
      } else {
        toast({ 
          title: 'Connection Error', 
          description: 'Could not load tables. Please make sure you have run the schema file in your Supabase SQL Editor.', 
          type: 'error' 
        });
      }
    } else {
      localStorage.removeItem('VAULTIFY_CUSTOM_SUPABASE_URL');
      localStorage.removeItem('VAULTIFY_CUSTOM_SUPABASE_KEY');
      toast({ 
        title: 'Database Disconnected', 
        description: 'Using standard local browser storage.', 
        type: 'info' 
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const clearAllClientData = () => {
    if (confirm('WARNING: This will permanently delete all your files, passwords, and notes stored in this browser. Continue?')) {
      localStorage.clear();
      toast({ title: 'All Data Deleted', type: 'error' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const hasSupabase = !!(customUrl && customKey);

  return (
    <div className="space-y-6 pb-12 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your account, connect your database, and configure preferences.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>App Version:</span>
          <strong className="text-blue-400">2.0-clean</strong>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Nav Stack */}
        <div className="glass-panel rounded-2xl p-2 border border-white/10 space-y-1">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'supabase', label: 'Cloud Database', icon: Database },
            { id: 'storage', label: 'Storage Options', icon: Lock },
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

        {/* Right Side Options */}
        <div className="md:col-span-3">
          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Your Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update your display name and email address.
                </p>
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Color Theme</label>
                  <div className="flex gap-2">
                    {['dark', 'light', 'system'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTheme(t as any);
                          toast({ title: `Theme switched to ${t}`, type: 'info' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium border ${
                          theme === t ? 'bg-white text-slate-950 font-bold border-white' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
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

          {/* SUPABASE */}
          {activeSection === 'supabase' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Connect Your Supabase Project</span>
                  </h3>
                  {hasSupabase && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Permanently store all your app data inside your personal Supabase database! Enter your Project URL and Anon Key below to automatically load and save your files.
                </p>
              </div>

              {/* Setup steps */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                <span className="text-xs font-bold text-blue-400 block">Setup Guide</span>
                <ol className="text-[11px] text-gray-300 space-y-1">
                  <li>1. Create a free project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">supabase.com</a></li>
                  <li>2. Open your project and copy your <strong>Project URL</strong> and <strong>anon public key</strong>.</li>
                  <li>3. Open the <strong className="text-white">SQL Editor</strong> inside Supabase and copy-paste the contents of the <code>supabase-schema.sql</code> file found in your project folder to create the tables.</li>
                </ol>
              </div>

              <form onSubmit={handleSupabaseSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Supabase Project URL</label>
                  <input
                    type="text"
                    placeholder="https://your-project.supabase.co"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Supabase Anon Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {hasSupabase && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomUrl('');
                        setCustomKey('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold"
                    >
                      Disconnect
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue flex items-center gap-1.5"
                  >
                    {isSyncing ? 'Syncing...' : 'Connect & Save'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STORAGE OPTIONS */}
          {activeSection === 'storage' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Storage Options</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Review how much space you are using and clear unneeded files.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Cloud Backup Sync</span>
                    <p className="text-[10px] text-gray-500">Automatically sync items to your active database</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Enabled</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={clearAllClientData}
                  className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Stored Data</span>
                </button>
                <p className="text-[9px] text-center text-gray-500 mt-1.5">
                  This will remove all your active files completely from the browser.
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
                  { id: 'email', label: 'Email Alerts', desc: 'Get helpful notifications sent directly to your email address', state: notifyEmail, set: setNotifyEmail },
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
                        toast({ title: 'Notification Setting Saved', type: 'info' });
                      }}
                      className="rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <p className="text-[11px] text-gray-400 leading-tight">
                  You can change these options anytime. All notifications are entirely free.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
