import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, isInstalled, promptInstall, dismiss, isDismissed } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (canInstall && !isInstalled && !isDismissed) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [canInstall, isInstalled, isDismissed]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setVisible(false);
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">Install Vaultify</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Add to home screen for quick, offline access.</p>
            </div>
            <button
              onClick={handleInstall}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
