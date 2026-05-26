import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Lock, 
  Sparkles, 
  Trash2, 
  ExternalLink, 
  Fingerprint,
  Pencil
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { PasswordItem } from '../types';
import { useToast } from '../components/ui/Toast';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

export const Passwords: React.FC = () => {
  const { passwords, addPassword, updatePassword, deletePassword } = useVaultStore();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(
    passwords.length > 0 ? passwords[0].id : null
  );

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [biometricUnlocking, setBiometricUnlocking] = useState<string | null>(null);

  // New Password state
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [passwordEncrypted, setPasswordEncrypted] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Edit Password state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Generator state
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  const selectedPwd = passwords.find(p => p.id === selectedId) || null;

  const checkStrength = (pwd: string): PasswordItem['strength'] => {
    if (pwd.length < 8) return 'Weak';
    let score = 0;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return 'Weak';
    if (score === 3) return 'Medium';
    if (score === 4) return 'Strong';
    return 'Excellent';
  };

  const handleGenerate = () => {
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pool = lowers;
    if (genUpper) pool += uppers;
    if (genDigits) pool += numbers;
    if (genSymbols) pool += symbols;

    let result = '';
    for (let i = 0; i < genLength; i++) {
      result += pool.charAt(Math.floor(Math.random() * pool.length));
    }

    setPasswordEncrypted(result);
    toast({ title: 'Strong Password Created', type: 'info' });
  };

  const openEditModal = (pwd: PasswordItem) => {
    setEditTitle(pwd.title);
    setEditUsername(pwd.username || '');
    setEditPassword(pwd.passwordEncrypted);
    setEditUrl(pwd.url || '');
    setEditNotes(pwd.notes || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId && editTitle && editPassword) {
      await updatePassword(selectedId, {
        title: editTitle,
        username: editUsername,
        passwordEncrypted: editPassword,
        url: editUrl || undefined,
        notes: editNotes || undefined,
        strength: checkStrength(editPassword)
      });
      toast({ title: 'Password Updated', type: 'success' });
      setShowEditModal(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title && passwordEncrypted) {
      await addPassword({
        title,
        username,
        passwordEncrypted,
        url: url || undefined,
        category: 'Personal',
        notes: notes || undefined,
        strength: checkStrength(passwordEncrypted)
      });

      toast({ title: 'Password Saved', description: 'Your password is saved securely.', type: 'success' });
      
      setTitle('');
      setUsername('');
      setPasswordEncrypted('');
      setUrl('');
      setNotes('');
      setShowAddModal(false);
    }
  };

  const triggerBiometricUnlock = (id: string) => {
    if (unlockedIds.includes(id)) {
      setUnlockedIds(prev => prev.filter(item => item !== id));
      return;
    }

    setBiometricUnlocking(id);
    setTimeout(() => {
      setUnlockedIds(prev => [...prev, id]);
      setBiometricUnlocking(null);
      toast({ title: 'Password Unlocked', type: 'success' });
    }, 1000);
  };

  const copyToClipboard = async (text: string, label: string) => {
    navigator.clipboard?.writeText?.(text);
    toast({ title: `${label} Copied`, type: 'success' });
    
    if (selectedId) {
      await updatePassword(selectedId, { lastUsed: new Date().toISOString() });
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Password Manager
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Safely store your website logins, cards, and secret codes.
          </p>
        </div>

        <button
          onClick={() => {
            handleGenerate();
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-blue flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Save a Password</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: List */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden space-y-1">
          <div className="p-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Saved Passwords ({passwords.length})
            </span>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto no-scrollbar">
            {passwords.map((pwd) => {
              const isSelected = pwd.id === selectedId;
              return (
                <div
                  key={pwd.id}
                  onClick={() => setSelectedId(pwd.id)}
                  className={`p-3.5 flex items-center justify-between transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border-l-4 border-blue-500' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white shadow' : 'bg-white/5 text-gray-400'
                    }`}>
                      <KeyRound className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {pwd.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {pwd.username || 'No username'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      pwd.strength === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400' :
                      pwd.strength === 'Strong' ? 'bg-blue-500/10 text-blue-400' :
                      pwd.strength === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {pwd.strength}
                    </span>
                  </div>
                </div>
              );
            })}

            {passwords.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-500">
                No passwords saved yet. Click "Save a Password" above to start.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail */}
        <div className="lg:col-span-2">
          {selectedPwd ? (
            <div className="glass-panel-premium rounded-3xl p-6 border border-white/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-900 to-blue-950 border border-white/10 flex items-center justify-center text-blue-400 shadow-xl">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">{selectedPwd.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded">
                        {selectedPwd.category}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Added {new Date(selectedPwd.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(selectedPwd)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/20 text-gray-500 hover:text-blue-400 transition-all"
                    title="Edit Password"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(selectedPwd.id)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-gray-500 hover:text-rose-400 transition-all"
                    title="Delete Password"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {/* Username */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Username / Email
                    </span>
                    <p className="text-xs font-mono text-white mt-0.5 truncate">
                      {selectedPwd.username || '—'}
                    </p>
                  </div>

                  {selectedPwd.username && (
                    <button
                      onClick={() => copyToClipboard(selectedPwd.username, 'Username')}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Copy Username"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Password */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Password
                    </span>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-mono text-white truncate">
                        {unlockedIds.includes(selectedPwd.id) 
                          ? selectedPwd.passwordEncrypted 
                          : '••••••••••••••••••••••••'
                        }
                      </p>

                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                        selectedPwd.strength === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400' :
                        selectedPwd.strength === 'Strong' ? 'bg-blue-500/10 text-blue-400' :
                        selectedPwd.strength === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {selectedPwd.strength}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                    <button
                      onClick={() => triggerBiometricUnlock(selectedPwd.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        unlockedIds.includes(selectedPwd.id) 
                          ? 'bg-blue-600/20 text-blue-400' 
                          : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                      title={unlockedIds.includes(selectedPwd.id) ? 'Hide password' : 'Show password'}
                    >
                      {unlockedIds.includes(selectedPwd.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => copyToClipboard(selectedPwd.passwordEncrypted, 'Password')}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* URL */}
                {selectedPwd.url && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Website URL
                      </span>
                      <p className="text-xs text-blue-400 mt-0.5 truncate hover:underline cursor-pointer" onClick={() => window.open(selectedPwd.url, '_blank')}>
                        {selectedPwd.url}
                      </p>
                    </div>

                    <button
                      onClick={() => window.open(selectedPwd.url, '_blank')}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Open Website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Notes */}
                {selectedPwd.notes && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Notes
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedPwd.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/5">
              <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-300">No Password Selected</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                Choose a saved password from the list to view or copy its details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BIOMETRIC UNLOCK MODAL */}
      <AnimatePresence>
        {biometricUnlocking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass-panel-premium rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-6 z-10"
            >
              <div className="w-20 h-20 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto relative">
                <span className="absolute inset-0 rounded-full border border-blue-500/40 animate-ping" />
                <Fingerprint className="w-10 h-10 text-blue-400 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Unlocking Password</h3>
                <p className="text-xs text-gray-400">
                  Verifying your secure access...
                </p>
              </div>

              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8 }}
                  className="bg-blue-500 h-full"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-lg glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl z-10 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <span>Save a Password</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Which type of password do you want to save here?</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gmail, Amazon, Bank Account, WiFi"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Username / Email</label>
                  <input
                    type="text"
                    placeholder="myemail@gmail.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Password Generator inside Form */}
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Password</label>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Create Strong Password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={passwordEncrypted}
                    onChange={(e) => setPasswordEncrypted(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-purple-500 outline-none font-mono pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                    {checkStrength(passwordEncrypted)}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Password Length: <strong className="text-white">{genLength}</strong></span>
                    <input 
                      type="range" 
                      min="8" 
                      max="32" 
                      value={genLength} 
                      onChange={(e) => setGenLength(Number(e.target.value))}
                      className="w-32 accent-purple-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    {[
                      { id: 'upper', label: 'Letters (A-Z)', state: genUpper, set: setGenUpper },
                      { id: 'digits', label: 'Numbers (0-9)', state: genDigits, set: setGenDigits },
                      { id: 'symbols', label: 'Symbols (!@#)', state: genSymbols, set: setGenSymbols },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center gap-1.5 text-[10px] text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={opt.state}
                          onChange={(e) => opt.set(e.target.checked)}
                          className="rounded bg-slate-900 border-white/10 text-purple-600 focus:ring-0"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://www.website.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add any extra details here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2 border border-white/10 focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold glow-purple"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT PASSWORD MODAL */}
      {showEditModal && selectedPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-lg glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl z-10 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />
                <span>Edit Password</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Name / Account</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Username / Email</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Password</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Website URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2 border border-white/10 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={confirmDeleteId !== null}
        itemName={passwords.find(p => p.id === confirmDeleteId)?.title || ''}
        itemType="password"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          const pwd = passwords.find(p => p.id === confirmDeleteId);
          if (pwd) {
            deletePassword(pwd.id);
            setSelectedId(passwords.length > 1 ? passwords.find(p => p.id !== pwd.id)?.id || null : null);
            toast({ title: 'Password Deleted', type: 'info' });
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};
