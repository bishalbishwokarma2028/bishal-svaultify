import React, { useState, useRef, useEffect } from 'react';
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
  ZoomIn,
  ZoomOut,
  Download,
  Smartphone
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { getFileContent, getFileContentUrl, isLocalFileUrl, getFileIdFromUrl } from '../lib/localDB';
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
  const previewObjectUrlRef = useRef<string | null>(null);

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
  const [isConverting, setIsConverting] = useState(false);

  /* ── Move to Device ── */
  const [movingToDevice, setMovingToDevice] = useState(false);
  const [selectedForMove, setSelectedForMove] = useState<string[]>([]);
  const [isMovingFiles, setIsMovingFiles] = useState(false);

  /* ── Delete confirmation ── */
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<import('../types').FileItem | null>(null);

  /* ── File preview ── */
  const [previewingFile, setPreviewingFile] = useState<import('../types').FileItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [previewError, setPreviewError] = useState(false);

  const openPreview = (file: import('../types').FileItem) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewingFile(file);
    setPreviewUrl(null);
    setPreviewError(false);
    setZoomLevel(1);
    setPreviewLoading(true);
    if (isLocalFileUrl(file.url)) {
      getFileContentUrl(getFileIdFromUrl(file.url)).then(url => {
        if (url) {
          if (url.startsWith('blob:')) previewObjectUrlRef.current = url;
          setPreviewUrl(url);
        } else {
          setPreviewError(true);
        }
        setPreviewLoading(false);
      }).catch(() => {
        setPreviewError(true);
        setPreviewLoading(false);
      });
    } else if (file.url) {
      setPreviewUrl(file.url);
      setPreviewLoading(false);
    } else {
      setPreviewError(true);
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

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

  /* ── Move to Device helpers ── */
  const toggleSelectForMove = (fileId: string) => {
    setSelectedForMove(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const downloadFileToDevice = async (file: import('../types').FileItem): Promise<boolean> => {
    try {
      let blob: Blob | null = null;
      if (isLocalFileUrl(file.url)) {
        const content = await getFileContent(getFileIdFromUrl(file.url));
        if (!content) return false;
        blob = content instanceof Blob ? content : new Blob([content as string], { type: file.type });
      } else if (file.url) {
        const resp = await fetch(file.url);
        blob = await resp.blob();
      }
      if (!blob) return false;

      // Try Web Share API first — on iOS it shows "Save to Photos" option
      if (typeof navigator.share === 'function') {
        try {
          const FileClass = (globalThis as any).File as new (parts: BlobPart[], name: string, opts?: FilePropertyBag) => File;
          const shareFile = new FileClass([blob], file.name, { type: file.type || blob.type });
          if (navigator.canShare?.({ files: [shareFile] })) {
            await navigator.share({ files: [shareFile], title: file.name });
            return true;
          }
        } catch (e: any) {
          if (e?.name !== 'AbortError') { /* user cancelled, fall through */ }
          else return false; // user cancelled share sheet — don't delete
        }
      }

      // Fallback: programmatic download (<a download>)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch {
      return false;
    }
  };

  const handleMoveToDevice = async () => {
    if (selectedForMove.length === 0) return;
    setIsMovingFiles(true);
    let moved = 0;
    for (const fileId of selectedForMove) {
      const file = hiddenFiles.find(f => f.id === fileId);
      if (!file) continue;
      const ok = await downloadFileToDevice(file);
      if (ok) {
        await deleteFile(file.id);
        moved++;
      }
    }
    setIsMovingFiles(false);
    setMovingToDevice(false);
    setSelectedForMove([]);
    if (moved > 0) {
      toast({ title: `${moved} file${moved > 1 ? 's' : ''} saved to device and removed from vault`, type: 'success' });
    } else {
      toast({ title: 'No files were moved', description: 'The download was cancelled or failed.', type: 'error' });
    }
  };

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const mod = await import('heic2any');
      const heic2any = (mod as any).default ?? mod;
      if (typeof heic2any !== 'function') return file; // library not available, keep original

      const timeoutMs = 30000; // 30 s — large HEIC photos need time
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      });

      const result = await Promise.race([
        heic2any({ blob: file, toType: 'image/jpeg', quality: 0.82 }),
        timeout
      ]).finally(() => clearTimeout(timeoutId!));

      const raw = Array.isArray(result) ? result[0] : result;
      if (!(raw instanceof Blob)) return file; // unexpected output, keep original

      const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const FC = (globalThis as any).File as new (p: BlobPart[], n: string, o?: FilePropertyBag) => File;
      return new FC([raw], jpegName, { type: 'image/jpeg' });
    } catch {
      // Any failure → keep the original HEIC file (Safari can show it natively)
      return file;
    }
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsAdding(true);

    let added = 0;
    for (let i = 0; i < fileList.length; i++) {
      let file = fileList[i];
      try {
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

        if (isHeic) {
          setIsConverting(true);
          file = await convertHeicToJpeg(file);
          setIsConverting(false);
        }

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
        }, file);

        added++;
      } catch (err: any) {
        setIsConverting(false);
        if (err?.message === 'STORAGE_LIMIT_EXCEEDED') {
          toast({ title: 'Storage Full', description: 'You have reached the 5 GB free limit.', type: 'error' });
        } else {
          toast({ title: `Could not add "${file.name}"`, description: 'File may be corrupted or too large for this device.', type: 'error' });
        }
      }
    }

    setIsConverting(false);
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (added > 0) {
      toast({ title: `${added === 1 ? '1 file' : `${added} files`} added to Secret Vault`, type: 'success' });
      setTimeout(() => {
        toast({
          title: 'Remember to delete the originals',
          description: 'Delete the original file(s) from your device gallery or Files app so they only exist here.',
          type: 'info'
        });
      }, 1800);
    }
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

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  onClick={() => { setMovingToDevice(v => !v); setSelectedForMove([]); }}
                  disabled={isAdding || hiddenFiles.length === 0}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
                >
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>{movingToDevice ? 'Cancel Move' : 'Unhide to Device'}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAdding || movingToDevice}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-lg glow-purple flex items-center gap-1.5"
                >
                  {isAdding ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isConverting ? 'Converting...' : isAdding ? 'Saving...' : 'Add File'}</span>
                </button>
              </div>

              {/* HEIC Converting overlay */}
              {isConverting && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-8 text-center space-y-4 shadow-2xl max-w-xs w-full mx-4">
                    <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-white">Converting HEIC Image</p>
                      <p className="text-xs text-gray-400 mt-1.5">Converting to JPEG format for compatibility. This may take a moment for large photos.</p>
                    </div>
                  </div>
                </div>
              )}
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

              {movingToDevice && hiddenFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 flex-shrink-0" />
                  Tap files to select them, then click <strong className="text-white">Move to Device</strong> to save them to your device and remove from vault.
                </div>
              )}
              {hiddenFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {hiddenFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      getFileIcon={getFileIcon}
                      getFileColor={getFileColor}
                      onDelete={() => setConfirmDeleteFile(file)}
                      onView={() => movingToDevice ? toggleSelectForMove(file.id) : openPreview(file)}
                      movingToDevice={movingToDevice}
                      isSelected={selectedForMove.includes(file.id)}
                      onSelect={() => toggleSelectForMove(file.id)}
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

      {/* ── MOVE TO DEVICE — BOTTOM ACTION BAR ── */}
      <AnimatePresence>
        {movingToDevice && (
          <motion.div
            key="move-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gray-900/95 border border-white/10 shadow-2xl backdrop-blur-md w-full max-w-sm">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">
                  {selectedForMove.length === 0
                    ? 'Select files to move'
                    : `${selectedForMove.length} file${selectedForMove.length > 1 ? 's' : ''} selected`}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Files will be saved to device and removed from vault</p>
              </div>
              <button
                onClick={handleMoveToDevice}
                disabled={selectedForMove.length === 0 || isMovingFiles}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                {isMovingFiles ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isMovingFiles ? 'Moving...' : 'Move to Device'}</span>
              </button>
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
              onClick={() => { setPreviewingFile(null); setPreviewUrl(null); setPreviewError(false); }}
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
                    onClick={() => { setPreviewingFile(null); setPreviewUrl(null); setPreviewError(false); }}
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
                ) : previewError ? (
                  <div className="flex flex-col items-center gap-4 text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                      <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">File content not available</p>
                      <p className="text-xs text-gray-400 mt-1.5 max-w-xs">
                        This file's content is not stored on this device.<br/>
                        It may have been uploaded on a different device or the storage was cleared.
                      </p>
                    </div>
                    <button
                      onClick={() => { setPreviewingFile(null); setPreviewUrl(null); setPreviewError(false); }}
                      className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition-all"
                    >
                      Close
                    </button>
                  </div>
                ) : previewUrl ? (
                  (() => {
                    const ft = previewingFile.type || '';
                    const fn = previewingFile.name.toLowerCase();
                    const isImg = ft.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/.test(fn);
                    const isVid = ft.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|ogv|3gp)$/.test(fn);
                    const isAud = ft.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/.test(fn);
                    const isPdf = ft === 'application/pdf' || fn.endsWith('.pdf');
                    return (
                      <>
                        {isImg && !isVid && (() => {
                          const isHeic = /\.(heic|heif)$/i.test(fn) || ft === 'image/heic' || ft === 'image/heif';
                          if (isHeic) {
                            return (
                              <div className="flex flex-col items-center justify-center gap-5 p-8 text-center h-full">
                                <div className="w-20 h-20 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                                  <Image className="w-10 h-10 text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white truncate max-w-xs">{previewingFile.name}</p>
                                  <p className="text-xs text-gray-400 mt-2 max-w-[260px] leading-relaxed">
                                    HEIC is Apple's photo format. Most browsers can't display it directly — download it and open with your device's Photos app.
                                  </p>
                                </div>
                                {previewUrl && (
                                  <a
                                    href={previewUrl}
                                    download={previewingFile.name}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download to View
                                  </a>
                                )}
                              </div>
                            );
                          }
                          return (
                            <div className="overflow-auto flex items-center justify-center w-full h-full p-4">
                              <img
                                src={previewUrl}
                                alt={previewingFile.name}
                                className="rounded-xl shadow-2xl transition-transform duration-200 object-contain"
                                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', maxWidth: zoomLevel <= 1 ? '100%' : 'none', maxHeight: zoomLevel <= 1 ? '100%' : 'none' }}
                              />
                            </div>
                          );
                        })()}
                        {isVid && (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <video
                              src={previewUrl}
                              controls
                              preload="metadata"
                              playsInline
                              className="max-w-full max-h-full rounded-xl shadow-2xl"
                              style={{ maxHeight: '70vh' }}
                            />
                          </div>
                        )}
                        {isAud && (
                          <div className="p-8 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-purple-400" />
                            </div>
                            <audio src={previewUrl} controls className="w-full max-w-xs" />
                          </div>
                        )}
                        {isPdf && (
                          <iframe src={previewUrl} className="w-full h-full min-h-[500px]" title={previewingFile.name} />
                        )}
                        {!isImg && !isVid && !isAud && !isPdf && (
                          <div className="p-8 flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                              <File className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="text-sm font-semibold text-white">{previewingFile.name}</p>
                            <p className="text-xs text-gray-400">Preview not available for this file type.</p>
                            <a href={previewUrl} download={previewingFile.name} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">
                              Download File
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()
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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
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
  movingToDevice?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, getFileIcon, getFileColor, onDelete, onView, movingToDevice, isSelected, onSelect }) => {
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(null);
  const thumbUrlRef = React.useRef<string | null>(null);

  const isHeicFile = /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';

  React.useEffect(() => {
    // Don't try to render HEIC thumbnails — browsers show blank
    const isImage = !isHeicFile && (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name));
    if (!isImage) return;
    let cancelled = false;
    const load = async () => {
      if (isLocalFileUrl(file.url)) {
        try {
          const url = await getFileContentUrl(getFileIdFromUrl(file.url));
          if (cancelled) { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); return; }
          if (url?.startsWith('blob:')) thumbUrlRef.current = url;
          setThumbUrl(url || null);
        } catch { /* ignore */ }
      } else if (file.url) {
        if (!cancelled) setThumbUrl(file.url);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (thumbUrlRef.current) { URL.revokeObjectURL(thumbUrlRef.current); thumbUrlRef.current = null; }
    };
  }, [file.url, file.type, file.name]);

  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|ogv|3gp)$/i.test(file.name);

  return (
    <div
      onClick={movingToDevice ? onSelect : onView}
      className={`p-4 rounded-2xl border flex flex-col justify-between group relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        movingToDevice && isSelected ? 'ring-2 ring-purple-500 border-purple-500/60' : ''
      }`}
      style={{
        background: movingToDevice && isSelected
          ? 'linear-gradient(135deg, rgba(88,28,135,0.30) 0%, rgba(13,18,45,0.90) 100%)'
          : 'linear-gradient(135deg, rgba(88,28,135,0.12) 0%, rgba(13,18,45,0.85) 100%)',
        borderColor: movingToDevice && isSelected ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Move-mode selection indicator */}
      {movingToDevice && (
        <div className={`absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected ? 'bg-purple-600 border-purple-500' : 'bg-black/40 border-white/30'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {thumbUrl ? (
        <div className="mb-3 rounded-xl overflow-hidden h-28 bg-black/30 relative">
          <img src={thumbUrl} alt={file.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ) : isHeicFile ? (
        <div className="mb-3 rounded-xl h-20 flex flex-col items-center justify-center relative overflow-hidden gap-1.5"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.06))' }}>
          <Image className="w-7 h-7 text-purple-400" />
          <span className="text-[9px] font-bold text-purple-400/70 uppercase tracking-widest">HEIC</span>
        </div>
      ) : isVideo ? (
        <div className="mb-3 rounded-xl h-20 flex items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.1))' }}>
          <div className="w-10 h-10 rounded-full bg-purple-600/80 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-xl h-20 flex items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.06))' }}>
          <div className={`p-3 rounded-xl ${getFileColor(file.type)}`}>
            {getFileIcon(file.type)}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${getFileColor(file.type)}`}>
          {getFileIcon(file.type)}
        </div>

        {!movingToDevice && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-all"
            title="Delete File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
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
        <p className="text-[10px] text-gray-600 mt-1 group-hover:text-purple-400 transition-colors">
          {movingToDevice ? (isSelected ? '✓ Selected' : 'Tap to select') : 'Tap to open →'}
        </p>
      </div>
    </div>
  );
};
