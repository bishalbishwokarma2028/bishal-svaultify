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
  FileText,
  Key,
  Database,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  getAllRequests,
  updateRequestStatus,
  addApprovedEmail,
  removeApprovedEmail,
  getApprovedEmails,
  PremiumRequest,
} from '../lib/premiumRequests';

const ADMIN_EMAIL = 'bishalbishwokarma2028@gmail.com';
const ADMIN_PASSWORD = 'bishal@ado@9802485583';

const APP_VERSION = '2.1.0';
const FREE_LIMIT_GB = 5;
const PREMIUM_LIMIT_GB = 100;

type AdminTab = 'requests' | 'users' | 'stats' | 'settings' | 'announce';

export const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [approvedEmails, setApprovedEmails] = useState<string[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [addEmailInput, setAddEmailInput] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const [freeLimit, setFreeLimit] = useState(FREE_LIMIT_GB);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [expandedReq, setExpandedReq] = useState<string | null>(null);

  const loadRequests = () => {
    setRequests(getAllRequests());
    setApprovedEmails(getApprovedEmails());
  };

  useEffect(() => {
    if (isLoggedIn) loadRequests();
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
      password === ADMIN_PASSWORD
    ) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid admin credentials. Check email and password.');
    }
  };

  const handleApprove = (req: PremiumRequest) => {
    updateRequestStatus(req.email, 'approved');
    addApprovedEmail(req.email);
    loadRequests();
    flash(`✓ Premium approved for ${req.email}`);
  };

  const handleReject = (req: PremiumRequest) => {
    updateRequestStatus(req.email, 'rejected');
    removeApprovedEmail(req.email);
    loadRequests();
    flash(`✗ Request rejected for ${req.email}`);
  };

  const handleManualAdd = () => {
    const e = addEmailInput.trim().toLowerCase();
    if (!e || !e.includes('@')) { flash('Please enter a valid email address.'); return; }
    addApprovedEmail(e);
    setAddEmailInput('');
    loadRequests();
    flash(`✓ Premium manually granted to ${e}`);
  };

  const handleManualRemove = (e: string) => {
    removeApprovedEmail(e);
    loadRequests();
    flash(`✗ Premium revoked from ${e}`);
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

  const TABS: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'requests', label: 'Requests', icon: Crown, badge: counts.pending },
    { id: 'users', label: 'Users', icon: Users, badge: approvedEmails.length },
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
              onClick={loadRequests}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsLoggedIn(false)}
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
            {/* Stats */}
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

            {/* Filter tabs */}
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

            {/* Requests list */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <Crown className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No payment requests found.</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Users who submit a transaction ID will appear here.
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
                            {req.status === 'pending' && (
                              <span className="flex-shrink-0 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>
                            )}
                            {req.status === 'approved' && (
                              <span className="flex-shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Approved</span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="flex-shrink-0 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">Rejected</span>
                            )}
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
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                Manually Grant Premium Access
              </h2>
              <p className="text-xs text-gray-400">
                Grant premium access directly without a payment request. The user will receive unlimited storage on their next app visit.
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

            <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Premium Users ({approvedEmails.length})
                </h2>
              </div>
              {approvedEmails.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No premium users yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {approvedEmails.map((em) => (
                    <div key={em} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <Crown className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{em}</p>
                          <p className="text-[10px] text-emerald-400">Premium Active · Unlimited Storage</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleManualRemove(em)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Revoke Premium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'App Version', value: `v${APP_VERSION}`, icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                { label: 'Premium Users', value: approvedEmails.length, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { label: 'Storage Model', value: 'Local + Cloud', icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`p-5 rounded-2xl border ${s.bg} bg-slate-900/40`}>
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${s.color}`} />
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Storage Configuration
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Free Tier Limit</p>
                  <p className="text-xl font-bold text-white">{FREE_LIMIT_GB} GB</p>
                  <p className="text-[10px] text-gray-600 mt-1">Per free user</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-xs text-gray-500 mb-1">Premium Tier Limit</p>
                  <p className="text-xl font-bold text-amber-400">{PREMIUM_LIMIT_GB} GB</p>
                  <p className="text-[10px] text-gray-600 mt-1">Per premium user</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                System Status
              </h2>
              {[
                { label: 'Local Storage (IndexedDB)', status: 'Operational', color: 'text-emerald-400', dot: 'bg-emerald-500' },
                { label: 'Supabase Auth', status: 'Connected', color: 'text-emerald-400', dot: 'bg-emerald-500' },
                { label: 'File Encryption', status: 'Active', color: 'text-emerald-400', dot: 'bg-emerald-500' },
                { label: 'Premium Verification', status: 'Manual (localStorage)', color: 'text-amber-400', dot: 'bg-amber-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{s.label}</span>
                  <span className={`flex items-center gap-1.5 font-semibold ${s.color}`}>
                    <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Request Overview
              </h2>
              {counts.all === 0 ? (
                <p className="text-xs text-gray-500">No requests submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {[
                    { label: 'Pending Review', count: counts.pending, pct: Math.round((counts.pending / counts.all) * 100), color: 'bg-amber-500' },
                    { label: 'Approved', count: counts.approved, pct: Math.round((counts.approved / counts.all) * 100), color: 'bg-emerald-500' },
                    { label: 'Rejected', count: counts.rejected, pct: Math.round((counts.rejected / counts.all) * 100), color: 'bg-rose-500' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-400">{s.label}</span>
                        <span className="text-white font-semibold">{s.count} ({s.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANNOUNCE TAB ── */}
        {activeTab === 'announce' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  Global Announcement
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  This message will be shown as a banner to all users when they open the app. Leave blank to hide it.
                </p>
              </div>

              <textarea
                placeholder="e.g. We're performing maintenance on May 30th. Service may be interrupted for 1 hour."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                rows={4}
                className="w-full bg-white/[0.04] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-600 resize-none"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAnnouncement}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  {announcementSaved ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Bell className="w-4 h-4" /> Save Announcement</>
                  )}
                </button>
                {announcement && (
                  <button
                    onClick={() => { setAnnouncement(''); handleSaveAnnouncement(); }}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-semibold transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {announcement && (
              <div>
                <p className="text-[11px] text-gray-500 mb-2 uppercase tracking-wider font-semibold">Preview</p>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200">
                  📢 {announcement}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-400">How it works:</strong> The announcement is stored in localStorage. 
              Users will see it as a dismissible banner at the top of their app. 
              Set to blank to remove the announcement.
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                App Configuration
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300">Free Storage Limit (GB)</label>
                  <p className="text-[10px] text-gray-500 mb-2">Limit applied to all non-premium users.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={freeLimit}
                      onChange={e => setFreeLimit(Number(e.target.value))}
                      className="w-28 bg-white/[0.04] text-white text-sm rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                    />
                    <span className="text-xs text-gray-500">GB per free user</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {settingsSaved ? (
                  <><CheckCircle2 className="w-4 h-4" /> Settings Saved!</>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Admin Credentials
              </h2>
              <p className="text-xs text-gray-400">
                Admin access is controlled via hardcoded credentials in the source code. 
                To change them, update <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px]">ADMIN_EMAIL</code> and <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px]">ADMIN_PASSWORD</code> in Admin.tsx.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-gray-500 mb-0.5">Current Admin Email</p>
                  <p className="text-white font-medium truncate">{ADMIN_EMAIL}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-gray-500 mb-0.5">Password</p>
                  <p className="text-white font-medium">••••••••••••</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300/80 leading-relaxed">
              <strong className="text-amber-300">Security Note:</strong> Admin data is stored in the browser's localStorage. 
              This is suitable for single-admin use. For a production multi-admin system, use a backend database.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
