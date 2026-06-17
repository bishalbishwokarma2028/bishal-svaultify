import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Crown,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  Users,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Plus,
  Trash2,
  BarChart3,
  Server,
  Settings,
  Bell,
  Shield,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  Sun,
  Moon,
  Image as ImageIcon,
  MessageSquare,
  Send,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import {
  getAllRequests,
  updateRequestStatus,
  addApprovedEmail,
  removeApprovedEmail,
  getApprovedEmails,
  getUsersRegistry,
  getAdminSession,
  setAdminSession,
  clearAdminSession,
  pushAdminSettingsToCloud,
  fetchTxScreenshots,
  deleteTxScreenshot,
  fetchCloudUsersRegistry,
  fetchPremiumRequestsFromCloud,
  updateCloudRequestStatus,
  deleteTxScreenshotByEmail,
  PremiumRequest,
  RegisteredUser,
  TxScreenshot,
} from '../lib/premiumRequests';
import {
  getAllConversations,
  sendAdminReply,
  markAdminRead,
  getUnreadAdminTotal,
  getSubscriptionPrice,
  setSubscriptionPrice,
  Conversation,
} from '../lib/supportChat';

const ADMIN_EMAIL = 'bishalbishwokarma089@gmail.com';
const ADMIN_PASSWORD = 'bishal@ado@9746294386';

const APP_VERSION = '2.1.0';
const FREE_LIMIT_GB = 5;

type AdminTab = 'requests' | 'users' | 'stats' | 'settings' | 'announce' | 'messages' | 'access' | 'screenshots';

export const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => getAdminSession());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminTheme, setAdminTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('vaultify-admin-theme') as 'dark' | 'light') || 'dark');

  const toggleAdminTheme = () => {
    const next = adminTheme === 'dark' ? 'light' : 'dark';
    setAdminTheme(next);
    localStorage.setItem('vaultify-admin-theme', next);
  };
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [cloudRequests, setCloudRequests] = useState<PremiumRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [approvedEmails, setApprovedEmails] = useState<string[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [addEmailInput, setAddEmailInput] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const [freeLimit, setFreeLimit] = useState(FREE_LIMIT_GB);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Messages state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvEmail, setSelectedConvEmail] = useState<string | null>(null);
  const [adminReplyInput, setAdminReplyInput] = useState('');
  const [messagesUnread, setMessagesUnread] = useState(0);
  const adminChatEndRef = React.useRef<HTMLDivElement>(null);

  // Subscription price state
  const [priceInput, setPriceInput] = useState(() => String(getSubscriptionPrice()));
  const [priceSaved, setPriceSaved] = useState(false);

  // Transaction Screenshots state
  const [txScreenshots, setTxScreenshots] = useState<TxScreenshot[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [screenshotsError, setScreenshotsError] = useState<string | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<TxScreenshot | null>(null);
  const [deletingScreenshotId, setDeletingScreenshotId] = useState<string | null>(null);

  // Cloud user registry state
  const [cloudUsers, setCloudUsers] = useState<RegisteredUser[]>([]);
  const [cloudUsersLoading, setCloudUsersLoading] = useState(false);

  // Plan access control state
  const PLAN_SECTIONS = [
    { id: 'vault', label: 'Digital Vault', desc: 'File storage and management', icon: '🗄️' },
    { id: 'passwords', label: 'Password Vault', desc: 'Password manager', icon: '🔑' },
    { id: 'notes', label: 'Secure Notes', desc: 'Encrypted note-taking', icon: '📝' },
    { id: 'reminders', label: 'Expiry Reminders', desc: 'Document expiry alerts', icon: '⏰' },
    { id: 'hidden-vault', label: 'Hidden Vault', desc: 'Calculator-disguised vault', icon: '👁️' },
    { id: 'scanner', label: 'Document Scanner', desc: 'Scan and save documents', icon: '📷' },
    { id: 'search', label: 'Smart Search', desc: 'Global search across vault', icon: '🔍' },
  ];
  const [planAccess, setPlanAccess] = useState<Record<string, 'free' | 'premium'>>(() => {
    try { return JSON.parse(localStorage.getItem('vaultify-plan-access') || '{}'); } catch { return {}; }
  });
  const handleToggleAccess = (sectionId: string) => {
    const current = planAccess[sectionId] || 'free';
    const next = current === 'free' ? 'premium' : 'free';
    const updated = { ...planAccess, [sectionId]: next };
    setPlanAccess(updated);
    try { localStorage.setItem('vaultify-plan-access', JSON.stringify(updated)); } catch { /* ignore */ }
    flash(`${sectionId} is now ${next === 'premium' ? 'Premium Only' : 'Free for All'}`);
    pushAllToCloud({ planAccessOverride: updated });
  };

  const pushAllToCloud = (overrides: {
    approvedEmailsOverride?: string[];
    priceOverride?: number;
    planAccessOverride?: Record<string, 'free' | 'premium'>;
    freeLimitOverride?: number;
    announcementOverride?: string;
  } = {}) => {
    const emails = overrides.approvedEmailsOverride ?? getApprovedEmails();
    const price = overrides.priceOverride ?? getSubscriptionPrice();
    const access = overrides.planAccessOverride ?? JSON.parse(localStorage.getItem('vaultify-plan-access') || '{}');
    const limitGb = overrides.freeLimitOverride ?? Number(localStorage.getItem('vaultify-admin-free-limit-gb') || FREE_LIMIT_GB);
    const ann = overrides.announcementOverride ?? (localStorage.getItem('vaultify-admin-announcement') || '');
    pushAdminSettingsToCloud({
      approvedEmails: emails,
      subscriptionPrice: price,
      freeStorageLimitGB: limitGb,
      planAccess: access,
      announcement: ann,
      updatedAt: new Date().toISOString(),
    });
  };

  const loadData = async () => {
    setRequests(getAllRequests());
    setApprovedEmails(getApprovedEmails());
    setRegisteredUsers(getUsersRegistry());
    // Fetch cloud requests (from all user devices)
    setRequestsLoading(true);
    try {
      const cloud = await fetchPremiumRequestsFromCloud();
      setCloudRequests(cloud);
    } catch {
      /* non-fatal */
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadMessages = () => {
    setConversations(getAllConversations());
    setMessagesUnread(getUnreadAdminTotal());
  };

  const loadTxScreenshots = async () => {
    setScreenshotsLoading(true);
    setScreenshotsError(null);
    try {
      const data = await fetchTxScreenshots();
      setTxScreenshots(data.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()));
    } catch (e: any) {
      setScreenshotsError(e?.message || 'Failed to load screenshots from cloud.');
    } finally {
      setScreenshotsLoading(false);
    }
  };

  const loadCloudUsers = async () => {
    setCloudUsersLoading(true);
    try {
      const data = await fetchCloudUsersRegistry();
      setCloudUsers(data);
    } finally {
      setCloudUsersLoading(false);
    }
  };

  const handleDeleteTxScreenshot = async (id: string) => {
    setDeletingScreenshotId(id);
    try {
      await deleteTxScreenshot(id);
      setTxScreenshots(prev => prev.filter(s => s.id !== id));
      if (viewingScreenshot?.id === id) setViewingScreenshot(null);
      flash('Screenshot deleted from cloud.');
    } finally {
      setDeletingScreenshotId(null);
    }
  };

  useEffect(() => {
    if (isLoggedIn) { loadData(); loadMessages(); }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const saved = localStorage.getItem('vaultify-admin-announcement');
      if (saved) setAnnouncement(saved);
      const savedLimit = localStorage.getItem('vaultify-admin-free-limit-gb');
      if (savedLimit) setFreeLimit(Number(savedLimit));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeTab === 'screenshots' && isLoggedIn) { loadTxScreenshots(); }
    if (activeTab === 'users' && isLoggedIn) { loadCloudUsers(); }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'messages' && selectedConvEmail) {
      markAdminRead(selectedConvEmail);
      loadMessages();
    }
    adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, selectedConvEmail, conversations]);

  const handleSavePrice = () => {
    const p = Number(priceInput);
    if (!p || p < 1) return;
    setSubscriptionPrice(p);
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 2000);
    flash(`Subscription price updated to Rs.${p}`);
    pushAllToCloud({ priceOverride: p });
  };

  const handleAdminSendReply = () => {
    if (!adminReplyInput.trim() || !selectedConvEmail) return;
    sendAdminReply(selectedConvEmail, adminReplyInput.trim());
    setAdminReplyInput('');
    loadMessages();
    setTimeout(() => adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password.trim() === ADMIN_PASSWORD.trim()
    ) {
      setAdminSession();
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid admin credentials. Check email and password.');
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsLoggedIn(false);
  };

  const handleApprove = (req: PremiumRequest) => {
    updateRequestStatus(req.email, 'approved');
    addApprovedEmail(req.email);
    loadData();
    flash(`Premium approved for ${req.email}`);
    pushAllToCloud();
    updateCloudRequestStatus(req.id, 'approved');
    deleteTxScreenshotByEmail(req.email);
    // Optimistically update cloud requests state so UI reflects immediately
    setCloudRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' as const, reviewedAt: new Date().toISOString() } : r));
  };

  const handleReject = (req: PremiumRequest) => {
    updateRequestStatus(req.email, 'rejected');
    removeApprovedEmail(req.email);
    loadData();
    flash(`Request rejected for ${req.email}`);
    pushAllToCloud();
    updateCloudRequestStatus(req.id, 'rejected');
    deleteTxScreenshotByEmail(req.email);
    // Optimistically update cloud requests state so UI reflects immediately
    setCloudRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' as const, reviewedAt: new Date().toISOString() } : r));
  };

  const handleManualAdd = () => {
    const e = addEmailInput.trim().toLowerCase();
    if (!e || !e.includes('@')) { flash('Please enter a valid email address.'); return; }
    addApprovedEmail(e);
    setAddEmailInput('');
    loadData();
    flash(`Premium manually granted to ${e}`);
    pushAllToCloud();
  };

  const handleManualRemove = (e: string) => {
    removeApprovedEmail(e);
    loadData();
    flash(`Premium revoked from ${e}`);
    pushAllToCloud();
  };

  const handleTogglePremium = (userEmail: string, currentlyPremium: boolean) => {
    if (currentlyPremium) {
      removeApprovedEmail(userEmail);
      flash(`Premium removed from ${userEmail}`);
    } else {
      addApprovedEmail(userEmail);
      flash(`Premium granted to ${userEmail}`);
    }
    loadData();
    pushAllToCloud();
  };

  const handleSaveAnnouncement = () => {
    localStorage.setItem('vaultify-admin-announcement', announcement);
    localStorage.setItem('vaultify-admin-announcement-active', announcement ? '1' : '0');
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 2000);
    flash('Announcement saved and will show to all users.');
    pushAllToCloud({ announcementOverride: announcement });
  };

  const handleSaveSettings = () => {
    localStorage.setItem('vaultify-admin-free-limit-gb', String(freeLimit));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    flash(`Settings saved. Free storage set to ${freeLimit} GB.`);
    pushAllToCloud({ freeLimitOverride: freeLimit });
  };

  const flash = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  // Merge cloud requests (authoritative) with local localStorage requests (fallback for legacy).
  // Cloud takes priority — if the same email appears in both, the cloud version wins.
  const allRequests: PremiumRequest[] = React.useMemo(() => {
    const idMap = new Map<string, PremiumRequest>();
    // Local first (may have old requests not yet in cloud)
    requests.forEach(r => idMap.set(r.id, r));
    // Cloud overrides — these come from users on any device
    cloudRequests.forEach(r => idMap.set(r.id, r));
    return Array.from(idMap.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [requests, cloudRequests]);

  const filtered = allRequests.filter(r =>
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  const counts = {
    all: allRequests.length,
    pending: allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
  };

  const approvedSet = new Set(approvedEmails.map(e => e.toLowerCase()));

  // Merge cloud users (all devices) with local registered users (this device), dedup by email
  const allUsers: RegisteredUser[] = React.useMemo(() => {
    const emailMap = new Map<string, RegisteredUser>();
    cloudUsers.forEach(u => emailMap.set(u.email.toLowerCase(), u));
    registeredUsers.forEach(u => {
      const existing = emailMap.get(u.email.toLowerCase());
      if (!existing || new Date(u.lastSignInAt) >= new Date(existing.lastSignInAt)) {
        emailMap.set(u.email.toLowerCase(), u);
      }
    });
    return Array.from(emailMap.values()).sort(
      (a, b) => new Date(b.lastSignInAt).getTime() - new Date(a.lastSignInAt).getTime()
    );
  }, [registeredUsers, cloudUsers]);

  const filteredUsers = allUsers.filter(u =>
    userSearch ? u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.fullName.toLowerCase().includes(userSearch.toLowerCase()) : true
  );

  const TABS: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'requests', label: 'Requests', icon: Crown, badge: counts.pending },
    { id: 'users', label: 'All Users', icon: Users, badge: allUsers.length || undefined },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: messagesUnread },
    { id: 'screenshots', label: 'Screenshots', icon: ImageIcon, badge: txScreenshots.length || undefined },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'announce', label: 'Announce', icon: Bell },
    { id: 'access', label: 'Plan Access', icon: ToggleLeft },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl ring-4 ring-blue-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-black text-white tracking-tight">Admin Panel</h1>
              <p className="text-xs text-gray-500 mt-0.5">VAULTIFY — Restricted Access</p>
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-slate-900/80 border border-white/10 rounded-3xl p-7 space-y-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 text-center">
              Sign in with your admin credentials to access the control panel.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
                className="w-full bg-white/[0.04] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full bg-white/[0.04] text-white text-sm rounded-xl px-4 py-3 pr-11 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xs text-rose-300">{loginError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-lg"
            >
              Sign In as Admin
            </button>
          </form>

          <p className="text-center text-[10px] text-gray-600 mt-4">
            Authorized administrators only. This panel is not accessible to regular users.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <div className={`min-h-screen text-gray-100 ${adminTheme === 'light' ? 'bg-slate-100' : 'bg-[#030712]'}`} data-admin-theme={adminTheme}>
      {/* Header */}
      <div className={`border-b backdrop-blur-xl sticky top-0 z-20 ${adminTheme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-slate-900/60 border-white/10'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className={`font-bold text-sm tracking-wide ${adminTheme === 'light' ? 'text-slate-800' : 'text-white'}`}>VAULTIFY ADMIN</span>
              <p className={`text-[10px] ${adminTheme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Control Panel v{APP_VERSION}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleAdminTheme}
              className={`p-2 rounded-xl transition-colors ${adminTheme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
              title="Toggle theme"
            >
              {adminTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={loadData}
              className={`p-2 rounded-xl transition-colors ${adminTheme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto pb-0 no-scrollbar border-t ${adminTheme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap relative border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-500 border-blue-500'
                    : adminTheme === 'light'
                    ? 'text-slate-500 border-transparent hover:text-slate-700'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Flash message */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-800 border border-white/10 text-sm text-white font-semibold shadow-2xl max-w-sm text-center"
            >
              {actionMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── REQUESTS TAB ── */}
        {activeTab === 'requests' && (
          <>
            {/* Cloud sync status bar */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-medium ${
              adminTheme === 'light' ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-blue-500/8 border border-blue-500/20 text-blue-400'
            }`}>
              <span className="flex items-center gap-2">
                {requestsLoading
                  ? <><div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" /> Loading requests from cloud…</>
                  : <><CheckCircle2 className="w-3.5 h-3.5" /> Showing {allRequests.length} request{allRequests.length !== 1 ? 's' : ''} from all devices</>
                }
              </span>
              <button
                onClick={() => loadData()}
                className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Requests', value: counts.all, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Users },
                { label: 'Pending', value: counts.pending, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
                { label: 'Approved', value: counts.approved, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
                { label: 'Rejected', value: counts.rejected, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: XCircle },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`p-4 rounded-2xl border ${stat.bg} bg-slate-900/40`}>
                    <div className="flex items-start justify-between mb-3">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                    filterStatus === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {s} ({counts[s as keyof typeof counts]})
                </button>
              ))}
            </div>

            <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <Crown className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No payment requests found.</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {requestsLoading ? 'Loading from cloud…' : 'Requests from users on any device will appear here once they submit a payment.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filtered.map((req) => (
                    <div key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <div
                        className="px-5 py-4 flex items-center gap-3 cursor-pointer"
                        onClick={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white truncate">{req.email}</p>
                            {req.status === 'pending' && <span className="flex-shrink-0 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>}
                            {req.status === 'approved' && <span className="flex-shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Approved</span>}
                            {req.status === 'rejected' && <span className="flex-shrink-0 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">Rejected</span>}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                            TX: {req.transactionId} · {new Date(req.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {req.status !== 'approved' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApprove(req); }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </button>
                          )}
                          {req.status !== 'rejected' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReject(req); }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          )}
                          {expandedReq === req.id ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                        </div>
                      </div>
                      {expandedReq === req.id && (
                        <div className="px-5 pb-5 space-y-4 text-[11px]">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-gray-500 mb-0.5">User ID</p>
                              <p className="text-white font-mono break-all">{req.userId || 'Local'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-0.5">Reference ID</p>
                              <p className="text-white font-mono">{req.transactionId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-0.5">Submitted At</p>
                              <p className="text-white">{new Date(req.submittedAt).toLocaleString()}</p>
                            </div>
                            {req.reviewedAt && (
                              <div>
                                <p className="text-gray-500 mb-0.5">Reviewed At</p>
                                <p className="text-white">{new Date(req.reviewedAt).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                          {req.screenshotBase64 ? (
                            <div className="space-y-2">
                              <p className="text-gray-500 flex items-center gap-1.5">
                                <ImageIcon className="w-3 h-3" />
                                Transaction Screenshot
                              </p>
                              <div className="rounded-xl overflow-hidden border border-white/10 max-w-sm">
                                <img
                                  src={req.screenshotBase64}
                                  alt="Transaction Screenshot"
                                  className="w-full h-auto object-contain max-h-72"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400/70 text-[10px]">
                              No screenshot submitted with this request.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Users', value: registeredUsers.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Users },
                { label: 'Premium Users', value: approvedEmails.length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Crown },
                { label: 'Free Users', value: Math.max(0, registeredUsers.length - approvedEmails.length), color: 'text-gray-400', bg: 'bg-white/5 border-white/10', icon: Shield },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`p-4 rounded-2xl border ${stat.bg} bg-slate-900/40`}>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Manual Grant */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Manually Grant Premium Access
              </h2>
              <p className="text-xs text-gray-400">
                Grant premium access directly without a payment request.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={addEmailInput}
                  onChange={e => setAddEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                  className="flex-1 bg-white/[0.04] text-white text-sm rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600"
                />
                <button
                  onClick={handleManualAdd}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Grant
                </button>
              </div>
            </div>

            {/* All Users List */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  All Registered Users ({allUsers.length})
                  {cloudUsersLoading && <span className="text-[10px] text-gray-500 font-normal animate-pulse">syncing cloud…</span>}
                </h2>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="bg-white/[0.04] text-white text-xs rounded-xl px-3 py-1.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600 w-48"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {allUsers.length === 0
                      ? 'No users yet. Users appear here when they sign in on any device.'
                      : 'No users match your search.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredUsers.map((user) => {
                    const isPremium = approvedSet.has(user.email.toLowerCase());
                    return (
                      <div key={user.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/5'}`}>
                            {isPremium ? (
                              <Crown className="w-4 h-4 text-amber-400" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-white font-medium truncate">{user.fullName || 'User'}</p>
                              {isPremium && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              Signed in: {new Date(user.lastSignInAt).toLocaleDateString()} · Joined: {new Date(user.registeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-gray-500">Premium</p>
                            <p className={`text-xs font-bold ${isPremium ? 'text-amber-400' : 'text-gray-500'}`}>
                              {isPremium ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleTogglePremium(user.email, isPremium)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isPremium
                                ? 'bg-amber-500/10 hover:bg-rose-500/10 text-amber-400 hover:text-rose-400 border-amber-500/20 hover:border-rose-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            }`}
                            title={isPremium ? 'Remove Premium' : 'Add Premium'}
                          >
                            {isPremium ? (
                              <>
                                <ToggleRight className="w-4 h-4" />
                                <span className="hidden sm:inline">Premium On</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Make Premium</span>
                              </>
                            )}
                          </button>

                          {isPremium && (
                            <button
                              onClick={() => handleManualRemove(user.email)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              title="Revoke Premium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Premium-only users not in registry */}
            {approvedEmails.filter(e => !registeredUsers.find(u => u.email === e)).length > 0 && (
              <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Manually Approved Emails
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">These emails have premium access but haven't signed in yet.</p>
                </div>
                <div className="divide-y divide-white/5">
                  {approvedEmails
                    .filter(e => !registeredUsers.find(u => u.email === e))
                    .map((em) => (
                      <div key={em} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Crown className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{em}</p>
                            <p className="text-[10px] text-emerald-400">Premium Active · Not yet signed in</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleManualRemove(em)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Revoke Premium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'App Version', value: `v${APP_VERSION}`, icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                { label: 'Premium Users', value: approvedEmails.length, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { label: 'Registered Users', value: registeredUsers.length, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`p-5 rounded-2xl border ${stat.bg} bg-slate-900/40`}>
                    <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white">Premium Conversion Rate</h3>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  style={{ width: registeredUsers.length > 0 ? `${Math.min(100, (approvedEmails.length / registeredUsers.length) * 100).toFixed(0)}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {registeredUsers.length > 0
                  ? `${((approvedEmails.length / registeredUsers.length) * 100).toFixed(1)}% of users have premium access`
                  : 'No users yet'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white">Request Summary</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Requests', val: counts.all, color: 'bg-blue-500' },
                  { label: 'Pending Review', val: counts.pending, color: 'bg-amber-500' },
                  { label: 'Approved', val: counts.approved, color: 'bg-emerald-500' },
                  { label: 'Rejected', val: counts.rejected, color: 'bg-rose-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-gray-400">{item.label}</span>
                    </div>
                    <span className="font-bold text-white">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ANNOUNCE TAB ── */}
        {activeTab === 'announce' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                System Announcement
              </h2>
              <p className="text-xs text-gray-400">
                This message will appear as a banner to all users when they open the app.
              </p>
              <textarea
                rows={4}
                placeholder="e.g. Scheduled maintenance on Sunday from 2-4 AM UTC..."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                className="w-full bg-white/[0.04] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 outline-none resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAnnouncement}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                >
                  {announcementSaved ? 'Saved!' : 'Save Announcement'}
                </button>
                {announcement && (
                  <button
                    onClick={() => { setAnnouncement(''); handleSaveAnnouncement(); }}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {activeTab === 'messages' && (
          <div className="flex flex-col sm:flex-row gap-4 sm:h-[520px]">
            {/* Conversation list — hidden on mobile when a conversation is selected */}
            <div className={`sm:w-64 flex-shrink-0 flex flex-col bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden ${selectedConvEmail ? 'hidden sm:flex' : 'flex h-[400px] sm:h-auto'}`}>
              <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Conversations
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">{conversations.length} user{conversations.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500 mt-8">No messages yet.</div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.email}
                      onClick={() => { setSelectedConvEmail(conv.email); markAdminRead(conv.email); loadMessages(); }}
                      className={`w-full px-4 py-3 border-b border-white/5 text-left transition-all hover:bg-white/5 ${selectedConvEmail === conv.email ? 'bg-blue-600/15 border-l-2 border-l-blue-500' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-white truncate">{conv.email.split('@')[0]}</p>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {conv.lastMessage?.message || ''}
                      </p>
                      <p className="text-[9px] text-gray-600 mt-0.5">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleDateString() : ''}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat window — hidden on mobile when no conversation is selected */}
            <div className={`flex-1 flex flex-col bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden ${!selectedConvEmail ? 'hidden sm:flex' : 'flex h-[520px] sm:h-auto'}`}>
              {!selectedConvEmail ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
                  <MessageSquare className="w-8 h-8 text-gray-600" />
                  <p className="text-sm text-gray-500">Select a conversation to view messages</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-white/10 flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedConvEmail(null)}
                      className="sm:hidden p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-white">{selectedConvEmail}</p>
                      <p className="text-[10px] text-gray-500">{(conversations.find(c => c.email === selectedConvEmail)?.messages.length || 0)} messages</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {(conversations.find(c => c.email === selectedConvEmail)?.messages || []).map(msg => (
                      <div key={msg.id} className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          msg.isFromAdmin
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                            : 'bg-slate-800 border border-white/10 text-gray-200 rounded-tl-sm'
                        }`}>
                          {!msg.isFromAdmin && (
                            <p className="text-[9px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">User</p>
                          )}
                          <p>{msg.message}</p>
                          <p className={`text-[9px] mt-1 ${msg.isFromAdmin ? 'text-white/60' : 'text-gray-500'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={adminChatEndRef} />
                  </div>
                  <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2 flex-shrink-0">
                    <input
                      type="text"
                      value={adminReplyInput}
                      onChange={e => setAdminReplyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdminSendReply()}
                      placeholder="Reply to user..."
                      className="flex-1 bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-500"
                    />
                    <button
                      onClick={handleAdminSendReply}
                      disabled={!adminReplyInput.trim()}
                      className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── PLAN ACCESS TAB ── */}
        {activeTab === 'access' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4 text-blue-400" />
                  Section Access Control
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Toggle which app sections require a Premium plan. Free sections are accessible to all users.
                </p>
              </div>
              <div className="space-y-2">
                {PLAN_SECTIONS.map(section => {
                  const isPremiumOnly = (planAccess[section.id] || 'free') === 'premium';
                  return (
                    <div
                      key={section.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isPremiumOnly
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{section.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{section.label}</p>
                          <p className="text-[11px] text-gray-500">{section.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPremiumOnly
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        }`}>
                          {isPremiumOnly ? '👑 PREMIUM ONLY' : '✓ FREE'}
                        </span>
                        <button
                          onClick={() => handleToggleAccess(section.id)}
                          className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
                            isPremiumOnly ? 'bg-amber-500' : 'bg-gray-700'
                          }`}
                          title={isPremiumOnly ? 'Switch to Free' : 'Switch to Premium Only'}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            isPremiumOnly ? 'left-6' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
                💡 Changes take effect immediately for all users. Free users will see a lock icon on premium-only sections.
              </div>
            </div>
          </div>
        )}

        {/* ── SCREENSHOTS TAB ── */}
        {activeTab === 'screenshots' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Transaction Screenshots
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Payment screenshots submitted by users · stored in Supabase (payment_screenshots table)
                </p>
              </div>
              <button
                onClick={loadTxScreenshots}
                disabled={screenshotsLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${screenshotsLoading ? 'animate-spin' : ''}`} />
                {screenshotsLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {screenshotsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : screenshotsError ? (
              <div className="py-12 text-center rounded-3xl bg-rose-950/30 border border-rose-500/20">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                <p className="text-sm text-rose-300">Could not load screenshots from cloud.</p>
                <p className="text-xs text-gray-500 mt-1">{screenshotsError}</p>
                <button onClick={loadTxScreenshots} className="mt-4 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-all">
                  Retry
                </button>
              </div>
            ) : txScreenshots.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-white/10">
                <ImageIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No transaction screenshots yet.</p>
                <p className="text-xs text-gray-600 mt-1">
                  Screenshots appear here when users submit a payment via the Settings page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {txScreenshots.map(scr => (
                  <div key={scr.id} className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden group">
                    <div
                      className="relative cursor-pointer bg-slate-800"
                      style={{ paddingBottom: '60%' }}
                      onClick={() => setViewingScreenshot(scr)}
                    >
                      <img
                        src={scr.screenshot_data}
                        alt="Transaction screenshot"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{scr.user_email}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">TX: {scr.transaction_id}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{new Date(scr.submitted_at).toLocaleString()}</p>
                        </div>
                        <span className="flex-shrink-0 text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Pending
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingScreenshot(scr)}
                          className="flex-1 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-400 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Full
                        </button>
                        <button
                          onClick={() => handleDeleteTxScreenshot(scr.id)}
                          disabled={deletingScreenshotId === scr.id}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all disabled:opacity-40"
                          title="Delete screenshot from cloud"
                        >
                          {deletingScreenshotId === scr.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-blue-300/70">
              💡 Screenshots are stored in your Supabase database (payment_screenshots table). Deleting here permanently removes
              the screenshot but does <strong>not</strong> affect the payment request status in the Requests tab.
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Subscription Price */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Subscription Price
              </h2>
              <p className="text-xs text-gray-400">Change the premium subscription price. It updates in real time for all users.</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 font-semibold">Rs.</span>
                <input
                  type="number"
                  min={1}
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  className="w-32 bg-white/[0.04] text-white text-sm rounded-xl px-3 py-2 border border-white/10 focus:border-amber-500 outline-none"
                />
                <span className="text-xs text-gray-500">lifetime access</span>
              </div>
              <button
                onClick={handleSavePrice}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                {priceSaved ? 'Price Updated!' : 'Update Price for All Users'}
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                Storage Configuration
              </h2>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Free Tier Storage Limit (GB)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={freeLimit}
                    onChange={e => setFreeLimit(Number(e.target.value))}
                    className="w-24 bg-white/[0.04] text-white text-sm rounded-xl px-3 py-2 border border-white/10 focus:border-blue-500 outline-none"
                  />
                  <span className="text-xs text-gray-400">GB (current: {freeLimit} GB)</span>
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
              >
                {settingsSaved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
              <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Danger Zone
              </h2>
              <p className="text-xs text-gray-400">These actions affect all users across the platform.</p>
              <button
                onClick={() => {
                  if (confirm('Clear all premium approvals? This will remove premium access for ALL users. This cannot be undone.')) {
                    localStorage.removeItem('vaultify-premium-approved');
                    loadData();
                    flash('All premium approvals cleared.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-bold border border-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                Clear All Premium Users
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── FULL-SIZE SCREENSHOT MODAL ── */}
    <AnimatePresence>
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setViewingScreenshot(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl z-10 flex flex-col overflow-hidden"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{viewingScreenshot.user_email}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {viewingScreenshot.transaction_id} · {new Date(viewingScreenshot.submitted_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <button
                  onClick={() => handleDeleteTxScreenshot(viewingScreenshot.id)}
                  disabled={deletingScreenshotId === viewingScreenshot.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold transition-all disabled:opacity-40"
                >
                  {deletingScreenshotId === viewingScreenshot.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete
                </button>
                <button
                  onClick={() => setViewingScreenshot(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center p-4 bg-slate-950/50">
              <img
                src={viewingScreenshot.screenshot_data}
                alt="Transaction screenshot"
                className="max-w-full h-auto rounded-xl object-contain shadow-xl"
                style={{ maxHeight: 'calc(90vh - 100px)' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};
