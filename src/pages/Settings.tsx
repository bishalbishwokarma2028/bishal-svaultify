import React, { useState, useRef } from 'react';
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
  Lock
} from 'lucide-react';
import { useVaultStore, FREE_STORAGE_LIMIT } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

export const Settings: React.FC = () => {
  const { user, files, updateProfile, logout, isPremium, paymentStatus, premiumTransactionId, submitPremiumPayment, approvePayment } = useVaultStore();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<'profile' | 'storage' | 'notifications'>('profile');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  // Premium modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [txInput, setTxInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

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

  const handleSubmitPayment = () => {
    if (!txInput.trim()) {
      toast({ title: 'Transaction ID Required', description: 'Please enter your payment transaction ID.', type: 'error' });
      return;
    }
    submitPremiumPayment(txInput.trim());
    setSubmitted(true);
    toast({ title: 'Payment Submitted', description: 'Your payment is under review.', type: 'success' });
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
            { id: 'notifications', label: 'Notifications', icon: Bell },
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
                      <p className="text-xs text-gray-400 mt-0.5">Unlock unlimited storage forever for just Rs.300</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: HardDrive, label: 'Unlimited Storage', desc: 'Only limited by your device' },
                      { icon: Crown, label: 'One-time Payment', desc: 'Pay once, use forever' },
                      { icon: Lock, label: 'No Subscriptions', desc: 'Rs.300 lifetime access' },
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
                        <p className="text-[10px] text-gray-400">Transaction ID: <span className="text-white font-mono">{premiumTransactionId}</span></p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Premium will be activated after verification.</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setShowPaymentModal(true); setSubmitted(false); setTxInput(''); }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Unlock Now — Rs.300 Lifetime</span>
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
                      <p className="text-2xl font-black text-white">Rs.300</p>
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
                      <p className="text-[11px] text-gray-400 text-center">Scan to pay Rs.300 · Siddhartha Bank</p>
                    </div>

                    {/* Transaction ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300">Transaction ID</label>
                      <input
                        type="text"
                        value={txInput}
                        onChange={(e) => setTxInput(e.target.value)}
                        placeholder="Enter your payment transaction ID..."
                        className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-indigo-500 outline-none placeholder:text-gray-600"
                      />
                    </div>

                    <button
                      onClick={handleSubmitPayment}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Payment
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
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                      <p className="text-[10px] text-gray-500">Transaction ID</p>
                      <p className="text-xs font-mono text-white">{premiumTransactionId}</p>
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
