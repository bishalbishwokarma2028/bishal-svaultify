import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-gray-400">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-white text-sm">VAULTIFY</span>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
              <Lock className="w-2.5 h-2.5 text-emerald-500" />
              <span>Zero-Knowledge AES-GCM 256 Architecture</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <p className="text-gray-500">© 2026 Vaultify Systems, Inc. All rights reserved.</p>
          <span className="text-gray-700 hidden sm:inline">|</span>
          <span className="hidden sm:flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-500">All Systems Operational</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
