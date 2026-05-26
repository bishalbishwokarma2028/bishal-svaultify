import React from 'react';
import { Modal } from '../ui/Modal';
import { Smartphone, Monitor, Download, Check, Sparkles, Share } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose
}) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install Vaultify PWA">
      <div className="space-y-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/20 text-center">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl" />
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg glow-blue mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-base font-bold text-white tracking-wide">
            Experience the Ultimate Native Speed
          </h4>
          <p className="text-xs text-gray-300 mt-1">
            Install Vaultify directly to your device for standalone access, enhanced security boundaries, and automatic background sync.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone Install */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Mobile Home Screen</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Optimized for iPhone & Android with custom app shell, local cache, and push capabilities.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5">
              {isIOS ? (
                <div className="text-[11px] text-gray-300 bg-white/5 p-2 rounded-lg space-y-1">
                  <p className="font-medium text-blue-400">iOS Installation:</p>
                  <p className="flex items-center gap-1">1. Tap the <Share className="w-3 h-3 inline text-white"/> Share icon below</p>
                  <p>2. Select "Add to Home Screen"</p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // simulate native install prompt
                    alert('To install, open the browser menu and select "Install app" or "Add to Home screen".');
                  }}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install on Phone</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Install */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white">Desktop & Dock</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Launch as an independent secure window on macOS Dock or Windows Desktop. Seamless shortcut support.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5">
              <button
                onClick={() => {
                  alert('Click the install icon (⊕ or ⤓) in the right corner of your browser\'s top address bar to install Vaultify Desktop.');
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 glow-blue"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install on Desktop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Perks */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            PWA Core Advantages
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Zero Browser Chrome UI',
              'Offline Storage Cache',
              'Native OS System Gestures',
              'Hardware Encrypted Enclave'
            ].map((perk, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Done */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            I've already installed / Continue in browser
          </button>
        </div>
      </div>
    </Modal>
  );
};
