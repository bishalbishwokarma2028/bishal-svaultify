import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Share2, 
  Link2, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';

export const Sharing: React.FC = () => {
  const { sharedLinks, files, logActivity } = useVaultStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRevoke = (id: string) => {
    useVaultStore.setState(state => ({
      sharedLinks: state.sharedLinks.filter(l => l.id !== id)
    }));
    logActivity('share', `Deleted shared link`);
    toast({ title: 'Shared Link Deleted', type: 'info' });
  };

  const copyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard?.writeText?.(fullUrl);
    toast({ title: 'Link Copied', description: 'You can now share this securely.', type: 'success' });
  };

  return (
    <div className="space-y-6 pb-12 select-none max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Shared Files
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your active, secure download links.
          </p>
        </div>

        <button
          onClick={() => navigate('/vault')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-50 text-white text-xs font-bold transition-all shadow-lg glow-blue flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4" />
          <span>Share a File</span>
        </button>
      </div>

      {/* Stats info box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Active Links
          </span>
          <span className="text-2xl font-bold text-white tracking-tight">
            {sharedLinks.length}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Downloads
          </span>
          <span className="text-2xl font-bold text-blue-400 tracking-tight">
            {sharedLinks.reduce((acc, curr) => acc + curr.downloadsCount, 0)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Security Status
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-tight block mt-1">
            Fully Encrypted
          </span>
        </div>
      </div>

      {/* Main List */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Active Links
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {sharedLinks.map((link) => {
            const targetFile = files.find(f => f.id === link.fileId);

            return (
              <div key={link.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/5 text-blue-400 mt-0.5 flex-shrink-0">
                    <Link2 className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {targetFile ? targetFile.name : 'Unknown File'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono">
                      <span>Link Code: <strong className="text-blue-400">{link.urlToken}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {link.isPasswordProtected ? <Lock className="w-2.5 h-2.5 text-amber-400"/> : <Unlock className="w-2.5 h-2.5 text-gray-500"/>}
                        {link.isPasswordProtected ? 'Password Enabled' : 'No Password'}
                      </span>
                      <span>•</span>
                      <span className="text-purple-400">
                        {link.isOneTime ? '⚡ One-Time Download' : 'Unlimited Downloads'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                      <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-gray-300 font-bold">
                        {link.downloadsCount} downloads
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => copyLink(link.urlToken)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>

                  <button
                    onClick={() => handleRevoke(link.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    title="Delete Link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {sharedLinks.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <FileText className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-xs font-semibold text-gray-400">No active shared links.</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                To share a file securely with a password or one-time download limit, click the share icon on any file inside your documents.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security Explained */}
      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-start gap-2.5 text-[11px] text-gray-400">
        <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-gray-200">How do shared links stay secure?</span>
          <p className="mt-0.5 leading-relaxed">
            When you create a shared link, your files remain fully locked. If you add a password, the recipient must type it in directly to download the item. Once a one-time link is downloaded, it automatically self-destructs!
          </p>
        </div>
      </div>
    </div>
  );
};
