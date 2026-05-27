import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, Download, Check, X, Share2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleInstall = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) onClose();
    }
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="w-full max-w-sm bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-950/60 to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install Vaultify</h3>
                  <p className="text-[10px] text-gray-400">Add to your home screen</p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['Works offline', 'Home screen icon', 'Full-screen view', 'Fast & lightweight'].map((perk, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 py-1.5">
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              {isIOS ? (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <p className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> iOS — Add to Home Screen
                  </p>
                  <ol className="space-y-1 text-[11px] text-gray-300">
                    <li className="flex items-start gap-1.5"><span className="text-blue-400 font-bold">1.</span><span>Tap the <Share2 className="w-3 h-3 inline mx-0.5 text-white" /> Share button in Safari's bottom bar</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-400 font-bold">2.</span><span>Scroll down, tap "Add to Home Screen"</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-400 font-bold">3.</span><span>Tap "Add" in the top-right corner</span></li>
                  </ol>
                </div>
              ) : canInstall ? (
                <button
                  onClick={handleInstall}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Install Now
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-400" /> Install via Browser
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Look for the <span className="text-white font-semibold">⊕</span> install icon in your browser's address bar, or open the browser menu and select <span className="text-white">"Install app"</span> / <span className="text-white">"Add to Home Screen"</span>.
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-xs font-medium transition-all"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
