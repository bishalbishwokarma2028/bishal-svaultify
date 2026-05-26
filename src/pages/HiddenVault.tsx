import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeOff, 
  Lock, 
  FileText, 
  FolderPlus, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  Calculator,
  Eye,
  Sparkles
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

  // Fake Calculator states
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  // Hidden Vault specific configuration
  const [invisibleMode, setInvisibleMode] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');

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
      // Check if display matches the Secret PIN!
      if (unlockHiddenVault(calcDisplay)) {
        toast({ title: 'Secret Vault Opened', type: 'success' });
        setCalcDisplay('0');
        return;
      }

      // Normal Calculator operation
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

  const handleSimulatedHiddenUpload = async () => {
    const name = `Secret_File_${Math.floor(Math.random() * 8999 + 1000)}.pdf`;
    await addFile({
      name,
      size: 3200000,
      type: 'application/pdf',
      url: '',
      folderId: null,
      category: 'Legal',
      tags: ['HiddenVault'],
      isStarred: true,
      isArchived: false
    });

    toast({ title: 'Saved to Secret Vault', description: `"${name}" is now completely hidden.`, type: 'success' });
  };

  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length >= 4) {
      setHiddenVaultPin(newPinInput);
      toast({ title: 'Secret PIN Changed', type: 'success' });
      setNewPinInput('');
      setShowConfigModal(false);
    } else {
      toast({ title: 'PIN Too Short', description: 'Please enter at least 4 numbers.', type: 'error' });
    }
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
              onClick={() => setShowConfigModal(true)}
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
              <span>Lock & Hide</span>
            </button>
          </div>
        )}
      </div>

      {/* Main UI */}
      <AnimatePresence mode="wait">
        {!hiddenVaultUnlocked ? (
          /* CALCULATOR LOCK SCREEN */
          <motion.div
            key="calculator"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-xs mx-auto pt-8"
          >
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
                <p className="text-[9px] text-gray-600 leading-tight">
                  💡 Hint: Type your Secret PIN and press <kbd className="bg-white/5 px-1 rounded text-gray-400">=</kbd> to open. Default: <strong className="text-blue-400">2026</strong>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* UNLOCKED VAULT */
          <motion.div
            key="vault"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Secret Vault is Open</span>
                </span>
                <p className="text-xs text-gray-300">
                  Files here do not show up in the normal app search.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <input
                    type="checkbox"
                    id="invisibleCheck"
                    checked={invisibleMode}
                    onChange={(e) => {
                      setInvisibleMode(e.target.checked);
                      toast({ title: e.target.checked ? 'Invisible Mode On' : 'Invisible Mode Off', type: 'info' });
                    }}
                    className="rounded bg-slate-900 border-white/10 text-purple-600 focus:ring-0"
                  />
                  <label htmlFor="invisibleCheck" className="text-xs text-gray-300 cursor-pointer flex items-center gap-1">
                    {invisibleMode ? <EyeOff className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                    <span>Hide File Names</span>
                  </label>
                </div>

                <button
                  onClick={handleSimulatedHiddenUpload}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg glow-purple flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Secret File</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
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
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                          <FileText className="w-5 h-5" />
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

                      <div className="mt-4">
                        <p className="text-xs font-bold text-white truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono">
                          <span className="text-purple-400 font-bold">Secret</span>
                          <span>•</span>
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>

                      {invisibleMode && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-purple-400 tracking-widest uppercase">
                          HIDDEN
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 glass-panel rounded-3xl border border-white/5 space-y-2">
                  <FolderPlus className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-sm font-semibold text-gray-300">Secret Vault is Empty</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Click "Add Secret File" above to store your most private items safely.
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-xs text-gray-400">
                <p className="text-gray-200 font-semibold">How the Secret Vault works</p>
                <p className="leading-relaxed">
                  When you lock the Secret Vault or close your browser, the contents disappear immediately. They are stored securely and can only be accessed again by typing your correct PIN code into the calculator.
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
            <h3 className="text-base font-bold text-white text-center">Change Secret PIN</h3>
            
            <form onSubmit={handleUpdatePinSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 text-center block">New PIN Code</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="e.g. 1234"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-center tracking-widest text-base rounded-xl py-2 border border-white/10 focus:border-purple-500 outline-none font-mono"
                />
                <p className="text-[9px] text-gray-500 text-center mt-1">
                  Enter at least 4 numbers. You will type this on the calculator screen.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold glow-purple"
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
