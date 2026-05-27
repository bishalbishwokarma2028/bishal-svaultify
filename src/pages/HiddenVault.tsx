import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeOff, 
  Lock, 
  FileText, 
  Image,
  Video,
  File,
  FolderPlus, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  Calculator,
  Sparkles,
  Info,
  KeyRound,
  Eye,
  EyeIcon,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { getFileContent, isLocalFileUrl, getFileIdFromUrl } from '../lib/localDB';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

export const HiddenVault: React.FC = () => {
  const { 
    hiddenVaultUnlocked, 
    hiddenVaultPin,
    unlockHiddenVault, 
    lockHiddenVault, 
    setHiddenVaultPin,
    files, 
    addFile,
    deleteFile
  } = useVaultStore();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Calculator state ── */
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  /* ── Change-PIN modal ── */
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  /* ── First-time PIN setup ── */
  const [setupPin1, setSetupPin1] = useState('');
  const [setupPin2, setSetupPin2] = useState('');
  const [setupError, setSetupError] = useState('');
  const [showSetupPin1, setShowSetupPin1] = useState(false);
  const [showSetupPin2, setShowSetupPin2] = useState(false);

  /* ── File add ── */
  const [isAdding, setIsAdding] = useState(false);

  /* ── Delete confirmation ── */
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<import('../types').FileItem | null>(null);

  /* ── File preview ── */
  const [previewingFile, setPreviewingFile] = useState<import('../types').FileItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const openPreview = (file: import('../types').FileItem) => {
    setPreviewingFile(file);
    setPreviewUrl(null);
    setZoomLevel(1);
    setPreviewLoading(true);
    if (isLocalFileUrl(file.url)) {
      getFileContent(getFileIdFromUrl(file.url)).then(url => {
        setPreviewUrl(url || null);
        setPreviewLoading(false);
      }).catch(() => setPreviewLoading(false));
    } else if (file.url) {
      setPreviewUrl(file.url);
      setPreviewLoading(false);
    } else {
      setPreviewLoading(false);
    }
  };

  const noPinSet = hiddenVaultPin === '';

  /* ── Calculator logic ── */
  const handleCalcBtn = (btn: string) => {
    if (btn >= '0' && btn <= '9') {
      setCalcDisplay(prev => prev === '0' ? btn : prev + btn);
    } else if (btn === 'C') {
      setCalcDisplay('0');
      setCalcMemory(null);
      setCalcOp(null);
    } else if (['+', '-', '×', '÷'].includes(btn)) {
      setCalcMemory(Number(calcDisplay));
      setCalcOp(btn);
      setCalcDisplay('0');
    } else if (btn === '=') {
      if (unlockHiddenVault(calcDisplay)) {
        toast({ title: 'Secret Vault Opened', type: 'success' });
        setCalcDisplay('0');
        return;
      }

      if (calcMemory !== null && calcOp) {
        const current = Number(calcDisplay);
        let result = 0;
        if (calcOp === '+') result = calcMemory + current;
        if (calcOp === '-') result = calcMemory - current;
        if (calcOp === '×') result = calcMemory * current;
        if (calcOp === '÷') result = current !== 0 ? calcMemory / current : 0;
        setCalcDisplay(String(result));
        setCalcMemory(null);
        setCalcOp(null);
      } else {
        toast({ title: 'Wrong PIN', description: 'That PIN is incorrect. Try again.', type: 'error' });
        setCalcDisplay('0');
      }
    }
  };

  /* ── File helpers ── */
  const hiddenFiles = files.filter(f => f.tags.includes('HiddenVault'));

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.includes('pdf') || type.includes('text') || type.includes('word')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getFileColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-pink-400 bg-pink-500/10';
    if (type.startsWith('video/')) return 'text-blue-400 bg-blue-500/10';
    if (type.includes('pdf')) return 'text-red-400 bg-red-500/10';
    return 'text-purple-400 bg-purple-500/10';
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsAdding(true);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      let dataUrl = '';
      try {
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } catch { dataUrl = ''; }

      await addFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: '',
        folderId: null,
        category: 'Personal IDs',
        tags: ['HiddenVault'],
        isStarred: false,
        isArchived: false
      }, dataUrl);
    }

    toast({
      title: `${fileList.length === 1 ? '1 file' : `${fileList.length} files`} added to Secret Vault`,
      type: 'success'
    });
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── First-time PIN setup submit ── */
  const handleSetupPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (setupPin1.length < 4) {
      setSetupError('PIN must be at least 4 characters long.');
      return;
    }
    if (setupPin1 !== setupPin2) {
      setSetupError('PINs do not match — please enter the same PIN twice.');
      return;
    }

    setHiddenVaultPin(setupPin1);
    setSetupPin1('');
    setSetupPin2('');
    toast({ title: 'Secret PIN Created!', description: 'You can now use it to unlock your vault on the calculator screen.', type: 'success' });
  };

  /* ── Change-PIN submit ── */
  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (newPinInput.length < 4) { setPinError('PIN must be at least 4 characters.'); return; }
    if (newPinInput !== confirmPinInput) { setPinError('PINs do not match. Please re-enter both.'); return; }
    setHiddenVaultPin(newPinInput);
    toast({ title: 'Secret PIN Changed Successfully', type: 'success' });
    setNewPinInput('');
    setConfirmPinInput('');
    setShowConfigModal(false);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Secret Vault</h1>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Hidden
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Store your most private files behind a fully working calculator lock screen.
          </p>
        </div>

        {hiddenVaultUnlocked && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowConfigModal(true); setPinError(''); }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-gray-300 transition-colors flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Change PIN</span>
            </button>

            <button
              onClick={() => { lockHiddenVault(); toast({ title: 'Vault Locked', type: 'info' }); }}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Lock Vault</span>
            </button>
          </div>
        )}
      </div>

      {/* Main UI */}
      <AnimatePresence mode="wait">

        {/* ── FIRST-TIME PIN SETUP ── */}
        {noPinSet && !hiddenVaultUnlocked ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-sm mx-auto pt-4"
          >
            <div className="glass-panel-premium rounded-3xl p-7 border border-purple-500/20 shadow-2xl space-y-6">
              {/* Icon + title */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                  <KeyRound className="w-7 h-7 text-purple-400" />
                </div>
                <h2 className="text-base font-bold text-white">Set Your Secret PIN</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  You'll type this PIN on the calculator screen to open your vault. Choose something only you know.
                </p>
              </div>

              <form onSubmit={handleSetupPinSubmit} className="space-y-4">
                {/* Pin 1 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 block">Choose a PIN</label>
                  <div className="relative">
                    <input
                      type={showSetupPin1 ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Enter your secret PIN (min 4 digits)"
                      value={setupPin1}
                      onChange={(e) => { setSetupPin1(e.target.value); setSetupError(''); }}
                      className="w-full bg-white/[0.04] text-white text-center tracking-widest text-lg rounded-xl py-3 pr-10 border border-white/10 focus:border-purple-500 outline-none font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPin1(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showSetupPin1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Pin 2 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 block">Confirm the PIN</label>
                  <div className="relative">
                    <input
                      type={showSetupPin2 ? 'text' : 'password'}
                      required
                      placeholder="Type the same PIN again"
                      value={setupPin2}
                      onChange={(e) => { setSetupPin2(e.target.value); setSetupError(''); }}
                      className={`w-full bg-white/[0.04] text-white text-center tracking-widest text-lg rounded-xl py-3 pr-10 border outline-none font-mono transition-colors ${
                        setupError ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-purple-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPin2(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showSetupPin2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {setupError && (
                  <p className="text-[11px] text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                    {setupError}
                  </p>
                )}

                {/* Hint */}
                <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                  You'll enter this PIN on the calculator screen to unlock your vault. It is stored only on your device.
                </p>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/30 active:scale-95"
                >
                  Create PIN & Open Vault
                </button>
              </form>
            </div>
          </motion.div>

        /* ── CALCULATOR (locked, PIN set) ── */
        ) : !hiddenVaultUnlocked ? (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-sm mx-auto pt-4"
          >
            <div className="mb-4 p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-300 space-y-1">
                <p className="font-semibold text-purple-300">How to open your Secret Vault</p>
                <p className="text-gray-400 leading-relaxed">
                  Type your secret PIN on the buttons below, then press <strong className="text-white">=</strong> to unlock.
                </p>
              </div>
            </div>

            <div className="glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between text-gray-500 text-xs px-1">
                <span className="flex items-center gap-1 font-mono">
                  <Calculator className="w-3.5 h-3.5 text-blue-400" />
                  <span>Calculator</span>
                </span>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 text-right border border-white/5 overflow-hidden">
                <span className="text-xs text-gray-600 block h-4 font-mono">
                  {calcMemory !== null ? `${calcMemory} ${calcOp || ''}` : ''}
                </span>
                <span className="text-3xl font-mono font-bold text-white tracking-wider block truncate">
                  {calcDisplay}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['C', '÷', '×', '-', '7', '8', '9', '+', '4', '5', '6', '=', '1', '2', '3', '0'].map((btn, idx) => {
                  const isOp = ['+', '-', '×', '÷'].includes(btn);
                  const isEq = btn === '=';
                  const isClear = btn === 'C';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleCalcBtn(btn)}
                      className={`h-14 rounded-xl font-mono text-base font-bold transition-all flex items-center justify-center active:scale-95 ${
                        isEq
                          ? 'bg-blue-600 hover:bg-blue-500 text-white row-span-2 h-full glow-blue'
                          : isOp
                          ? 'bg-white/10 hover:bg-white/20 text-blue-400'
                          : isClear
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] text-gray-200'
                      }`}
                      style={btn === '0' ? { gridColumn: 'span 3' } : {}}
                    >
                      {btn}
                    </button>
                  );
                })}
              </div>

              <div className="text-center pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Type your PIN, then press <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-gray-300 font-mono">=</kbd> to unlock
                </p>
              </div>
            </div>
          </motion.div>

        /* ── VAULT OPEN ── */
        ) : (
          <motion.div
            key="vault"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Unlocked banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Secret Vault is Open</span>
                </span>
                <p className="text-xs text-gray-400">
                  Files here are hidden and do not appear in normal search.
                </p>
              </div>

              <input ref={fileInputRef} type="file" accept="*/*" multiple onChange={handleAddFile} className="hidden" />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAdding}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 self-start sm:self-auto"
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{isAdding ? 'Adding...' : 'Add File'}</span>
              </button>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 flex items-start gap-3">
              <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-400 space-y-1">
                <p className="text-gray-200 font-semibold">Tips for using your Secret Vault</p>
                <ul className="space-y-1 leading-relaxed list-disc list-inside marker:text-purple-400">
                  <li>Click <strong className="text-white">Add File</strong> to upload photos, videos, documents or any file from your device.</li>
                  <li>Files here are completely hidden from the rest of the app.</li>
                  <li>To lock the vault, click <strong className="text-white">Lock Vault</strong> — the calculator screen returns immediately.</li>
                  <li>You can change your PIN anytime using <strong className="text-white">Change PIN</strong>. Enter the new PIN twice to confirm.</li>
                </ul>
              </div>
            </div>

            {/* File grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Secret Files ({hiddenFiles.length})
                </h3>
              </div>

              {hiddenFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {hiddenFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      getFileIcon={getFileIcon}
                      getFileColor={getFileColor}
                      onDelete={() => setConfirmDeleteFile(file)}
                      onView={() => openPreview(file)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 glass-panel rounded-3xl border border-white/5 space-y-3">
                  <FolderPlus className="w-12 h-12 text-gray-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-gray-300">Secret Vault is Empty</p>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                      Click <strong className="text-white">Add File</strong> above to upload photos, videos, or documents.
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First File
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-400">
                <p className="text-gray-200 font-semibold">Privacy guarantee</p>
                <p className="mt-0.5 leading-relaxed">
                  Your secret files are stored only on your device. Nobody else — not even the app — can see them without your PIN.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILE PREVIEW MODAL ── */}
      <AnimatePresence>
        {previewingFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => { setPreviewingFile(null); setPreviewUrl(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl max-h-[92vh] glass-panel-premium rounded-3xl border border-white/10 shadow-2xl z-10 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <EyeOff className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{previewingFile.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {previewingFile.size < 1024 * 1024
                        ? `${(previewingFile.size / 1024).toFixed(1)} KB`
                        : `${(previewingFile.size / (1024 * 1024)).toFixed(1)} MB`}
                      {' · '}Secret File
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {previewUrl && previewingFile.type.startsWith('image/') && (
                    <>
                      <button
                        onClick={() => setZoomLevel(z => Math.max(0.25, z - 0.25))}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-gray-500 min-w-[32px] text-center">{Math.round(zoomLevel * 100)}%</span>
                      <button
                        onClick={() => setZoomLevel(z => Math.min(4, z + 0.25))}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all text-[10px] font-bold"
                        title="Reset Zoom"
                      >
                        1:1
                      </button>
                    </>
                  )}
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      download={previewingFile.name}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      ↓ Download
                    </a>
                  )}
                  <button
                    onClick={() => { setPreviewingFile(null); setPreviewUrl(null); }}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto flex items-center justify-center bg-black/30 min-h-[300px]">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-3 text-center p-8">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Loading secret file...</p>
                  </div>
                ) : previewUrl ? (
                  <>
                    {previewingFile.type.startsWith('image/') && (
                      <div className="overflow-auto flex items-center justify-center w-full h-full p-4">
                        <img
                          src={previewUrl}
                          alt={previewingFile.name}
                          className="rounded shadow-xl transition-transform duration-200 object-contain"
                          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', maxWidth: zoomLevel <= 1 ? '100%' : 'none', maxHeight: zoomLevel <= 1 ? '100%' : 'none' }}
                        />
                      </div>
                    )}
                    {previewingFile.type.startsWith('video/') && (
                      <video src={previewUrl} controls className="max-w-full max-h-full p-4" />
                    )}
                    {previewingFile.type.startsWith('audio/') && (
                      <div className="p-8 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-purple-400" />
                        </div>
                        <audio src={previewUrl} controls className="w-full max-w-xs" />
                      </div>
                    )}
                    {previewingFile.type === 'application/pdf' && (
                      <iframe src={previewUrl} className="w-full h-full min-h-[500px]" title={previewingFile.name} />
                    )}
                    {!previewingFile.type.startsWith('image/') && !previewingFile.type.startsWith('video/') && !previewingFile.type.startsWith('audio/') && previewingFile.type !== 'application/pdf' && (
                      <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                          <File className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-sm font-semibold text-white">{previewingFile.name}</p>
                        <p className="text-xs text-gray-400">Preview not available for this file type.</p>
                        <a
                          href={previewUrl}
                          download={previewingFile.name}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                        >
                          Download File
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                      <File className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-400">Could not load file content.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION ── */}
      <ConfirmDeleteModal
        isOpen={!!confirmDeleteFile}
        itemName={confirmDeleteFile?.name || ''}
        itemType="secret file"
        onConfirm={() => {
          if (confirmDeleteFile) {
            deleteFile(confirmDeleteFile.id);
            toast({ title: 'File Deleted', description: `"${confirmDeleteFile.name}" removed from secret vault.`, type: 'info' });
            setConfirmDeleteFile(null);
          }
        }}
        onCancel={() => setConfirmDeleteFile(null)}
      />

      {/* ── CHANGE PIN MODAL ── */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowConfigModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xs glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-4"
            >
              <div className="text-center space-y-1">
                <Lock className="w-8 h-8 text-purple-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Change Secret PIN</h3>
                <p className="text-[11px] text-gray-400">Enter your new PIN twice to confirm it.</p>
              </div>

              <form onSubmit={handleUpdatePinSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 block">New PIN Code</label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Enter new PIN (min 4 digits)"
                    value={newPinInput}
                    onChange={(e) => { setNewPinInput(e.target.value); setPinError(''); }}
                    className="w-full bg-white/[0.04] text-white text-center tracking-widest text-base rounded-xl py-2.5 border border-white/10 focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 block">Confirm PIN Code</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter the same PIN"
                    value={confirmPinInput}
                    onChange={(e) => { setConfirmPinInput(e.target.value); setPinError(''); }}
                    className={`w-full bg-white/[0.04] text-white text-center tracking-widest text-base rounded-xl py-2.5 border outline-none font-mono ${
                      pinError ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-purple-500'
                    }`}
                  />
                </div>

                {pinError && (
                  <p className="text-[11px] text-rose-400 text-center">{pinError}</p>
                )}

                <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                  You will type this PIN on the calculator screen to open your vault.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Save PIN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── File card sub-component with lazy-loaded preview ── */
interface FileCardProps {
  file: import('../types').FileItem;
  getFileIcon: (type: string) => React.ReactNode;
  getFileColor: (type: string) => string;
  onDelete: () => void;
  onView: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, getFileIcon, getFileColor, onDelete, onView }) => {
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    if (isLocalFileUrl(file.url)) {
      getFileContent(getFileIdFromUrl(file.url)).then(url => setThumbUrl(url || null)).catch(() => {});
    } else if (file.url) {
      setThumbUrl(file.url);
    }
  }, [file]);

  return (
    <div
      onClick={onView}
      className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between group relative overflow-hidden cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
    >
      {thumbUrl ? (
        <div className="mb-3 rounded-xl overflow-hidden h-28 bg-black/30">
          <img src={thumbUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="mb-3 rounded-xl h-20 bg-white/[0.03] border border-white/5 flex items-center justify-center">
          <div className={`p-3 rounded-xl ${getFileColor(file.type)} opacity-60`}>
            {getFileIcon(file.type)}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${getFileColor(file.type)}`}>
          {getFileIcon(file.type)}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-all"
          title="Delete File"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <p className="text-xs font-bold text-white truncate" title={file.name}>{file.name}</p>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono">
          <span className="text-purple-400 font-bold uppercase">Secret</span>
          <span>•</span>
          <span>
            {file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
          </span>
        </div>
        <p className="text-[10px] text-gray-600 mt-1 group-hover:text-purple-400 transition-colors">Tap to open →</p>
      </div>
    </div>
  );
};
