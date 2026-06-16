import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  KeyRound, 
  ShieldCheck, 
  BellRing, 
  Upload, 
  FolderPlus, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  Sliders, 
  Lock, 
  HardDrive, 
  Plus,
  Crown
} from 'lucide-react';
import { useVaultStore, FREE_STORAGE_LIMIT } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';

export const Dashboard: React.FC = () => {
  const { 
    user, 
    files, 
    passwords, 
    notes, 
    reminders, 
    activityLogs, 
    addFile, 
    createFolder,
    isPremium,
    freeStorageLimitGB,
    subscriptionPrice,
    syncLoading,
    syncStats,
  } = useVaultStore();
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const totalDocs = files.length;
  const activeReminders = reminders.filter(r => !r.isResolved);
  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(3);
  const freeLimitBytes = freeStorageLimitGB * 1024 * 1024 * 1024;
  const freePct = isPremium ? 0 : Math.min(100, Math.round((usedBytes / freeLimitBytes) * 100));

  const [animatedDocCount, setAnimatedDocCount] = useState(0);
  const [animatedPwdCount, setAnimatedPwdCount] = useState(0);

  useEffect(() => {
    const docInterval = setInterval(() => {
      setAnimatedDocCount(prev => prev < totalDocs ? prev + 1 : totalDocs);
    }, 40);
    const pwdInterval = setInterval(() => {
      setAnimatedPwdCount(prev => prev < passwords.length ? prev + 1 : passwords.length);
    }, 60);
    return () => {
      clearInterval(docInterval);
      clearInterval(pwdInterval);
    };
  }, [totalDocs, passwords.length]);

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim(), null, newFolderColor);
      toast({ title: 'Folder Created', description: `Folder "${newFolderName}" is ready.`, type: 'success' });
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const handleSimulatedFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      try {
        await addFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          folderId: null,
          category: 'Personal IDs',
          tags: ['Uploaded'],
          isStarred: false,
          isArchived: false,
        });
        toast({ title: 'File Uploaded', description: `"${file.name}" has been saved securely.`, type: 'success' });
        setShowQuickUpload(false);
      } catch (err: any) {
        if (err?.message === 'STORAGE_LIMIT_EXCEEDED') {
          toast({ title: 'Storage Limit Reached', description: 'Upgrade to Premium for unlimited storage.', type: 'error' });
          navigate('/settings');
        } else {
          toast({ title: 'Upload Failed', description: 'Something went wrong.', type: 'error' });
        }
      }
    }
  };

  const toggleWidget = (id: string) => {
    setHiddenWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Sync loading / status banner */}
      {syncLoading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Syncing your vault from cloud…
        </div>
      )}
      {!syncLoading && syncStats && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Cloud synced — {syncStats.passwords} passwords · {syncStats.files} files · {syncStats.notes} notes
        </div>
      )}
      {/* Top bar greeting & customization */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                My Dashboard
              </h1>
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest">
                Secure
              </span>
              {isPremium && (
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
              Your private digital vault. All data stored securely on your device.
            </p>
          </div>

          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`p-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 flex-shrink-0 ${
              isCustomizing
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300'
            }`}
            title="Customize Dashboard"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-gray-300 transition-all flex items-center justify-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setShowQuickUpload(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Customization tray */}
      {isCustomizing && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Show / Hide Sections
            </span>
            <button 
              onClick={() => setHiddenWidgets([])}
              className="text-[10px] text-blue-400 hover:underline"
            >
              Reset to Defaults
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'storage', label: 'Device Storage' },
              { id: 'security', label: 'Security Status' },
              { id: 'activity', label: 'Recent Activity' },
              { id: 'quick', label: 'Quick Actions' }
            ].map(w => {
              const isHidden = hiddenWidgets.includes(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    !isHidden 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'bg-white/[0.01] text-gray-500 border border-white/5 line-through'
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => navigate('/vault')}
          className="p-4 rounded-2xl glass-panel-premium border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white tracking-tight block">{animatedDocCount}</span>
            <span className="text-xs text-gray-400 font-medium">Saved Documents</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>{files.filter(f => f.isStarred).length} Starred</span>
            <span className="text-blue-400 font-semibold">Fully Secure</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => navigate('/passwords')}
          className="p-4 rounded-2xl glass-panel-premium border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <KeyRound className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white tracking-tight block">{animatedPwdCount}</span>
            <span className="text-xs text-gray-400 font-medium">Saved Passwords</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>{passwords.filter(p => p.strength === 'Excellent').length} Strong</span>
            <span className="text-purple-400 font-semibold">Private Access</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => navigate('/notes')}
          className="p-4 rounded-2xl glass-panel-premium border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white tracking-tight block">{notes.length}</span>
            <span className="text-xs text-gray-400 font-medium">Private Notes</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>{notes.filter(n => n.isLocked).length} Locked</span>
            <span className="text-emerald-400 font-semibold">Personal</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => navigate('/security')}
          className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">SECURE</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight block">{user?.securityScore || 100}%</span>
            <span className="text-xs text-gray-400 font-medium">Security Score</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>All items locked</span>
            <span className="text-emerald-400 font-semibold">Safe</span>
          </div>
        </motion.div>
      </div>

      {/* Middle Row: Device Storage + Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left: Device Storage */}
        {!hiddenWidgets.includes('storage') && (
          <div className="lg:col-span-2 p-5 rounded-3xl glass-panel-premium border border-white/10 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Device Storage</h3>
              </div>
              {isPremium ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <Crown className="w-3.5 h-3.5" /> Premium — Unlimited
                </span>
              ) : (
                <span className="text-xs font-semibold text-blue-400">{usedGB} GB / {freeStorageLimitGB} GB</span>
              )}
            </div>

            <p className="text-[11px] text-gray-400">
              Your data is saved directly on your device's local storage — fully private, never uploaded to any server.
            </p>

            {/* Progress bar (free only) */}
            {!isPremium && (
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      freePct > 80 
                        ? 'bg-gradient-to-r from-rose-500 to-red-500' 
                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.max(2, freePct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span>{freePct}% used ({usedMB} MB)</span>
                  <span>{freeStorageLimitGB} GB free limit</span>
                </div>
                {freePct > 80 && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center justify-between">
                    <span>Storage limit approaching!</span>
                    <button 
                      onClick={() => navigate('/settings')}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Upgrade →
                    </button>
                  </div>
                )}
              </div>
            )}

            {isPremium && (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-300">Premium Active</p>
                  <p className="text-[10px] text-gray-400">Store as much data as your device allows — no limits.</p>
                </div>
              </div>
            )}

            {/* Quick breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              {[
                { label: 'Documents', size: `${files.length} files`, color: 'bg-blue-500' },
                { label: 'Passwords', size: `${passwords.length} saved`, color: 'bg-purple-500' },
                { label: 'Notes', size: `${notes.length} notes`, color: 'bg-emerald-500' }
              ].map((b, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${b.color}`} />
                    <span className="text-[10px] text-gray-400 font-medium">{b.label}</span>
                  </div>
                  <p className="text-xs font-bold text-white mt-0.5">{b.size}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right: Quick Actions */}
        {!hiddenWidgets.includes('quick') && (
          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Quick Actions</h3>
              <p className="text-[11px] text-gray-400">Instantly open helpful features.</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/scanner')}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Document Scanner</p>
                    <p className="text-[10px] text-gray-400">Scan papers to secure PDF</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/passwords')}
                className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Save a Password</p>
                    <p className="text-[10px] text-gray-400">Store account details safely</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => navigate('/notes')}
                className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Write a Note</p>
                    <p className="text-[10px] text-gray-400">Keep private thoughts safe</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div 
              onClick={() => navigate('/reminders')}
              className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-950/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-200">{activeReminders.length} Expiry Reminders</span>
              </div>
              <span className="text-[10px] text-amber-400 underline">View</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Recent Uploads + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Files</h3>
            <button onClick={() => navigate('/vault')} className="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</button>
          </div>

          <div className="divide-y divide-white/5">
            {files.slice(0, 4).map((file) => (
              <div 
                key={file.id}
                onClick={() => navigate(`/vault?fileId=${file.id}`)}
                className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white/5 text-blue-400 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                      <span className="bg-white/5 px-1 py-0.2 rounded text-gray-400">{file.category}</span>
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-[10px] text-gray-500 block">{new Date(file.createdAt).toLocaleDateString()}</span>
                  {file.isStarred && <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">★ Starred</span>}
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-500">
                No files uploaded yet. Click "Upload File" above to add documents.
              </div>
            )}
          </div>
        </div>

        {!hiddenWidgets.includes('activity') && (
          <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {activityLogs && activityLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white/5 text-blue-400 flex-shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300 truncate">{log.description}</p>
                    <p className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!activityLogs || activityLogs.length === 0) && (
                <div className="py-8 text-center text-xs text-gray-500">No activity yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Upload Modal */}
      {showQuickUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm p-6 rounded-3xl glass-panel-premium border border-white/10 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">Quick Upload</h3>
            <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-white/20 rounded-2xl hover:border-blue-500/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-gray-400">Click to pick a file from your device</span>
              <input type="file" className="hidden" onChange={handleSimulatedFileUpload} />
            </label>
            <button onClick={() => setShowQuickUpload(false)} className="w-full py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-medium hover:bg-white/10 transition-colors">Cancel</button>
          </motion.div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm p-6 rounded-3xl glass-panel-premium border border-white/10"
          >
            <h3 className="text-sm font-bold text-white mb-4">Create Folder</h3>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none placeholder:text-gray-500"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Color:</label>
                <input type="color" value={newFolderColor} onChange={(e) => setNewFolderColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateFolder(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-medium hover:bg-white/10">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue">Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
