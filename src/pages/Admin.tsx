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
  PremiumRequest,
  RegisteredUser,
} from '../lib/premiumRequests';

const ADMIN_EMAIL = 'bishalbishwokarma2028@gmail.com';
const ADMIN_PASSWORD = 'bishal@ado@9802485583';

const APP_VERSION = '2.1.0';
const FREE_LIMIT_GB = 5;

type AdminTab = 'requests' | 'users' | 'stats' | 'settings' | 'announce';

export const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => getAdminSession());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
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

  const loadData = () => {
    setRequests(getAllRequests());
    setApprovedEmails(getApprovedEmails());
    setRegisteredUsers(getUsersRegistry());
  };

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const saved = localStorage.getItem('vaultify-admin-announcement');
      if (saved) setAnnouncement(saved);
      const savedLimit = localStorage.getItem('vaultify-admin-free-limit-gb');
      if (savedLimit) setFreeLimit(Number(savedLimit));
    }
  }, [isLoggedIn]);

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
  };

  const handleReject = (req: PremiumRequest) => {
    updateRequestStatus(req.email, 'rejected');
    removeApprovedEmail(req.email);
    loadData();
    flash(`Request rejected for ${req.email}`);
  };

  const handleManualAdd = () => {
    const e = addEmailInput.trim().toLowerCase();
    if (!e || !e.includes('@')) { flash('Please enter a valid email address.'); return; }
    addApprovedEmail(e);
    setAddEmailInput('');
    loadData();
    flash(`Premium manually granted to ${e}`);
  };

  const handleManualRemove = (e: string) => {
    removeApprovedEmail(e);
    loadData();
    flash(`Premium revoked from ${e}`);
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
  };

  const handleSaveAnnouncement = () => {
    localStorage.setItem('vaultify-admin-announcement', announcement);
    localStorage.setItem('vaultify-admin-announcement-active', announcement ? '1' : '0');
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 2000);
    flash('Announcement saved and will show to all users.');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('vaultify-admin-free-limit-gb', String(freeLimit));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    flash(`Settings saved. Free storage set to ${freeLimit} GB.`);
  };

  const flash = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const filtered = requests.filter(r =>
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const approvedSet = new Set(approvedEmails.map(e => e.toLowerCase()));

  const filteredUsers = registeredUsers.filter(u =>
    userSearch ? u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.fullName.toLowerCase().includes(userSearch.toLowerCase()) : true
  );

  const TABS: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'requests', label: 'Requests', icon: Crown, badge: counts.pending },
    { id: 'users', label: 'All Users', icon: Users, badge: registeredUsers.length },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'announce', label: 'Announce', icon: Bell },
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
    <div className="min-h-screen bg-[#030712] text-gray-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-wide">VAULTIFY ADMIN</span>
              <p className="text-[10px] text-gray-500">Control Panel v{APP_VERSION}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto pb-0 no-scrollbar border-t border-white/5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap relative border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-blue-500'
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
                  <p className="text-xs text-gray-600 mt-1">Users who submit a transaction ID will appear here.</p>
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
                        <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px]">
                          <div>
                            <p className="text-gray-500 mb-0.5">User ID</p>
                            <p className="text-white font-mono break-all">{req.userId || 'Local'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-0.5">Transaction ID</p>
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
                  All Registered Users ({registeredUsers.length})
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
                    {registeredUsers.length === 0
                      ? 'No users have signed in yet. Users appear here when they sign in to the app.'
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

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
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
  );
};
