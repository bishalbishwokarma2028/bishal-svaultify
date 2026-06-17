import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Clock, 
  AlertTriangle, 
  UserX, 
  QrCode, 
  UserCheck, 
  Lock, 
  Plus, 
  Trash2,
  Trash,
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { Tabs } from '../components/ui/Tabs';

export const Security: React.FC = () => {
  const { 
    user, 
    sessions, 
    activityLogs, 
    emergencyContacts, 
    addEmergencyContact, 
    triggerEmergencyAccess,
    clearActivityLogs,
  } = useVaultStore();
  
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'audit'>('audit');
  
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRel, setContactRel] = useState('Spouse');
  const [contactDelay, setContactDelay] = useState(24);

  const [showQrCode, setShowQrCode] = useState(false);

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail) {
      await addEmergencyContact({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        relationship: contactRel,
        accessDelayHours: Number(contactDelay)
      });

      toast({ title: 'Emergency Contact Saved', type: 'success' });
      
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setShowAddContact(false);
    }
  };

  const handleTriggerEmergency = () => {
    if (confirm('WARNING: This will immediately allow your trusted emergency contacts to request access to your files. Continue?')) {
      triggerEmergencyAccess();
      toast({ title: 'Emergency Access Started', type: 'error' });
    }
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearLogs = () => {
    setShowClearConfirm(true);
  };

  const confirmClearLogs = () => {
    clearActivityLogs();
    setShowClearConfirm(false);
    toast({ title: 'Activity Logs Cleared', type: 'info' });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload': return 'text-emerald-400 bg-emerald-500/10';
      case 'delete': return 'text-rose-400 bg-rose-500/10';
      case 'login': return 'text-blue-400 bg-blue-500/10';
      case 'logout': return 'text-gray-400 bg-white/5';
      default: return 'text-purple-400 bg-purple-500/10';
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Security Center
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor your account security, active web sessions, and emergency contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
            100% Secure
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs 
        tabs={[
          { id: 'audit', label: 'Security Status', icon: <ShieldCheck className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="underline"
      />

      {/* TAB 1: SECURITY STATUS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Top Score summary widget */}
          <div className="p-6 rounded-3xl glass-panel-premium border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center relative border-4 border-emerald-500/30">
                <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                  {user?.securityScore || 100}%
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Excellent Security
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Your Account is Safe
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  All security features are working perfectly.
                </p>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Security Details
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Login Protection', status: 'Active', color: 'text-emerald-400' },
                  { label: 'File Encryption', status: 'Active', color: 'text-emerald-400' },
                  { label: 'Cloud Backup', status: 'Supabase', color: 'text-blue-400' },
                  { label: 'Suspicious Logins', status: '0 Attempts', color: 'text-emerald-400' },
                ].map((stat, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{stat.label}</span>
                    <span className={`text-[10px] font-bold ${stat.color}`}>{stat.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suspicious Alert Stream */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Security Alerts
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
              <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-amber-200">
                  No suspicious activity detected
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Your account is fully protected against unauthorized logins.
                </p>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                Safe
              </span>
            </div>
          </div>

          {/* Account Activity Timeline */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Account Actions
              </h3>
              {activityLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all"
                  title="Clear all activity logs"
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {activityLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${getActionColor(log.action)}`}>
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 font-medium">{log.details}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                      <span className={`uppercase tracking-wider font-bold text-[9px] px-1.5 py-0.5 rounded ${getActionColor(log.action)}`}>{log.action}</span>
                      {log.device && <span>{log.device}</span>}
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              {activityLogs.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500">
                  No actions logged yet. Your recent log history will show here.
                </div>
              )}

              {activityLogs.length > 10 && (
                <p className="text-center text-[10px] text-gray-600 pt-2">
                  Showing 10 of {activityLogs.length} logs
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-sm bg-slate-900 rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                  <Trash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Clear History</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">Do you want to Clear all the History?</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearLogs}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
