import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Lock, 
  Unlock, 
  Trash2, 
  Bold, 
  Italic, 
  List, 
  Link2, 
  Tag,
  Download,
  Palette,
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { useToast } from '../components/ui/Toast';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

export const Notes: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote, unlockHiddenVault } = useVaultStore();
  const { toast } = useToast();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Create state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newIsLocked, setNewIsLocked] = useState(false);
  const [newTagsString, setNewTagsString] = useState('');

  // Unlock Challenge
  const [challengeNoteId, setChallengeNoteId] = useState<string | null>(null);
  const [challengePin, setChallengePin] = useState('');
  const [unlockedNotes, setUnlockedNotes] = useState<string[]>([]);

  const categories = ['All', 'Personal', 'Work', 'Finance', 'Ideas', 'Family', 'Health', 'Travel', 'Goals'];

  const CATEGORY_COLORS: Record<string, string> = {
    Personal: 'text-blue-400 bg-blue-500/10',
    Work: 'text-purple-400 bg-purple-500/10',
    Finance: 'text-emerald-400 bg-emerald-500/10',
    Ideas: 'text-amber-400 bg-amber-500/10',
    Family: 'text-pink-400 bg-pink-500/10',
    Health: 'text-rose-400 bg-rose-500/10',
    Travel: 'text-cyan-400 bg-cyan-500/10',
    Goals: 'text-indigo-400 bg-indigo-500/10',
  };

  const handleExportNote = () => {
    if (!selectedNote) return;
    const text = `${selectedNote.title}\n${'='.repeat(selectedNote.title.length)}\n\nCategory: ${selectedNote.category}\nDate: ${new Date(selectedNote.updatedAt).toLocaleDateString()}\n\n${selectedNote.content}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Note Exported', type: 'success' });
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesCat = activeCategory === 'All' || n.category === activeCategory;
      const matchesQuery = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesQuery;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, activeCategory, searchQuery]);

  const selectedNote = notes.find(n => n.id === selectedId) || null;

  const wordCount = useMemo(() => {
    if (!selectedNote) return 0;
    return selectedNote.content.trim().split(/\s+/).filter(Boolean).length;
  }, [selectedNote?.content]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle && newContent) {
      const tagsArray = newTagsString.split(',').map(t => t.trim()).filter(Boolean);
      
      await addNote({
        title: newTitle,
        content: newContent,
        category: newCategory,
        isPinned: false,
        isLocked: newIsLocked,
        tags: tagsArray
      });

      toast({ title: 'Note Saved', type: 'success' });
      
      setNewTitle('');
      setNewContent('');
      setNewTagsString('');
      setNewIsLocked(false);
      setShowAddModal(false);
    }
  };

  const handleContentChange = async (val: string) => {
    if (selectedId) {
      await updateNote(selectedId, { content: val });
    }
  };

  const handleTitleChange = async (val: string) => {
    if (selectedId) {
      await updateNote(selectedId, { title: val });
    }
  };

  const togglePin = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateNote(id, { isPinned: !current });
    toast({ title: !current ? 'Note Pinned' : 'Note Unpinned', type: 'info' });
  };

  const toggleLock = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateNote(id, { isLocked: !current });
    toast({ title: !current ? 'Note Locked' : 'Note Unlocked', type: 'info' });
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (challengeNoteId) {
      if (unlockHiddenVault(challengePin)) {
        setUnlockedNotes(prev => [...prev, challengeNoteId]);
        setChallengeNoteId(null);
        setChallengePin('');
        toast({ title: 'Note Unlocked', type: 'success' });
      } else {
        toast({ title: 'Incorrect PIN', description: 'Please enter your correct Secret Vault PIN.', type: 'error' });
      }
    }
  };

  const injectMarkup = async (wrapper: string) => {
    if (!selectedNote) return;
    const added = `${selectedNote.content} ${wrapper}`;
    await updateNote(selectedNote.id, { content: added });
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My Notes
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Write down private thoughts, ideas, or important reminders safely.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-blue flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Write a Note</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="glass-panel rounded-2xl p-3 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? 'bg-white text-slate-950 font-bold shadow' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] text-white text-xs rounded-xl pl-8 pr-3 py-1.5 border border-white/10 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Note List */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden space-y-1">
          <div className="p-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Notes ({filteredNotes.length})
            </span>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto no-scrollbar">
            {filteredNotes.map((note) => {
              const isSelected = note.id === selectedId;
              const isLockedAndMasked = note.isLocked && !unlockedNotes.includes(note.id);

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedId(note.id);
                    if (isLockedAndMasked) {
                      setChallengeNoteId(note.id);
                    }
                  }}
                  className={`p-4 transition-all cursor-pointer relative group ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-600/10 to-indigo-600/5 border-l-4 border-blue-500' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {note.isPinned && <Pin className="w-3 h-3 text-blue-400 fill-current flex-shrink-0" />}
                        {note.isLocked && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                          {note.title}
                        </p>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                        {isLockedAndMasked 
                          ? '🔒 This note is locked. Click to enter your PIN code.' 
                          : note.content
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => togglePin(note.id, note.isPinned, e)}
                        className={`p-1 rounded hover:bg-white/10 ${note.isPinned ? 'text-blue-400' : 'text-gray-500'}`}
                        title="Pin Note"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => toggleLock(note.id, note.isLocked, e)}
                        className={`p-1 rounded hover:bg-white/10 ${note.isLocked ? 'text-amber-400' : 'text-gray-500'}`}
                        title="Lock Note"
                      >
                        {note.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[9px] text-gray-500">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${CATEGORY_COLORS[note.category] || 'bg-white/5 text-gray-400'}`}>
                      {note.category}
                    </span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-500">
                No notes found. Click "Write a Note" above to start.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Simple Note Editor */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="glass-panel-premium rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[640px]">
              <div className="px-6 py-3 border-b border-white/10 bg-black/40 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded font-mono">
                    {selectedNote.category}
                  </span>

                  {selectedNote.isLocked && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Locked Note</span>
                    </span>
                  )}
                </div>

                {/* Simple styling buttons */}
                <div className="flex items-center gap-0.5 bg-white/[0.04] p-1 rounded-lg border border-white/5">
                  <button onClick={() => injectMarkup('**Bold Text**')} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                  <button onClick={() => injectMarkup('*Italic Text*')} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                  <button onClick={() => injectMarkup('- Bullet Item')} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10" title="List"><List className="w-3.5 h-3.5" /></button>
                  <button onClick={() => injectMarkup('[Link](https://)')} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10" title="Link"><Link2 className="w-3.5 h-3.5" /></button>
                </div>

                <span className="text-[9px] text-gray-600 hidden sm:block">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>

                <button
                  onClick={handleExportNote}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  title="Export Note as .txt"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setConfirmDeleteId(selectedNote.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Editing area */}
              {selectedNote.isLocked && !unlockedNotes.includes(selectedNote.id) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                  <Lock className="w-12 h-12 text-amber-500/40 mb-3 animate-bounce" />
                  <p className="text-sm font-bold text-white">This Note is Locked</p>
                  <p className="text-xs text-gray-400 max-w-xs mt-1">
                    Please click the button below and enter your Secret Vault PIN code to read and edit this note.
                  </p>

                  <form onSubmit={(e) => { e.preventDefault(); setChallengeNoteId(selectedNote.id); }} className="mt-4 flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                    >
                      Unlock Note
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto bg-slate-950/40">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-transparent text-white font-display text-lg font-bold outline-none border-b border-transparent focus:border-white/10 pb-1 transition-all"
                    placeholder="Note Title"
                  />

                  <textarea
                    value={selectedNote.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full flex-1 bg-transparent text-gray-300 text-xs leading-relaxed outline-none resize-none font-sans"
                    placeholder="Write your note here... Changes are saved automatically."
                  />

                  <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                    <Tag className="w-3 h-3 text-gray-500" />
                    {selectedNote.tags.map((t, idx) => (
                      <span key={idx} className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                    <span className="text-[9px] text-gray-600 italic">
                      Saved Automatically
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 h-[640px] flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-300">No Note Selected</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                Choose a note from the list on the left to start reading or writing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PIN OVERLAY MODAL */}
      <AnimatePresence>
        {challengeNoteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setChallengeNoteId(null)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-4"
            >
              <div className="text-center">
                <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white">Enter PIN Code</h3>
                <p className="text-[11px] text-gray-400">
                  Please enter your Secret Vault PIN to open this note.
                </p>
              </div>

              <form onSubmit={handleUnlockSubmit} className="space-y-3">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••"
                  value={challengePin}
                  onChange={(e) => setChallengePin(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-center tracking-widest text-base rounded-xl py-2 border border-white/10 focus:border-amber-500 outline-none font-mono"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChallengeNoteId(null)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAFT NOTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />

          <div className="relative w-full max-w-xl glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl z-10 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Write a New Note</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Secure Notes, Shopping List, Ideas"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Privacy Option</label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <input
                      type="checkbox"
                      id="lockCheck"
                      checked={newIsLocked}
                      onChange={(e) => setNewIsLocked(e.target.checked)}
                      className="rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0"
                    />
                    <label htmlFor="lockCheck" className="text-xs text-amber-400 font-bold cursor-pointer flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Lock with PIN Code</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Note Content</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write your private thoughts here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none resize-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Tags (Optional, comma separated)</label>
                <input
                  type="text"
                  placeholder="Personal, Important"
                  value={newTagsString}
                  onChange={(e) => setNewTagsString(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
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
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={confirmDeleteId !== null}
        itemName={notes.find(n => n.id === confirmDeleteId)?.title || ''}
        itemType="note"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          const note = notes.find(n => n.id === confirmDeleteId);
          if (note) {
            deleteNote(note.id);
            setSelectedId(notes.length > 1 ? notes.find(n => n.id !== note.id)?.id || null : null);
            toast({ title: 'Note Deleted', type: 'info' });
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};
