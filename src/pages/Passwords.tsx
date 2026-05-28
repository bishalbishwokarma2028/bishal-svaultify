import React, { useState, useMemo, useEffect } from 'react';
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

  Pencil,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { PasswordItem } from '../types';
import { useToast } from '../components/ui/Toast';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

/* ── Service detection for auto-grouping ── */
function detectService(title: string, url?: string): string | null {
  const text = ((title || '') + ' ' + (url || '')).toLowerCase();
  if (text.includes('facebook') || text.includes('fb.com') || text.includes('messenger')) return 'Facebook';
  if (text.includes('google') || text.includes('gmail') || text.includes('google.com')) return 'Google';
  if (text.includes('instagram') || text.includes('instagram.com')) return 'Instagram';
  if (text.includes('twitter') || text.includes('x.com') || text.includes('tweet')) return 'Twitter / X';
  if (text.includes('linkedin') || text.includes('linkedin.com')) return 'LinkedIn';
  if (text.includes('amazon') || text.includes('amazon.com') || text.includes('prime')) return 'Amazon';
  if (text.includes('apple') || text.includes('apple.com') || text.includes('icloud') || text.includes('itunes')) return 'Apple';
  if (text.includes('microsoft') || text.includes('outlook') || text.includes('hotmail') || text.includes('msn')) return 'Microsoft';
  if (text.includes('netflix') || text.includes('netflix.com')) return 'Netflix';
  if (text.includes('youtube') || text.includes('youtube.com')) return 'YouTube';
  if (text.includes('github') || text.includes('github.com')) return 'GitHub';
  if (text.includes('whatsapp') || text.includes('whatsapp.com')) return 'WhatsApp';
  if (text.includes('snapchat') || text.includes('snapchat.com')) return 'Snapchat';
  if (text.includes('tiktok') || text.includes('tiktok.com')) return 'TikTok';
  if (text.includes('paypal') || text.includes('paypal.com')) return 'PayPal';
  if (text.includes('discord') || text.includes('discord.com')) return 'Discord';
  if (text.includes('reddit') || text.includes('reddit.com')) return 'Reddit';
  if (text.includes('spotify') || text.includes('spotify.com')) return 'Spotify';
  if (text.includes('steam') || text.includes('steampowered')) return 'Steam';
  if (text.includes('twitch') || text.includes('twitch.tv')) return 'Twitch';
  if (text.includes('zoom') || text.includes('zoom.us')) return 'Zoom';
  if (text.includes('slack') || text.includes('slack.com')) return 'Slack';
  if (text.includes('dropbox') || text.includes('dropbox.com')) return 'Dropbox';
  if (text.includes('yahoo') || text.includes('yahoo.com')) return 'Yahoo';
  if (text.includes('bank') || text.includes('banking') || text.includes('siddhartha') || text.includes('nabil') || text.includes('kumari') || text.includes('laxmi')) return 'Banking';
  return null;
}

const SERVICE_ICONS: Record<string, string> = {
  'Facebook': '🔵', 'Google': '🔴', 'Instagram': '🟣', 'Twitter / X': '🐦',
  'LinkedIn': '💼', 'Amazon': '📦', 'Apple': '🍎', 'Microsoft': '🪟',
  'Netflix': '🎬', 'YouTube': '▶️', 'GitHub': '🐙', 'WhatsApp': '💬',
  'Snapchat': '👻', 'TikTok': '🎵', 'PayPal': '💳', 'Discord': '🎮',
  'Reddit': '🤖', 'Spotify': '🎧', 'Steam': '🕹️', 'Twitch': '🟣',
  'Zoom': '📹', 'Slack': '💬', 'Dropbox': '📁', 'Yahoo': '🟤', 'Banking': '🏦',
};

/* ── Predefined groups with keyword matching ── */
const PREDEFINED_GROUPS: { label: string; emoji: string; keywords: string[] }[] = [
  { label: 'All', emoji: '🌐', keywords: [] },
  { label: 'Facebook', emoji: '🔵', keywords: ['facebook', 'fb.com', 'messenger'] },
  { label: 'Instagram', emoji: '📸', keywords: ['instagram'] },
  { label: 'Gmail / Google', emoji: '📧', keywords: ['google', 'gmail'] },
  { label: 'Twitter / X', emoji: '🐦', keywords: ['twitter', 'x.com', 'tweet'] },
  { label: 'WhatsApp', emoji: '💬', keywords: ['whatsapp'] },
  { label: 'TikTok', emoji: '🎵', keywords: ['tiktok'] },
  { label: 'LinkedIn', emoji: '💼', keywords: ['linkedin'] },
  { label: 'Netflix', emoji: '🎬', keywords: ['netflix'] },
  { label: 'Gaming', emoji: '🎮', keywords: ['steam', 'epic', 'game', 'gaming', 'psn', 'playstation', 'xbox', 'minecraft', 'roblox', 'twitch', 'valorant'] },
  { label: 'WiFi', emoji: '📶', keywords: ['wifi', 'wi-fi', 'network', 'router', 'hotspot'] },
  { label: 'Bank / Finance', emoji: '🏦', keywords: ['bank', 'banking', 'nabil', 'siddhartha', 'kumari', 'esewa', 'khalti', 'finance', 'invest'] },
  { label: 'Wallet / Cards', emoji: '💳', keywords: ['wallet', 'card', 'paypal', 'stripe', 'visa', 'mastercard', 'credit', 'debit'] },
  { label: 'Shopping', emoji: '🛒', keywords: ['amazon', 'shopify', 'daraz', 'aliexpress', 'ebay', 'shop', 'store'] },
  { label: 'Work / Tools', emoji: '🧰', keywords: ['slack', 'notion', 'jira', 'github', 'gitlab', 'zoom', 'teams', 'office', 'outlook', 'microsoft', 'dropbox', 'work'] },
  { label: 'Others', emoji: '🔑', keywords: [] },
];

function matchesGroup(pwd: PasswordItem, group: (typeof PREDEFINED_GROUPS)[number]): boolean {
  if (group.label === 'All') return true;
  const text = ((pwd.title || '') + ' ' + (pwd.url || '') + ' ' + (pwd.notes || '')).toLowerCase();
  if (group.label === 'Others') {
    return !PREDEFINED_GROUPS.slice(1, -1).some(g => g.keywords.some(kw => text.includes(kw)));
  }
  return group.keywords.some(kw => text.includes(kw));
}

export const Passwords: React.FC = () => {
  const { passwords, addPassword, updatePassword, deletePassword } = useVaultStore();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(
    passwords.length > 0 ? passwords[0].id : null
  );
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

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

  /* ── Auto-group by service ── */
  const { groupedMap, ungrouped } = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    passwords.forEach(p => {
      const s = detectService(p.title, p.url);
      if (s) serviceCounts[s] = (serviceCounts[s] || 0) + 1;
    });
    const multiServices = new Set(Object.keys(serviceCounts).filter(s => serviceCounts[s] >= 2));
    const gMap: Record<string, PasswordItem[]> = {};
    const ung: PasswordItem[] = [];
    passwords.forEach(p => {
      const s = detectService(p.title, p.url);
      if (s && multiServices.has(s)) {
        if (!gMap[s]) gMap[s] = [];
        gMap[s].push(p);
      } else {
        ung.push(p);
      }
    });
    return { groupedMap: gMap, ungrouped: ung };
  }, [passwords]);

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
      const resolvedCategory = (selectedGroup !== 'All' && selectedGroup !== 'Others') ? selectedGroup : 'Personal';
      await addPassword({
        title,
        username,
        passwordEncrypted,
        url: url || undefined,
        category: resolvedCategory,
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

  const activeGroupDef = PREDEFINED_GROUPS.find(g => g.label === selectedGroup) || PREDEFINED_GROUPS[0];
  const groupFilteredPasswords = useMemo(() =>
    passwords.filter(p => matchesGroup(p, activeGroupDef)),
    [passwords, selectedGroup]
  );

  // When group changes, auto-select first password and reset to list view
  useEffect(() => {
    const first = groupFilteredPasswords[0];
    if (first) {
      setSelectedId(first.id);
    } else {
      setSelectedId(null);
    }
    setMobileView('list');
  }, [selectedGroup]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PREDEFINED_GROUPS.forEach(g => {
      counts[g.label] = g.label === 'All' ? passwords.length : passwords.filter(p => matchesGroup(p, g)).length;
    });
    return counts;
  }, [passwords]);

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
            // Pre-fill title with selected group keyword so password lands in the right group
            if (selectedGroup !== 'All' && selectedGroup !== 'Others') {
              const groupDef = PREDEFINED_GROUPS.find(g => g.label === selectedGroup);
              if (groupDef) {
                setTitle(groupDef.label);
                const urlMap: Record<string, string> = {
                  'Facebook': 'https://facebook.com',
                  'Instagram': 'https://instagram.com',
                  'Gmail / Google': 'https://gmail.com',
                  'Twitter / X': 'https://x.com',
                  'WhatsApp': 'https://web.whatsapp.com',
                  'TikTok': 'https://tiktok.com',
                  'LinkedIn': 'https://linkedin.com',
                  'Netflix': 'https://netflix.com',
                  'Gaming': '',
                  'WiFi': '',
                  'Bank / Finance': '',
                  'Wallet / Cards': '',
                  'Shopping': '',
                  'Work / Tools': '',
                };
                setUrl(urlMap[selectedGroup] || '');
              }
            } else {
              setTitle('');
              setUrl('');
            }
            setShowAddModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-blue flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Save a Password</span>
        </button>
      </div>

      {/* Mobile Group Tabs (shown only on small screens, above main layout) */}
      <div className="lg:hidden overflow-x-auto no-scrollbar flex gap-1.5 pb-1">
        {PREDEFINED_GROUPS.map(g => (
          <button
            key={g.label}
            onClick={() => setSelectedGroup(g.label)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedGroup === g.label
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <span>{g.emoji}</span>
            <span>{g.label}</span>
          </button>
        ))}
      </div>

      {/* Main Layout: Groups | List | Detail */}
      <div className="flex gap-4 items-start">
        {/* Groups Sidebar */}
        <div className="hidden lg:flex flex-col glass-panel rounded-2xl border border-white/10 overflow-hidden w-44 flex-shrink-0">
          <div className="p-3 border-b border-white/10 bg-white/[0.02]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-3 h-3" />
              Groups
            </span>
          </div>
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto no-scrollbar">
            {PREDEFINED_GROUPS.map((group) => {
              const count = groupCounts[group.label] || 0;
              const isActive = selectedGroup === group.label;
              return (
                <button
                  key={group.label}
                  onClick={() => setSelectedGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? 'bg-blue-600/20 border-l-2 border-blue-500'
                      : 'border-l-2 border-transparent hover:bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{group.emoji}</span>
                    <span className={`text-[11px] font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {group.label}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold flex-shrink-0 ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: List + Detail */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0 items-start">
        {/* Left Side: List — hidden on mobile when detail is shown */}
        <div className={`glass-panel rounded-2xl border border-white/10 overflow-hidden space-y-1 ${mobileView === 'detail' ? 'hidden lg:block' : ''}`}>
          <div className="p-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {activeGroupDef.emoji} {activeGroupDef.label} ({groupFilteredPasswords.length})
            </span>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto no-scrollbar">
            {groupFilteredPasswords.map((pwd) => {
              const isSelected = pwd.id === selectedId;
              return (
                <div
                  key={pwd.id}
                  onClick={() => { setSelectedId(pwd.id); setMobileView('detail'); }}
                  className={`p-3.5 flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border-l-4 border-blue-500'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-blue-600 text-white shadow' : 'bg-white/5 text-gray-400'}`}>
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{pwd.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{pwd.username || 'No username'}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      pwd.strength === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400' :
                      pwd.strength === 'Strong' ? 'bg-blue-500/10 text-blue-400' :
                      pwd.strength === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>{pwd.strength}</span>
                  </div>
                </div>
              );
            })}

            {groupFilteredPasswords.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-500">
                {passwords.length === 0
                  ? 'No passwords saved yet.'
                  : `No passwords in "${activeGroupDef.label}" group.`}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail — hidden on mobile when list view is shown */}
        <div className={`lg:col-span-2 col-span-1 ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
          {selectedPwd ? (
            <div className="glass-panel-premium rounded-3xl p-6 border border-white/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileView('list')}
                    className="lg:hidden p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                    title="Back to list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
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
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-lg glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl z-10 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-purple-400" />
                  <span>Save a Password</span>
                </h3>
                {selectedGroup !== 'All' && selectedGroup !== 'Others' && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-400">Saving to:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">
                      {PREDEFINED_GROUPS.find(g => g.label === selectedGroup)?.emoji} {selectedGroup}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Which type of password do you want to save here?</label>
                  <input
                    type="text"
                    required
                    placeholder="Type your own category"
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
