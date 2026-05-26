import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Upload, 
  Edit3, 
  Trash2, 
  LogIn, 
  Share2, 
  AlertTriangle, 
  BellRing,
  Clock,
  Filter
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { ActivityLog } from '../types';

export const Timeline: React.FC = () => {
  const { activityLogs } = useVaultStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredLogs = activityLogs.filter(log => {
    if (activeFilter === 'all') return true;
    return log.action === activeFilter;
  });

  const getActionConfig = (action: ActivityLog['action']) => {
    switch (action) {
      case 'upload':
        return { icon: Upload, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
      case 'edit':
        return { icon: Edit3, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
      case 'delete':
        return { icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
      case 'login':
        return { icon: LogIn, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
      case 'share':
        return { icon: Share2, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'emergency':
        return { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/50' };
      case 'reminder':
        return { icon: BellRing, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' };
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Activity History
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            A secure record of everything that happens inside your account.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-gray-500 ml-1.5" />
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'upload', label: 'Added' },
            { id: 'delete', label: 'Deleted' },
            { id: 'login', label: 'Logins' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeFilter === f.id ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline layout */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative">
        <div className="absolute top-12 bottom-12 left-10 sm:left-12 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/30 to-transparent" />

        <div className="space-y-8 relative">
          {filteredLogs.map((log, idx) => {
            const config = getActionConfig(log.action);
            const Icon = config.icon;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="flex items-start gap-4 sm:gap-6 group"
              >
                <div className={`w-8 h-8 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0 z-10 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                <div className="flex-1 glass-panel-premium rounded-2xl p-4 border border-white/5 group-hover:border-white/10 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-gray-200 mt-1.5 group-hover:text-white">
                    {log.details}
                  </p>

                  <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                    <span>Device: <strong className="text-gray-400">{log.device || 'Web Browser'}</strong></span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-xs text-gray-500">
              <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              No activity logs recorded under this filter yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
