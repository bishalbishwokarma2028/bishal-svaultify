import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Zap, WifiOff, Shield, Share2, MoreVertical, Monitor } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isAndroid = /Android/.test(navigator.userAgent);

function getBrowser(): 'chrome' | 'edge' | 'firefox' | 'safari' | 'other' {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari';
  return 'other';
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);
  const browser = getBrowser();

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (!canInstall) return;
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) {
      setDone(true);
      setTimeout(onClose, 1800);
    }
  };

  const features = [
    { icon: Zap, label: 'Instant launch', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/15' },
    { icon: WifiOff, label: 'Works offline', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15' },
    { icon: Shield, label: 'Private & secure', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
    { icon: Smartphone, label: 'Home screen icon', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/15' },
  ];

  const chromeSteps = [
    { n: '1', text: <>Click the <span className="font-bold text-white">⊕</span> icon in your browser's address bar</> },
    { n: '2', text: <>Click <span className="font-bold text-white">"Install"</span> in the popup</> },
    { n: '3', text: <>Vaultify opens as a standalone app on your device</> },
  ];

  const edgeSteps = [
    { n: '1', text: <>Click the <span className="font-bold text-white">⊕</span> install icon in the address bar</> },
    { n: '2', text: <>Or open menu <MoreVertical className="inline w-3 h-3" /> → <span className="font-bold text-white">"Apps"</span> → <span className="font-bold text-white">"Install this site as an app"</span></> },
    { n: '3', text: <>Click <span className="font-bold text-white">"Install"</span> to confirm</> },
  ];

  const iosSteps = [
    { n: '1', text: <>Open Vaultify in <span className="font-bold text-white">Safari</span> (required for iOS install)</> },
    { n: '2', text: <>Tap the <Share2 className="inline w-3.5 h-3.5 text-blue-300 mx-0.5" /> <span className="font-bold text-white">Share</span> button at the bottom</> },
    { n: '3', text: <>Scroll and tap <span className="font-bold text-white">"Add to Home Screen"</span></> },
    { n: '4', text: <>Tap <span className="font-bold text-white">"Add"</span> — Vaultify appears on your home screen</> },
  ];

  const androidSteps = [
    { n: '1', text: <>Open Vaultify in <span className="font-bold text-white">Chrome</span></> },
    { n: '2', text: <>Tap menu <MoreVertical className="inline w-3 h-3" /> → <span className="font-bold text-white">"Add to Home screen"</span></> },
    { n: '3', text: <>Tap <span className="font-bold text-white">"Add"</span> to confirm</> },
  ];

  const getGuideSteps = () => {
    if (isIOS) return iosSteps;
    if (isAndroid) return androidSteps;
    if (browser === 'edge') return edgeSteps;
    return chromeSteps;
  };

  const getGuideTitle = () => {
    if (isIOS) return 'iOS — Safari Required';
    if (isAndroid) return 'Android — Chrome';
    if (browser === 'edge') return 'Microsoft Edge';
    if (browser === 'chrome') return 'Google Chrome';
    return 'How to Install';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-x-4 bottom-6 sm:inset-auto sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-[301]"
          >
            <div className="relative bg-[#0b0f1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-600/12 to-transparent pointer-events-none" />

              {/* Header */}
              <div className="relative flex items-center gap-3 px-5 pt-5 pb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/40 flex-shrink-0">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white leading-tight">Install Vaultify</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Get the full app experience on your device</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Feature pills */}
                <div className="grid grid-cols-2 gap-2">
                  {features.map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                      <span className="text-[11px] text-gray-200 font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Primary action or guide */}
                {done ? (
                  <div className="w-full py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center gap-2 text-emerald-300 text-sm font-bold">
                    <span>✓</span><span>Installing…</span>
                  </div>
                ) : canInstall ? (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                  >
                    {installing ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Installing…</span></>
                    ) : (
                      <><Download className="w-4 h-4" /><span>Install App Now</span></>
                    )}
                  </button>
                ) : (
                  /* Step-by-step guide when browser hasn't offered native prompt */
                  <div className="rounded-2xl bg-blue-500/8 border border-blue-500/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <p className="text-xs font-bold text-blue-300">{getGuideTitle()} — How to Install</p>
                    </div>
                    <ol className="space-y-2.5">
                      {getGuideSteps().map(({ n, text }) => (
                        <li key={n} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                          <span className="text-[11px] text-gray-300 leading-relaxed">{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Maybe later
                  </button>
                  {!canInstall && (
                    <button
                      onClick={() => { onClose(); }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-semibold transition-colors border border-blue-500/20"
                    >
                      Got it, I'll install
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
