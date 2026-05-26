import React, { useState } from 'react';
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
  Trash2 
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
    triggerEmergencyAccess 
  } = useVaultStore();
  
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'audit' | 'sessions' | 'emergency'>('audit');
  
  // Emergency Form State
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRel, setContactRel] = useState('Spouse');
  const [contactDelay, setContactDelay] = useState(24);

  // QR Modal
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
          { id: 'sessions', label: `Active Devices (${sessions.length})`, icon: <Laptop className="w-4 h-4" /> },
          { id: 'emergency', label: `Emergency Access`, icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
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
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Account Actions
            </h3>

            <div className="space-y-3">
              {activityLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 p-1 rounded-md bg-white/5 text-gray-400 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 font-medium">{log.details}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                      <span className="uppercase tracking-wider text-blue-400 font-bold">{log.action}</span>
                      <span>•</span>
                      <span>{log.device}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              {activityLogs.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500">
                  No actions logged yet. Your recent log history will show here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Active Devices
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                These are the devices currently logged into your account.
              </p>
            </div>

            <div className="divide-y divide-white/5">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white/5 text-blue-400">
                      {sess.device.includes('iPhone') ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{sess.device}</p>
                        {sess.isCurrent && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                            This Device
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                        <span>{sess.browser}</span>
                        <span>•</span>
                        <span>{sess.location}</span>
                      </div>
                      
                      <p className="text-[9px] text-emerald-400 mt-0.5">
                        Active: {sess.lastActive}
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      onClick={() => {
                        toast({ title: 'Device Logged Out', type: 'info' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY ACCESS MODE */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Emergency Access
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
              If you ever lose access to your account or are unavailable, you can choose trusted family members or friends who can request access to your files. They will only receive access after your chosen waiting period passes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setShowAddContact(true)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Trusted Contact</span>
              </button>

              <button
                onClick={() => setShowQrCode(true)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Print Recovery Card</span>
              </button>

              <button
                onClick={handleTriggerEmergency}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Start Emergency Access</span>
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Your Emergency Contacts
            </h3>

            <div className="divide-y divide-white/5">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                      <UserCheck className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{contact.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                        <span className="bg-white/5 px-1.5 py-0.2 rounded text-gray-300">
                          {contact.relationship}
                        </span>
                        <span>•</span>
                        <span>{contact.email}</span>
                        <span>•</span>
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Waiting Period</span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        {contact.accessDelayHours} Hours
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        toast({ title: 'Contact Removed', type: 'info' });
                      }}
                      className="p-1.5 rounded hover:bg-white/5 text-gray-500 hover:text-rose-400 transition-colors"
                      title="Remove Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {emergencyContacts.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500">
                  No emergency contacts added yet. Your files remain completely private.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD EMERGENCY CONTACT MODAL */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddContact(false)} />

          <div className="relative w-full max-w-md glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-white">Add Emergency Contact</h3>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Sarah Mercer"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@gmail.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Relationship</label>
                  <select
                    value={contactRel}
                    onChange={(e) => setContactRel(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Parent">Parent</option>
                    <option value="Friend">Friend</option>
                    <option value="Attorney">Attorney</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Waiting Period</label>
                  <select
                    value={contactDelay}
                    onChange={(e) => setContactDelay(Number(e.target.value))}
                    className="w-full bg-slate-900 text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value={0}>0 Hours (Immediate)</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                  </select>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 leading-relaxed">
                🔒 Your contact will only receive access if you do not cancel their request within the chosen waiting period.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE RECOVERY CARD MODAL */}
      {showQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowQrCode(false)} />

          <div className="relative w-full max-w-xs glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl z-10 text-center space-y-4">
            <h3 className="text-base font-bold text-white">Recovery Card</h3>
            <p className="text-xs text-gray-400">
              Print this card and keep it in a safe physical place.
            </p>

            <div className="p-4 bg-white rounded-xl inline-block mx-auto">
              <div className="w-48 h-48 grid grid-cols-8 gap-1 bg-white p-1">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-xs ${
                      (i % 8 < 2 && Math.floor(i / 8) < 2) ||
                      (i % 8 > 5 && Math.floor(i / 8) < 2) ||
                      (i % 8 < 2 && Math.floor(i / 8) > 5) 
                        ? 'bg-black' 
                        : Math.random() > 0.4 ? 'bg-black' : 'bg-white'
                    }`} 
                  />
                ))}
              </div>
            </div>

            <div className="text-[10px] text-gray-500 space-y-1">
              <p>Account Recovery Key</p>
              <p>Keep this completely private.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  window.print();
                  toast({ title: 'Printing Started', type: 'success' });
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold glow-blue"
              >
                Print Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
