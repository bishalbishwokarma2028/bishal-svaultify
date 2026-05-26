import React from 'react';
import { ShieldCheck, Lock, Cpu, Server } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-gray-400">
      {/* Decorative top blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-wider text-white text-sm">VAULTIFY</span>
          </div>
          <p className="text-xs leading-relaxed">
            The ultra-secure futuristic digital locker. End-to-end client-side encryption backed by modern PostgreSQL and high-speed Vercel edge networks.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Zero-Knowledge AES-GCM 256 Architecture</span>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Security</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#security" className="hover:text-white transition-colors">Client-Side Cryptography</a></li>
            <li><a href="#features" className="hover:text-white transition-colors">Dead-Man Switch</a></li>
            <li><a href="#pricing" className="hover:text-white transition-colors">Biometric Authentication</a></li>
            <li><a href="#faq" className="hover:text-white transition-colors">Audit & Penetration Tests</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Integrations</h4>
          <ul className="space-y-2 text-xs">
            <li><span className="text-gray-500 flex items-center gap-1.5"><Cpu className="w-3 h-3 text-blue-400"/> Supabase Auth</span></li>
            <li><span className="text-gray-500 flex items-center gap-1.5"><Server className="w-3 h-3 text-purple-400"/> Vercel Edge Serverless</span></li>
            <li><span className="text-gray-500 flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400"/> Native Progressive Web App</span></li>
            <li><span className="text-gray-500">Stripe Invoicing</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Legal & Privacy</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#gdpr" className="hover:text-white transition-colors">GDPR & HIPAA Compliance</a></li>
            <li><a href="#contact" className="hover:text-white transition-colors">Security Disclosures</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>© 2026 Vaultify Systems, Inc. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500">v1.8.2-stable</span>
        </div>
      </div>
    </footer>
  );
};
