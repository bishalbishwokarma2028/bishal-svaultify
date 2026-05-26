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
  Info
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';

export const HiddenVault: React.FC = () => {
  const { 
    hiddenVaultUnlocked, 
    unlockHiddenVault, 
    lockHiddenVault, 
    setHiddenVaultPin,
    files, 
    addFile,
    deleteFile
  } = useVaultStore();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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
      }
    }
  };

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

      let fileUrl = '';
      if (file.size < 2 * 1024 * 1024) {
        try {
          fileUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        } catch {
          fileUrl = '';
        }
      }

      await addFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: fileUrl,
        folderId: null,
        category: 'Personal IDs',
        tags: ['HiddenVault'],
        isStarred: false,
        isArchived: false
      });
    }

    toast({
      title: `${fileList.length === 1 ? '1 file' : `${fileList.length} files`} added to Secret Vault`,
      type: 'success'
    });
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (newPinInput.length < 4) {
      setPinError('PIN must be at least 4 characters.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinError('PINs do not match. Please re-enter both.');
      return;
    }

    setHiddenVaultPin(newPinInput);
    toast({ title: 'Secret PIN Changed Successfully', type: 'success' });
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setShowConfigModal(false);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Secret Vault
            </h1>
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
              onClick={() => {
                lockHiddenVault();
                toast({ title: 'Vault Locked', type: 'info' });
              }}
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
        {!hiddenVaultUnlocked ? (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-sm mx-auto pt-4"
          >
            {/* Hint banner above calculator */}
            <div className="mb-4 p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-300 space-y-1">
                <p className="font-semibold text-purple-300">How to open your Secret Vault</p>
                <p className="text-gray-400 leading-relaxed">
                  This is a disguised calculator. Type your secret PIN code on the buttons below, then press <strong className="text-white">=</strong> to unlock. The default PIN is <strong className="text-blue-400">2026</strong>.
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
                      className={`h-14 rounded-xl font-mono text-base font-bold transition-all flex items-center justify-center ${
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
                  Type your PIN, then press <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-gray-300 font-mono">=</kbd> to unlock your vault
                </p>
              </div>
            </div>
          </motion.div>
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

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                multiple
                onChange={handleAddFile}
                className="hidden"
              />

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

            {/* How to use hint */}
            <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 flex items-start gap-3">
              <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-400 space-y-1">
                <p className="text-gray-200 font-semibold">Tips for using your Secret Vault</p>
                <ul className="space-y-1 leading-relaxed list-disc list-inside marker:text-purple-400">
                  <li>Click <strong className="text-white">Add File</strong> to upload photos, videos, documents or any file from your device, gallery, or mobile folders.</li>
                  <li>Files are only visible inside this vault — they are completely hidden from the rest of the app.</li>
                  <li>To lock the vault, click <strong className="text-white">Lock Vault</strong> at the top — the calculator screen returns immediately.</li>
                  <li>You can change your PIN anytime using <strong className="text-white">Change PIN</strong>. You will need to enter the new PIN twice to confirm.</li>
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
                    <div
                      key={file.id}
                      className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Image preview if available */}
                      {file.url && file.type.startsWith('image/') && (
                        <div className="mb-3 rounded-xl overflow-hidden h-28 bg-black/30">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-xl ${getFileColor(file.type)}`}>
                          {getFileIcon(file.type)}
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`Delete secret file "${file.name}"?`)) {
                              deleteFile(file.id);
                              toast({ title: 'File Deleted', type: 'info' });
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-all"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-bold text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono">
                          <span className="text-purple-400 font-bold uppercase">Secret</span>
                          <span>•</span>
                          <span>
                            {file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 glass-panel rounded-3xl border border-white/5 space-y-3">
                  <FolderPlus className="w-12 h-12 text-gray-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-gray-300">Secret Vault is Empty</p>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                      Click <strong className="text-white">Add File</strong> above to upload photos, videos, or documents from your device.
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
                  Your secret files are stored encrypted in your account only. Nobody else — not even the app — can see them without your PIN.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHANGE PIN MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfigModal(false)} />

          <div className="relative w-full max-w-xs glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <div className="text-center space-y-1">
              <Lock className="w-8 h-8 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Change Secret PIN</h3>
              <p className="text-[11px] text-gray-400">
                Enter your new PIN twice to confirm it.
              </p>
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
          </div>
        </div>
      )}
    </div>
  );
};
