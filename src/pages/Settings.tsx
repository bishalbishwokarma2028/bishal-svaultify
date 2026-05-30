import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  HardDrive,
  Trash2,
  ShieldCheck,
  Camera,
  HelpCircle,
  X,
  Crown,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Lock,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Download,
  Smartphone,
  Monitor,
  ArchiveRestore,
  FileDown,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useVaultStore, FREE_STORAGE_LIMIT } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import {
  getMessagesForUser,
  sendUserMessage,
  markUserMessagesRead,
  getUnreadForUser,
  getSubscriptionPrice,
  SupportMessage,
} from '../lib/supportChat';
import { fetchAdminSettingsFromCloud } from '../lib/premiumRequests';

export const Settings: React.FC = () => {
  const { user, files, folders, passwords, notes, reminders, updateProfile, logout, isPremium, paymentStatus, premiumTransactionId, submitPremiumPayment, approvePayment, backupData, restoreData, syncFromSupabase } = useVaultStore();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<'profile' | 'storage' | 'notifications' | 'security' | 'install' | 'support' | 'backup'>('profile');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  // Premium modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Backup & Restore state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // PWA install
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [installResult, setInstallResult] = useState<'accepted' | 'dismissed' | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installGuideTab, setInstallGuideTab] = useState<'chrome' | 'android' | 'ios' | 'edge'>('chrome');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    if (isIOS) setInstallGuideTab('ios');
    else if (isAndroid) setInstallGuideTab('android');
    else if (/Edg\//.test(navigator.userAgent)) setInstallGuideTab('edge');
    else setInstallGuideTab('chrome');
  }, []);

  const handleInstallApp = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      setInstallResult(accepted ? 'accepted' : 'dismissed');
    } else {
      setShowInstallGuide(true);
    }
  };


  // Support chat state
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatUnread, setChatUnread] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [subscriptionPrice, setSubscriptionPriceState] = useState(getSubscriptionPrice);

  useEffect(() => {
    if (user?.email) {
      const load = () => {
        setChatMessages(getMessagesForUser(user.email!));
        setChatUnread(getUnreadForUser(user.email!));
      };
      load();
      window.addEventListener('storage', load);
      window.addEventListener('vaultify-chat-updated' as any, load);
      return () => {
        window.removeEventListener('storage', load);
        window.removeEventListener('vaultify-chat-updated' as any, load);
      };
    }
  }, [user?.email]);

  useEffect(() => {
    if (activeSection === 'support' && user?.email) {
      markUserMessagesRead(user.email);
      setChatUnread(0);
    }
  }, [activeSection, user?.email]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vaultify-subscription-price') {
        setSubscriptionPriceState(getSubscriptionPrice());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Fetch latest admin settings from cloud on mount so subscription price,
  // free tier limit, etc. reflect whatever the admin has set.
  useEffect(() => {
    fetchAdminSettingsFromCloud().then(cfg => {
      if (cfg?.subscriptionPrice && cfg.subscriptionPrice > 0) {
        localStorage.setItem('vaultify-subscription-price', String(cfg.subscriptionPrice));
        setSubscriptionPriceState(cfg.subscriptionPrice);
      }
    }).catch(() => {});
  }, []);

  const handleSendChat = () => {
    if (!chatInput.trim() || !user?.email) return;
    sendUserMessage(user.email, user.id, chatInput.trim());
    setChatMessages(getMessagesForUser(user.email));
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  // Storage stats
  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(3);
  const freePct = Math.min(100, Math.round((usedBytes / FREE_STORAGE_LIMIT) * 100));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file.', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please choose an image under 5 MB.', type: 'error' });
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resizeImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        } else {
          if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = url;
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setIsSaving(true);
    try {
      let avatarUrl = user?.avatarUrl;
      if (avatarFile) {
        avatarUrl = await resizeImageToBase64(avatarFile);
      } else if (avatarPreview === null) {
        avatarUrl = undefined;
      }
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim(), avatar_url: avatarUrl } });
        if (error) { toast({ title: 'Update Failed', description: error.message, type: 'error' }); return; }
      }
      updateProfile({ fullName: fullName.trim(), avatarUrl });
      setAvatarFile(null);
      toast({ title: 'Profile Updated', type: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Something went wrong.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const clearAllClientData = async () => {
    if (confirm('This will sign you out and clear all locally cached data. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      await logout();
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await backupData();
      toast({ title: 'Backup Downloaded', description: 'Your vault backup file has been saved.', type: 'success' });
    } catch {
      toast({ title: 'Backup Failed', description: 'Could not create backup file.', type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (backupInputRef.current) backupInputRef.current.value = '';
    setIsRestoring(true);
    setRestoreResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = ev.target?.result as string;
        const result = await restoreData(json);
        setRestoreResult(result);
        if (result.success) {
          toast({ title: 'Restore Complete', description: result.message, type: 'success' });
        } else {
          toast({ title: 'Restore Failed', description: result.message, type: 'error' });
        }
      } catch {
        const msg = 'Could not read the backup file.';
        setRestoreResult({ success: false, message: msg });
        toast({ title: 'Restore Failed', description: msg, type: 'error' });
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const ok = await syncFromSupabase();
      if (ok) {
        toast({ title: 'Sync Complete', description: 'Your vault is up to date.', type: 'success' });
      } else {
        toast({ title: 'Sync Issue', description: 'Could not reach cloud. Check your connection.', type: 'error' });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file.', type: 'error' });
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async () => {
    if (!screenshotPreview) {
      toast({ title: 'Screenshot Required', description: 'Please upload your transaction screenshot.', type: 'error' });
      return;
    }
    submitPremiumPayment(screenshotPreview);
    setSubmitted(true);
    toast({ title: 'Payment Submitted', description: 'Your payment screenshot is under admin review.', type: 'success' });
  };

  const handleAdminApprove = () => {
    approvePayment();
    setShowPaymentModal(false);
    toast({ title: 'Premium Activated Successfully!', description: 'You now have unlimited storage.', type: 'success' });
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-6 pb-12 select-none max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Settings</h1>
            {isPremium && (
              <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Manage your account and preferences.</p>
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
            { id: 'storage', label: 'Storage & Plans', icon: HardDrive },
            { id: 'backup', label: 'Backup & Restore', icon: ArchiveRestore },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: ShieldCheck },
            { id: 'install', label: 'Install App', icon: Smartphone },
            { id: 'support', label: 'Help & Support', icon: MessageSquare, badge: chatUnread },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeSection === (item.id as any);
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
                <span className="flex-1">{item.label}</span>
                {(item as any).badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">
                    {(item as any).badge}
                  </span>
                )}
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
                <p className="text-xs text-gray-400 mt-0.5">Update your display name and profile photo.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-500/40 shadow-lg" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center ring-2 ring-blue-500/20 shadow-lg">
                        <span className="text-white font-bold text-2xl">{initials}</span>
                      </div>
                    )}
                    {avatarPreview && (
                      <button type="button" onClick={removeAvatar} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all">
                    <Camera className="w-4 h-4" />
                    <span>{avatarPreview ? 'Change Photo' : 'Add Profile Photo'}</span>
                  </button>
                  <p className="text-[10px] text-gray-600">Accepts JPG, PNG, WEBP — max 5 MB</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Full Name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Email Address</label>
                  <input type="email" readOnly value={user?.email || ''} className="w-full bg-white/[0.02] text-gray-400 text-xs rounded-xl px-3.5 py-2.5 border border-white/5 outline-none cursor-not-allowed" />
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
                  <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSaving ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving...</span></>
                    ) : <span>Save Profile</span>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STORAGE & PLANS */}
          {activeSection === 'storage' && (
            <div className="space-y-4">
              {/* Current Plan Card */}
              <div className={`rounded-3xl p-6 border ${isPremium ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/30' : 'glass-panel-premium border-white/10'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isPremium ? (
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Crown className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                        <HardDrive className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">{isPremium ? 'Premium Plan' : 'Free Plan'}</h3>
                      <p className="text-[11px] text-gray-400">{isPremium ? 'Unlimited device storage' : '5 GB device storage limit'}</p>
                    </div>
                  </div>
                  {isPremium && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-500/20">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Storage Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Device storage used</span>
                    <span className="font-semibold text-white">{usedMB} MB ({usedGB} GB)</span>
                  </div>
                  {!isPremium && (
                    <>
                      <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            freePct > 80 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                          style={{ width: `${Math.max(2, freePct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>{freePct}% of 5 GB used</span>
                        <span>{(5 - parseFloat(usedGB)).toFixed(2)} GB remaining</span>
                      </div>
                    </>
                  )}
                  {isPremium && (
                    <div className="text-[11px] text-amber-300/80">
                      Your storage is only limited by your device's available space.
                    </div>
                  )}
                </div>
              </div>

              {/* Upgrade Section (shown only if NOT premium) */}
              {!isPremium && (
                <div className="rounded-3xl p-6 border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Upgrade to Premium</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Unlock unlimited storage forever for just Rs.{subscriptionPrice}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: HardDrive, label: 'Unlimited Storage', desc: 'Only limited by your device' },
                      { icon: Crown, label: 'One-time Payment', desc: 'Pay once, use forever' },
                      { icon: Lock, label: 'No Subscriptions', desc: `Rs.${subscriptionPrice} lifetime access` },
                      { icon: ShieldCheck, label: 'All Features', desc: 'Full vault access' },
                    ].map((f, i) => {
                      const Icon = f.icon;
                      return (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
                          <Icon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[11px] font-semibold text-white">{f.label}</p>
                            <p className="text-[10px] text-gray-500">{f.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {paymentStatus === 'pending' ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-300">Verification Pending</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Your screenshot is being reviewed by admin. Premium will be activated after verification.</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setShowPaymentModal(true); setSubmitted(false); setScreenshotFile(null); setScreenshotPreview(null); }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Unlock Now — Rs.{subscriptionPrice} Lifetime</span>
                    </button>
                  )}
                </div>
              )}

              {/* Clear Data */}
              <div className="rounded-3xl p-6 glass-panel-premium border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Data Management</h3>
                <button
                  onClick={clearAllClientData}
                  className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Local Cache & Sign Out</span>
                </button>
                <p className="text-[9px] text-center text-gray-500">
                  Signs you out and clears locally cached data. Your data stored in IndexedDB on this device will be removed.
                </p>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    Account Security
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Your vault is protected with email authentication and end-to-end encryption.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Email Authentication', status: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'End-to-End Encryption', status: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Supabase Auth', status: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                      <span className="text-xs text-gray-300">{item.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.color} ${item.bg}`}>{item.status}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    All your vault data is encrypted and stored securely. You can always use your email and password to sign in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INSTALL APP */}
          {activeSection === 'install' && (
            <div className="space-y-4">
              <div className={`rounded-3xl p-6 border ${isInstalled ? 'bg-emerald-950/30 border-emerald-500/25' : 'glass-panel-premium border-white/10'}`}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${isInstalled ? 'bg-emerald-500/20' : 'bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-900/40'}`}>
                    <Smartphone className={`w-7 h-7 ${isInstalled ? 'text-emerald-400' : 'text-white'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">Install Vaultify on Device</h3>
                      {isInstalled && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">✓ Installed</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {isInstalled ? 'Running as a standalone app on this device.' : 'Add to your home screen — no app store needed.'}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  {[
                    { icon: '⚡', label: 'Instant open', desc: 'No browser tab' },
                    { icon: '📴', label: 'Works offline', desc: 'No internet needed' },
                    { icon: '🔒', label: 'Private', desc: 'Sandboxed & secure' },
                    { icon: '🖥️', label: 'Full screen', desc: 'App-like feel' },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                      <p className="text-xl mb-1">{f.icon}</p>
                      <p className="text-[11px] font-semibold text-white">{f.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{f.desc}</p>
                    </div>
                  ))}
                </div>

                {isInstalled ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-300">Already installed on this device</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">You're using Vaultify as an installed app. Enjoy the full experience!</p>
                    </div>
                  </div>
                ) : installResult === 'accepted' ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm font-bold text-emerald-300">Installation started! Check your home screen.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* THE REAL INSTALL BUTTON — always visible */}
                    <button
                      onClick={handleInstallApp}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-sm font-bold transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-blue-900/40"
                    >
                      <Download className="w-5 h-5" />
                      {canInstall ? 'Install Vaultify — Add to Home Screen' : 'How to Install Vaultify'}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center">
                      {canInstall ? 'One click · No app store · Free forever' : 'Tap to see step-by-step installation guide'}
                    </p>
                  </div>
                )}

                {/* How-to guide — shown when browser hasn't offered native prompt */}
                <AnimatePresence>
                  {showInstallGuide && !isInstalled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex border-b border-white/[0.06] overflow-x-auto">
                          {[
                            { id: 'chrome', label: 'Chrome', emoji: '🌐' },
                            { id: 'edge', label: 'Edge', emoji: '🔷' },
                            { id: 'android', label: 'Android', emoji: '🤖' },
                            { id: 'ios', label: 'iPhone/iPad', emoji: '🍎' },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setInstallGuideTab(tab.id as any)}
                              className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                                installGuideTab === tab.id
                                  ? 'text-blue-300 border-b-2 border-blue-400 bg-blue-500/10'
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <span>{tab.emoji}</span>
                              <span>{tab.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Steps */}
                        <div className="p-4">
                          {installGuideTab === 'chrome' && (
                            <ol className="space-y-3">
                              {[
                                <>Look for the <span className="font-bold text-white">⊕ install</span> icon in your address bar (right side) and click it</>,
                                <>Or click the <span className="font-bold text-white">⋮ menu</span> (three dots) in the top-right corner</>,
                                <>Select <span className="font-bold text-white">"Install Vaultify…"</span> or <span className="font-bold text-white">"Save and share → Install page as app"</span></>,
                                <>Click <span className="font-bold text-white">"Install"</span> — Vaultify opens as a standalone window on your desktop/device</>,
                              ].map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <span className="text-[11px] text-gray-300 leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                          {installGuideTab === 'edge' && (
                            <ol className="space-y-3">
                              {[
                                <>Look for the <span className="font-bold text-white">⊕ install</span> icon in the address bar and click it</>,
                                <>Or click the <span className="font-bold text-white">… menu</span> (three dots) → <span className="font-bold text-white">Apps</span></>,
                                <>Select <span className="font-bold text-white">"Install this site as an app"</span></>,
                                <>Click <span className="font-bold text-white">"Install"</span> to confirm</>,
                              ].map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <span className="text-[11px] text-gray-300 leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                          {installGuideTab === 'android' && (
                            <ol className="space-y-3">
                              {[
                                <>Open Vaultify in <span className="font-bold text-white">Chrome for Android</span></>,
                                <>Tap the <span className="font-bold text-white">⋮ menu</span> in the top-right corner</>,
                                <>Tap <span className="font-bold text-white">"Add to Home screen"</span></>,
                                <>Tap <span className="font-bold text-white">"Add"</span> — the Vaultify icon appears on your home screen</>,
                              ].map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <span className="text-[11px] text-gray-300 leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                          {installGuideTab === 'ios' && (
                            <ol className="space-y-3">
                              {[
                                <>Open Vaultify in <span className="font-bold text-white">Safari</span> (iOS requires Safari for installation)</>,
                                <>Tap the <span className="font-bold text-white">Share ↑</span> button at the bottom of Safari</>,
                                <>Scroll down and tap <span className="font-bold text-white">"Add to Home Screen"</span></>,
                                <>Tap <span className="font-bold text-white">"Add"</span> in the top-right — Vaultify appears on your home screen</>,
                              ].map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <span className="text-[11px] text-gray-300 leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                          <button
                            onClick={() => setShowInstallGuide(false)}
                            className="mt-4 w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white text-xs font-medium transition-colors"
                          >
                            Close guide
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* BACKUP & RESTORE */}
          {activeSection === 'backup' && (
            <div className="space-y-4">

              {/* How it works — top explainer */}
              <div className="glass-panel-premium rounded-3xl p-5 border border-blue-500/20 bg-blue-500/[0.03] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 flex-shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">How Vaultify stores your data</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                    <p className="font-bold text-blue-300 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> On this device</p>
                    <p className="text-gray-400 leading-relaxed">The actual file contents (photos, PDFs, documents) are stored in your browser's private storage on this device only. They never leave your device automatically.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                    <p className="font-bold text-violet-300 flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> In the cloud</p>
                    <p className="text-gray-400 leading-relaxed">File names, categories, passwords, notes, and reminders are always synced to the cloud so you can see them on any device using the same email.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20">
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-300">Important:</strong> Files under 20 MB are also backed up to the cloud automatically and can sync to other devices. Files larger than 20 MB exist only on this device — use the Backup feature below to move them to a new device.
                  </p>
                </div>
              </div>

              {/* Sync Now */}
              <div className="glass-panel-premium rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sync from Cloud</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Pull the latest data from all your devices right now.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <p className="text-[11px] font-semibold text-gray-300">When to use Sync Now:</p>
                  <ul className="text-[11px] text-gray-400 space-y-1.5">
                    <li className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> You added files on another device and want to see them here immediately</li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> You deleted something on one device and want this device to reflect that</li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> Sync also runs automatically every time you open or return to the app</li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Files', count: files.length },
                    { label: 'Folders', count: folders.length },
                    { label: 'Passwords', count: passwords.length },
                    { label: 'Notes', count: notes.length },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-lg font-black text-white">{item.count}</p>
                      <p className="text-[11px] text-gray-400">{item.label}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="w-full py-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSyncing ? (
                    <><div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" /><span>Syncing...</span></>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /><span>Sync Now</span></>
                  )}
                </button>
              </div>

              {/* Backup — step-by-step */}
              <div className="glass-panel-premium rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Export Backup</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Download everything in your vault as a single file you can keep safely.</p>
                  </div>
                </div>

                {/* What's in a backup */}
                <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 space-y-2">
                  <p className="text-[11px] font-bold text-emerald-300">What gets saved in your backup file:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { icon: '📄', text: 'All uploaded files (actual content, up to 20 MB per file)' },
                      { icon: '📁', text: 'Folders and file organisation' },
                      { icon: '🔑', text: 'Saved passwords' },
                      { icon: '📝', text: 'Notes' },
                      { icon: '⏰', text: 'Reminders and expiry dates' },
                      { icon: '🏷️', text: 'Categories and tags' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-400">
                        <span className="text-sm leading-tight">{item.icon}</span>
                        <span className="leading-tight">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-step how to backup */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-300">How to back up your vault:</p>
                  {[
                    { step: '1', text: 'Tap "Download Backup" below on your current device.' },
                    { step: '2', text: 'A file named vaultify-backup-[date].json will be saved to your Downloads folder.' },
                    { step: '3', text: 'Move this file somewhere safe — Google Drive, iCloud, email yourself, or a USB drive.' },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02]">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</span>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    <strong className="text-gray-400">Tip:</strong> Make a new backup whenever you add important files. The backup file is just a text file (.json) — it is safe and readable only by Vaultify's restore feature.
                  </p>
                </div>

                <button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="w-full py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBackingUp ? (
                    <><div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" /><span>Preparing Backup...</span></>
                  ) : (
                    <><FileDown className="w-4 h-4" /><span>Download Backup</span></>
                  )}
                </button>
              </div>

              {/* Restore — step-by-step */}
              <div className="glass-panel-premium rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <ArchiveRestore className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Restore from Backup</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Transfer your entire vault to a new phone or browser from a backup file.</p>
                  </div>
                </div>

                {/* Step-by-step how to restore */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-300">How to restore on a new device:</p>
                  {[
                    { step: '1', color: 'bg-indigo-500/20 text-indigo-400', text: 'On your old device — go to Settings → Backup & Restore and tap "Download Backup" to get the latest backup file.' },
                    { step: '2', color: 'bg-indigo-500/20 text-indigo-400', text: 'Transfer the backup file to your new device. You can use Google Drive, iCloud, WhatsApp, email, or a USB cable.' },
                    { step: '3', color: 'bg-indigo-500/20 text-indigo-400', text: 'On your new device — open Vaultify, log in with the same email address.' },
                    { step: '4', color: 'bg-indigo-500/20 text-indigo-400', text: 'Go to Settings → Backup & Restore, scroll down and tap "Select Backup File". Choose the backup file you transferred.' },
                    { step: '5', color: 'bg-emerald-500/20 text-emerald-400', text: 'Done! All your files, passwords, notes, and folders will be restored. Opening any file should now work normally.' },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02]">
                      <span className={`w-5 h-5 rounded-full ${s.color} text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5`}>{s.step}</span>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>

                {/* Safety notice */}
                <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 space-y-1.5">
                  <p className="text-[11px] font-bold text-amber-300">Good to know before restoring:</p>
                  <ul className="text-[11px] text-gray-400 space-y-1.5">
                    <li className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">✓</span> <span><strong className="text-gray-300">Completely safe</strong> — restore only adds items missing on this device. It never deletes or overwrites anything already here.</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">✓</span> <span><strong className="text-gray-300">Can run multiple times</strong> — if a restore is interrupted, just run it again. Duplicate items will not be created.</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">✓</span> <span><strong className="text-gray-300">Files open immediately</strong> — after restoring, tap any file in the vault to open or preview it right away.</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">✓</span> <span><strong className="text-gray-300">Same account required</strong> — you must be logged in with the same email address the backup was made from.</span></li>
                  </ul>
                </div>

                <input
                  ref={backupInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
                {restoreResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl flex items-center gap-2.5 ${restoreResult.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}
                  >
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${restoreResult.success ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <p className={`text-xs font-semibold ${restoreResult.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {restoreResult.message}
                    </p>
                  </motion.div>
                )}
                <button
                  onClick={() => backupInputRef.current?.click()}
                  disabled={isRestoring}
                  className="w-full py-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRestoring ? (
                    <><div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" /><span>Restoring... please wait</span></>
                  ) : (
                    <><ArchiveRestore className="w-4 h-4" /><span>Select Backup File to Restore</span></>
                  )}
                </button>
                <p className="text-[10px] text-gray-600 text-center">Select the .json file you downloaded using "Download Backup" above</p>
              </div>

              {/* FAQ */}
              <div className="glass-panel-premium rounded-3xl p-5 border border-white/10 space-y-3">
                <p className="text-xs font-bold text-white">Frequently asked questions</p>
                {[
                  {
                    q: 'My files show "No preview available" after restoring — is that normal?',
                    a: 'No — after a successful restore, all files should open immediately. If a file still shows no preview, try tapping "Sync Now" above and then open the file again.',
                  },
                  {
                    q: 'Do I need to be connected to the internet to restore?',
                    a: 'You need an internet connection to log in and to sync metadata. The actual file contents come from the backup file, so they restore even with a slow connection.',
                  },
                  {
                    q: 'What happens if I restore on a device that already has some files?',
                    a: 'Only missing items are added. Files already present on this device are never duplicated or overwritten.',
                  },
                  {
                    q: 'Will deleting a file on one device delete it on my other device too?',
                    a: 'Yes — deletions sync automatically. When you return to your other device (or tap Sync Now), the deleted file will disappear there too.',
                  },
                ].map((faq, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                    <p className="text-[11px] font-semibold text-gray-200">Q: {faq.q}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">A: {faq.a}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Notification Preferences</h3>
                <p className="text-xs text-gray-400 mt-0.5">Choose how you want to be alerted before your items expire.</p>
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
                      onChange={(e) => { opt.set(e.target.checked); toast({ title: 'Preference Saved', type: 'info' }); }}
                      className="rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <p className="text-[11px] text-gray-400 leading-tight">You can change these options anytime. All notifications are free.</p>
              </div>
            </div>
          )}

          {/* SUPPORT / CHAT */}
          {activeSection === 'support' && (
            <div className="glass-panel-premium rounded-3xl border border-white/10 overflow-hidden flex flex-col" style={{ height: 520 }}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-950/40 to-slate-900 flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chat with Creator</h3>
                  <p className="text-[10px] text-gray-400">Send a message — Bishal (admin) will reply here.</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Start a conversation</p>
                      <p className="text-[11px] text-gray-400 mt-1">Ask anything — billing, features, or just say hi.</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.isFromAdmin
                          ? 'bg-slate-800 border border-white/10 text-gray-200 rounded-tl-sm'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                      }`}>
                        {msg.isFromAdmin && (
                          <p className="text-[9px] font-bold text-blue-400 mb-0.5 uppercase tracking-wider">Bishal</p>
                        )}
                        <p>{msg.message}</p>
                        <p className={`text-[9px] mt-1 ${msg.isFromAdmin ? 'text-gray-500' : 'text-white/60'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-sm bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-950/60 to-slate-900">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Upgrade to Premium</span>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {!submitted ? (
                  <>
                    {/* Price Banner */}
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">Rs.{subscriptionPrice}</p>
                      <p className="text-xs text-gray-400">One-time payment · Lifetime unlimited storage</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-full max-w-[260px] mx-auto bg-white rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-xl">
                        <img 
                          src="/qr.png" 
                          alt="Payment QR Code" 
                          className="w-full h-auto object-contain"
                          onError={(e) => {
                            const t = e.currentTarget;
                            t.style.display = 'none';
                            t.nextElementSibling?.removeAttribute('style');
                          }}
                        />
                        <div style={{ display: 'none' }} className="flex flex-col items-center gap-2 text-center p-6">
                          <QrCode className="w-14 h-14 text-gray-400" />
                          <p className="text-[10px] text-gray-500">QR code image not found.</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 text-center">Scan to pay Rs.{subscriptionPrice} · Siddhartha Bank</p>
                    </div>

                    {/* Screenshot Upload */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Upload Transaction Screenshot</label>
                      <input
                        ref={screenshotInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                      {screenshotPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-indigo-500/30">
                          <img src={screenshotPreview} alt="Transaction Screenshot" className="w-full h-40 object-cover" />
                          <button
                            type="button"
                            onClick={() => { setScreenshotPreview(null); setScreenshotFile(null); if (screenshotInputRef.current) screenshotInputRef.current.value = ''; }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                            <p className="text-[10px] text-white font-medium">Screenshot uploaded ✓</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => screenshotInputRef.current?.click()}
                          className="w-full py-4 rounded-xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-semibold transition-all flex flex-col items-center gap-2"
                        >
                          <ImageIcon className="w-6 h-6" />
                          <span>Put your Transaction Screenshot here</span>
                          <span className="text-[10px] text-gray-500 font-normal">Tap to upload · JPG, PNG, WEBP</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleSubmitPayment}
                      disabled={!screenshotPreview}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Submit for Admin Verification
                    </button>

                    {/* Hidden admin button — long-press title bar 5× to reveal */}
                    <div className="text-center">
                      <button 
                        onClick={() => setShowAdmin(p => !p)}
                        className="text-[9px] text-white/10 hover:text-white/20 transition-colors"
                      >
                        ···
                      </button>
                      {showAdmin && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={handleAdminApprove}
                          className="mt-2 block w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                        >
                          ✓ Approve Payment (Admin)
                        </motion.button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Clock className="w-8 h-8 text-amber-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Your payment is under review</p>
                      <p className="text-xs text-gray-400 mt-1">Premium will be activated after verification.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2.5 text-left">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500">Screenshot submitted</p>
                        <p className="text-xs text-emerald-300 font-semibold">Payment screenshot sent to admin for review</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-[11px] text-amber-300/80">Status: <strong>Verification Pending</strong></p>
                    </div>
                    {showAdmin && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={handleAdminApprove}
                        className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                      >
                        ✓ Approve Payment (Admin)
                      </motion.button>
                    )}
                    <button onClick={() => setShowAdmin(p => !p)} className="text-[9px] text-white/10 hover:text-white/20">···</button>
                    <button onClick={() => setShowPaymentModal(false)} className="w-full py-2 rounded-xl bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-colors">Close</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
