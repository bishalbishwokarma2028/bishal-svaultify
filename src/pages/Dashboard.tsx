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
  Database, 
  Plus 
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
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
    createFolder 
  } = useVaultStore();
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  
  // Customization state
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Stats Counters
  const totalDocs = files.length;
  const activeReminders = reminders.filter(r => !r.isResolved);
  const storageUsedMB = user ? (user.usedStorage / (1024 * 1024)).toFixed(2) : '0';
  const storagePct = user ? Math.round((user.usedStorage / user.totalStorageLimit) * 100) : 0;

  // Counters
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

      toast({ 
        title: 'File Uploaded', 
        description: `"${file.name}" has been saved securely.`, 
        type: 'success' 
      });

      setShowQuickUpload(false);
    }
  };

  const toggleWidget = (id: string) => {
    setHiddenWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top bar greeting & customization */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              My Dashboard
            </h1>
            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest">
              Secure Mode
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Your private cloud storage. All items are locked with your personal keys.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              isCustomizing 
                ? 'bg-blue-600 border-blue-500 text-white glow-blue' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>

          <button
            onClick={() => setShowCreateFolder(true)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-gray-300 transition-all flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setShowQuickUpload(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-blue flex items-center gap-1.5"
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
              { id: 'storage', label: 'Storage Usage' },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
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
            <span className="text-2xl font-bold text-white tracking-tight block">
              {animatedDocCount}
            </span>
            <span className="text-xs text-gray-400 font-medium">Saved Documents</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>{files.filter(f => f.isStarred).length} Starred</span>
            <span className="text-blue-400 font-semibold">Fully Secure</span>
          </div>
        </motion.div>

        {/* Saved Passwords */}
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
            <span className="text-2xl font-bold text-white tracking-tight block">
              {animatedPwdCount}
            </span>
            <span className="text-xs text-gray-400 font-medium">Saved Passwords</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>{passwords.filter(p => p.strength === 'Excellent').length} Strong</span>
            <span className="text-purple-400 font-semibold">Private Access</span>
          </div>
        </motion.div>

        {/* Secure Notes */}
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
            <span className="text-2xl font-bold text-white tracking-tight block">
              {notes.length}
            </span>
            <span className="text-xs text-gray-400 font-medium">Private Notes</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>{notes.filter(n => n.isLocked).length} Locked</span>
            <span className="text-emerald-400 font-semibold">Personal</span>
          </div>
        </motion.div>

        {/* Security Score */}
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => navigate('/security')}
          className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
              SECURE
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight block">
              {user?.securityScore || 100}%
            </span>
            <span className="text-xs text-gray-400 font-medium">Security Score</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>All items locked</span>
            <span className="text-emerald-400 font-semibold">Safe</span>
          </div>
        </motion.div>
      </div>

      {/* Middle Row: Storage Progress + Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left: Storage Usage */}
        {!hiddenWidgets.includes('storage') && (
          <div className="lg:col-span-2 p-5 rounded-3xl glass-panel-premium border border-white/10 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Storage Usage
                  </h3>
                </div>
                <span className="text-xs font-semibold text-blue-400">
                  {storageUsedMB} MB / 15 GB
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Your files are saved directly in your personal storage.
              </p>
            </div>

            <div className="space-y-4">
              {/* Simple graphic */}
              <div className="h-28 w-full bg-slate-950 rounded-xl p-3 relative flex items-end overflow-hidden border border-white/5">
                <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
                  <div className="w-full border-b border-white/10" />
                  <div className="w-full border-b border-white/10" />
                  <div className="w-full border-b border-white/10" />
                </div>

                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M 0 90 Q 20 80, 40 85 T 80 60 T 100 40 L 100 100 L 0 100 Z" 
                    fill="url(#storageGrad)" 
                  />
                  <path 
                    d="M 0 90 Q 20 80, 40 85 T 80 60 T 100 40" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="2.5" 
                  />
                </svg>

                <div className="absolute top-2 right-2 bg-blue-950/80 border border-blue-500/30 text-blue-300 text-[9px] px-2 py-0.5 rounded backdrop-blur-md">
                  Active Cloud Space
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(2, storagePct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span>{storagePct}% Space Used</span>
                  <span>15 GB Total Available</span>
                </div>
              </div>
            </div>

            {/* Quick breakdown tags */}
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
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Quick Actions
              </h3>
              <p className="text-[11px] text-gray-400">
                Instantly open helpful features.
              </p>
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

            {/* Expiry alerts */}
            <div 
              onClick={() => navigate('/reminders')}
              className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-950/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-200">
                  {activeReminders.length} Expiry Reminders
                </span>
              </div>
              <span className="text-[10px] text-amber-400 underline">View</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Recent Uploads + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Files
            </h3>
            <button 
              onClick={() => navigate('/vault')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              View All
            </button>
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
                  <span className="text-[10px] text-gray-500 block">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>
                  {file.isStarred && (
                    <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                      ★ Starred
                    </span>
                  )}
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

        {/* Recent Activity */}
        {!hiddenWidgets.includes('activity') && (
          <div className="p-5 rounded-3xl glass-panel border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Activity
              </h3>
              <button 
                onClick={() => navigate('/timeline')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                View History
              </button>
            </div>

            <div className="space-y-3">
              {activityLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 p-1 rounded-md bg-white/5 text-gray-400 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 font-medium truncate">{log.details}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                      <span className="uppercase tracking-wider text-blue-400 font-bold">{log.action}</span>
                      <span>•</span>
                      <span>{log.device}</span>
                    </div>
                  </div>
                </div>
              ))}

              {activityLogs.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500">
                  No actions logged yet. Start uploading files or saving passwords.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showQuickUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowQuickUpload(false)} />
          <div className="relative w-full max-w-md glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-white">Upload File</h3>
            <p className="text-xs text-gray-400">
              Select any file directly from your device. It will be saved directly to your cloud storage.
            </p>
            
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors relative cursor-pointer">
              <input 
                type="file" 
                onChange={handleSimulatedFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Click or drag a file here</p>
              <p className="text-[10px] text-gray-500 mt-1">Supports Images, PDFs, Word files, & Archives</p>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowQuickUpload(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateFolder(false)} />
          <div className="relative w-full max-w-md glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Folder</h3>
            
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Folder Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Health Records"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-sm rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Folder Color Tag</label>
                <div className="flex items-center gap-2">
                  {[
                    '#3b82f6', // blue
                    '#10b981', // emerald
                    '#ef4444', // red
                    '#8b5cf6', // purple
                    '#f59e0b', // amber
                    '#ec4899', // pink
                  ].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${newFolderColor === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
