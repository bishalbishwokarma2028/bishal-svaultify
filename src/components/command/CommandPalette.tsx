import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  FolderPlus, 
  Upload, 
  Settings, 
  KeyRound, 
  FileText, 
  Scan, 
  EyeOff, 
  ShieldAlert, 
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { useVaultStore } from '../../store/useVaultStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerUpload: () => void;
  onTriggerCreateFolder: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onTriggerUpload,
  onTriggerCreateFolder
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { files, passwords, notes } = useVaultStore();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled by parent, but if open, let's close on esc handled by modal
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const actions = [
    { id: 'upload', title: 'Upload Secure Document', category: 'Actions', icon: Upload, action: () => { onClose(); onTriggerUpload(); } },
    { id: 'create-folder', title: 'Create Secure Folder', category: 'Actions', icon: FolderPlus, action: () => { onClose(); onTriggerCreateFolder(); } },
    { id: 'go-dash', title: 'Go to Dashboard', category: 'Navigation', icon: LayoutDashboard, action: () => { onClose(); navigate('/dashboard'); } },
    { id: 'go-vault', title: 'Browse Digital Vault', category: 'Navigation', icon: FolderPlus, action: () => { onClose(); navigate('/vault'); } },
    { id: 'go-pwd', title: 'Password Manager', category: 'Navigation', icon: KeyRound, action: () => { onClose(); navigate('/passwords'); } },
    { id: 'go-notes', title: 'Secure Notes', category: 'Navigation', icon: FileText, action: () => { onClose(); navigate('/notes'); } },
    { id: 'go-scan', title: 'Mobile Document Scanner', category: 'Navigation', icon: Scan, action: () => { onClose(); navigate('/scanner'); } },
    { id: 'go-hidden', title: 'Access Hidden Vault', category: 'Advanced', icon: EyeOff, action: () => { onClose(); navigate('/hidden-vault'); } },
    { id: 'go-emerg', title: 'Emergency Protocol', category: 'Advanced', icon: ShieldAlert, action: () => { onClose(); navigate('/security'); } },
    { id: 'go-settings', title: 'Preferences & Storage', category: 'Navigation', icon: Settings, action: () => { onClose(); navigate('/settings'); } },
  ];

  // Also include items from vault if query matches
  const matchingFiles = files
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()) || f.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
    .slice(0, 3)
    .map(f => ({
      id: f.id,
      title: f.name,
      category: 'Files',
      icon: FileText,
      action: () => { onClose(); navigate(`/vault?fileId=${f.id}`); }
    }));

  const matchingPwds = passwords
    .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 2)
    .map(p => ({
      id: p.id,
      title: p.title,
      category: 'Passwords',
      icon: KeyRound,
      action: () => { onClose(); navigate('/passwords'); }
    }));

  const matchingNotes = notes
    .filter(n => n.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 2)
    .map(n => ({
      id: n.id,
      title: n.title,
      category: 'Notes',
      icon: FileText,
      action: () => { onClose(); navigate('/notes'); }
    }));

  const filteredActions = query.trim() === '' 
    ? actions 
    : actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const allResults = [...filteredActions, ...matchingFiles, ...matchingPwds, ...matchingNotes];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl glass-panel-premium rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 border-b border-white/10 bg-white/[0.02]">
              <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search securely..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-4 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
              />
              <span className="text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded uppercase">
                ESC to close
              </span>
            </div>

            {/* Results list */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {allResults.length > 0 ? (
                allResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-blue-600/20 text-gray-400 group-hover:text-blue-400 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No encrypted items or actions matched "{query}"
                </div>
              )}
            </div>

            {/* Footer shortcuts info */}
            <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
              <div className="flex items-center gap-2">
                <span>⚡ Client-side indexed</span>
              </div>
              <div className="flex items-center gap-3">
                <span><kbd className="bg-white/5 px-1 py-0.5 rounded">↑</kbd> <kbd className="bg-white/5 px-1 py-0.5 rounded">↓</kbd> to navigate</span>
                <span><kbd className="bg-white/5 px-1 py-0.5 rounded">↵</kbd> to execute</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
