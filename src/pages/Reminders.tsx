import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellRing, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  KeyRound, 
  ShieldAlert
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

export const Reminders: React.FC = () => {
  const { reminders, files, passwords, addReminder, resolveReminder, deleteReminder } = useVaultStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Reminder state
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<'file' | 'password' | 'custom'>('custom');
  const [itemId, setItemId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(30);

  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title && expiryDate) {
      await addReminder({
        title,
        itemType,
        itemId: itemType === 'custom' ? 'custom-' + Date.now() : itemId,
        expiryDate: new Date(expiryDate).toISOString(),
        notifyBeforeDays: Number(notifyBeforeDays),
        isResolved: false
      });

      toast({ title: 'Reminder Saved', type: 'success' });
      
      setTitle('');
      setExpiryDate('');
      setShowAddModal(false);
    }
  };

  const activeReminders = reminders.filter(r => !r.isResolved);
  const resolvedReminders = reminders.filter(r => r.isResolved);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Expiry Reminders
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Keep track of renewal dates for passports, cards, and subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Calendar View
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-blue flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-3.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5" />
                <span>Active Reminders ({activeReminders.length})</span>
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {activeReminders
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                .map((rem) => {
                  const days = getDaysRemaining(rem.expiryDate);
                  const isCritical = days <= rem.notifyBeforeDays;

                  return (
                    <div 
                      key={rem.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isCritical ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          isCritical ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-blue-400'
                        }`}>
                          {rem.itemType === 'file' ? <FileText className="w-4 h-4" /> :
                           rem.itemType === 'password' ? <KeyRound className="w-4 h-4" /> :
                           <Clock className="w-4 h-4" />
                          }
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white truncate">{rem.title}</p>
                            {isCritical && (
                              <span className="text-[9px] bg-amber-50 text-slate-950 px-1 py-0.2 rounded font-extrabold uppercase">
                                Action Needed
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              <span>Expires: {new Date(rem.expiryDate).toLocaleDateString()}</span>
                            </span>

                            <span>•</span>

                            <span className={days < 0 ? 'text-rose-400 font-bold' : days < 30 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                              {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`}
                            </span>
                          </div>

                          {rem.itemType !== 'custom' && (
                            <button
                              onClick={() => {
                                if (rem.itemType === 'file') navigate(`/vault?fileId=${rem.itemId}`);
                                if (rem.itemType === 'password') navigate('/passwords');
                              }}
                              className="text-[10px] text-blue-400 hover:underline block mt-1"
                            >
                              View Item Details →
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <button
                          onClick={() => {
                            resolveReminder(rem.id);
                            toast({ title: 'Reminder Done', type: 'success' });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(rem.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-all"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {activeReminders.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-500">
                  No active reminders. You are completely up to date.
                </div>
              )}
            </div>
          </div>

          {/* Resolved section */}
          {resolvedReminders.length > 0 && (
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
              <div className="p-3 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Completed Reminders ({resolvedReminders.length})
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {resolvedReminders.map((rem) => (
                  <div key={rem.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="line-through">{rem.title}</span>
                    </div>

                    <button
                      onClick={() => setConfirmDeleteId(rem.id)}
                      className="text-[10px] text-gray-600 hover:text-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CALENDAR */
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase py-1">
                {d}
              </div>
            ))}

            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const fallingReminders = reminders.filter(r => {
                const date = new Date(r.expiryDate);
                return date.getDate() === dayNum && date.getMonth() === new Date().getMonth();
              });

              return (
                <div 
                  key={i} 
                  className={`h-20 rounded-xl p-1.5 border flex flex-col justify-between transition-all ${
                    fallingReminders.length > 0 
                      ? 'bg-blue-950/30 border-blue-500/30' 
                      : 'bg-white/[0.01] border-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-bold block ${fallingReminders.length > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                    {dayNum}
                  </span>

                  <div className="space-y-0.5">
                    {fallingReminders.map(fr => (
                      <div 
                        key={fr.id}
                        onClick={() => setViewMode('list')}
                        className={`text-[9px] px-1 py-0.2 rounded truncate font-medium cursor-pointer ${
                          fr.isResolved ? 'bg-emerald-950 text-emerald-400 line-through' : 'bg-amber-500 text-slate-950 font-bold'
                        }`}
                        title={fr.title}
                      >
                        {fr.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] text-gray-500">
            <span>Click any day pill to view directly inside active timeline</span>
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Automatic Email and SMS alerts enabled</span>
            </span>
          </div>
        </div>
      )}

      {/* ADD REMINDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />

          <div className="relative w-full max-w-md glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-400" />
              <span>Add Expiry Reminder</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">What is expiring?</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Passport Renewal, Netflix Subscription"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Item Type</label>
                  <select
                    value={itemType}
                    onChange={(e: any) => {
                      setItemType(e.target.value);
                      setItemId('');
                    }}
                    className="w-full bg-slate-900 text-white text-xs rounded-xl px-3 py-2 border border-white/10 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="custom">General Event</option>
                    <option value="file">Saved Document</option>
                    <option value="password">Saved Password</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Link to Item</label>
                  {itemType === 'custom' ? (
                    <input
                      type="text"
                      disabled
                      placeholder="None needed"
                      className="w-full bg-white/[0.01] text-gray-500 text-xs rounded-xl px-3 py-2 border border-white/5"
                    />
                  ) : itemType === 'file' ? (
                    <select
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      required
                      className="w-full bg-slate-900 text-white text-xs rounded-xl px-3 py-2 border border-white/10 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select File...</option>
                      {files.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      required
                      className="w-full bg-slate-900 text-white text-xs rounded-xl px-3 py-2 border border-white/10 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Password...</option>
                      {passwords.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Alert Me</label>
                <select
                  value={notifyBeforeDays}
                  onChange={(e) => setNotifyBeforeDays(Number(e.target.value))}
                  className="w-full bg-slate-900 text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value={7}>7 Days Before</option>
                  <option value={14}>14 Days Before</option>
                  <option value={30}>30 Days Before</option>
                  <option value={60}>60 Days Before</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={confirmDeleteId !== null}
        itemName={reminders.find(r => r.id === confirmDeleteId)?.title || ''}
        itemType="reminder"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            deleteReminder(confirmDeleteId);
            toast({ title: 'Reminder Deleted', type: 'info' });
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};
