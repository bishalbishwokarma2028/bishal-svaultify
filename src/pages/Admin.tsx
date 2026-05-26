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
} from 'lucide-react';
import {
  getAllRequests,
  updateRequestStatus,
  addApprovedEmail,
  removeApprovedEmail,
  PremiumRequest,
} from '../lib/premiumRequests';

const ADMIN_EMAIL = 'bishalbishwokarma089@gmail.com';
const ADMIN_PASSWORD = 'bishal@ado@9802485583';

export const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadRequests = () => {
    setRequests(getAllRequests());
  };

  useEffect(() => {
    if (isLoggedIn) loadRequests();
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
      setLoginError('Invalid admin credentials.');
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

  const flash = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl">
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
            This panel is for authorized administrators only.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-wide">VAULTIFY ADMIN</span>
              <p className="text-[10px] text-gray-500">Premium Verification Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadRequests}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Action message */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-800 border border-white/10 text-sm text-white font-semibold shadow-2xl"
            >
              {actionMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: counts.all, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Users },
            { label: 'Pending', value: counts.pending, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
            { label: 'Approved', value: counts.approved, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
            { label: 'Rejected', value: counts.rejected, color: 'text-rose-400', bg: 'bg-rose-500/10', icon: XCircle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
                <div className={`p-2 rounded-xl ${stat.bg} w-fit mb-3`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filter Tabs */}
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
              {s} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Crown className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No payment requests yet.</p>
              <p className="text-xs text-gray-600 mt-1">
                Users who click "Unlock Now" and submit their transaction ID will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User Email</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Transaction ID</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Submitted</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((req) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{req.email}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{req.userId || 'Local user'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-gray-300">
                          {req.transactionId}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(req.submittedAt).toLocaleString()}
                        {req.reviewedAt && (
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            Reviewed: {new Date(req.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {req.status === 'pending' && (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full w-fit">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full w-fit">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {req.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(req)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </button>
                          )}
                          {req.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(req)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          )}
                          {req.status === 'approved' && (
                            <span className="text-[10px] text-gray-600">Premium active</span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="text-[10px] text-gray-600">Access denied</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-700 pb-4">
          Approved emails get unlimited storage on their next app visit.
          Changes are stored in this browser's localStorage.
        </p>
      </div>
    </div>
  );
};
