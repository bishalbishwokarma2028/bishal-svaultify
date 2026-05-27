import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'vaultify-storage-consent-v1';

export const StorageConsentModal: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const given = localStorage.getItem(STORAGE_KEY);
    if (!given) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'granted');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-white/10 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Device Storage Required</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Vaultify uses your browser's local storage</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-gray-300 leading-relaxed">
                All your data — passwords, files, notes and reminders — is stored
                <span className="text-white font-bold"> exclusively on this device</span>.
                Nothing is sent to any server. Your privacy is guaranteed.
              </p>

              <div className="space-y-3">
                {[
                  { icon: Lock, label: 'End-to-end encrypted on your device', color: 'text-blue-400 bg-blue-500/10' },
                  { icon: ShieldCheck, label: 'Zero access by Vaultify or any third party', color: 'text-emerald-400 bg-emerald-500/10' },
                  { icon: HardDrive, label: 'Data never leaves your browser storage', color: 'text-purple-400 bg-purple-500/10' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-gray-300">{label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-[11px] text-amber-300 leading-relaxed">
                  <strong>Important:</strong> Clearing your browser data or using Private/Incognito mode will erase your vault. Always keep backups of critical files.
                </p>
              </div>

              <button
                onClick={handleAccept}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Enable Storage &amp; Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
