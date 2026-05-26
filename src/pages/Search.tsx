import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  FileText, 
  KeyRound, 
  Folder, 
  Clock, 
  X, 
  ArrowRight,
  Sliders,
  Tag
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';

export const Search: React.FC = () => {
  const { files, folders, passwords, notes } = useVaultStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [activeFilter, setActiveFilter] = useState<'all' | 'files' | 'folders' | 'passwords' | 'notes'>('all');

  // Recent queries cache
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('VAULTIFY_RECENT_SEARCHES') || '[]');
    } catch {
      return ['US Passport', 'Tax Returns', 'Stripe', 'Emergency'];
    }
  });

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter(t => t.toLowerCase() !== term.trim().toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('VAULTIFY_RECENT_SEARCHES', JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      saveRecentSearch(query.trim());
    } else {
      setSearchParams({});
    }
  };

  const clearRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(t => t !== term);
    setRecentSearches(updated);
    localStorage.setItem('VAULTIFY_RECENT_SEARCHES', JSON.stringify(updated));
  };

  // Perform multi-dimensional client query
  const searchResults = () => {
    const term = query.toLowerCase().trim();
    if (!term) return { files: [], folders: [], passwords: [], notes: [] };

    const matchedFiles = files.filter(f => 
      f.name.toLowerCase().includes(term) || 
      f.tags.some(t => t.toLowerCase().includes(term)) ||
      f.category.toLowerCase().includes(term)
    );

    const matchedFolders = folders.filter(f => 
      f.name.toLowerCase().includes(term)
    );

    const matchedPasswords = passwords.filter(p => 
      p.title.toLowerCase().includes(term) || 
      (p.username && p.username.toLowerCase().includes(term)) ||
      p.category.toLowerCase().includes(term)
    );

    const matchedNotes = notes.filter(n => 
      n.title.toLowerCase().includes(term) || 
      n.content.toLowerCase().includes(term) ||
      n.tags.some(t => t.toLowerCase().includes(term))
    );

    return {
      files: matchedFiles,
      folders: matchedFolders,
      passwords: matchedPasswords,
      notes: matchedNotes
    };
  };

  const results = searchResults();

  const totalResults = 
    results.files.length + 
    results.folders.length + 
    results.passwords.length + 
    results.notes.length;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Search bar inside page */}
      <div className="max-w-3xl mx-auto space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search instantly across your encrypted universe..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.04] focus:bg-white/[0.07] text-white text-base rounded-2xl pl-12 pr-24 py-4 border border-white/10 focus:border-blue-500/50 outline-none shadow-2xl transition-all"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue"
            >
              Query
            </button>
          </div>
        </form>

        {/* Filter Tab bar */}
        {query.trim() !== '' && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              <Sliders className="w-3.5 h-3.5 text-gray-500 mr-1" />
              {[
                { id: 'all', label: `All Hits (${totalResults})` },
                { id: 'files', label: `Documents (${results.files.length})` },
                { id: 'folders', label: `Folders (${results.folders.length})` },
                { id: 'passwords', label: `Keys (${results.passwords.length})` },
                { id: 'notes', label: `Notes (${results.notes.length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeFilter === f.id 
                      ? 'bg-white text-slate-950 font-bold shadow' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-gray-500 italic">
              Indexed locally in &lt; 5ms
            </span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto">
        {query.trim() === '' ? (
          /* RECENT SEARCHES & SUGGESTED EXPLORATION */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Recent Searches */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Recent Queries</span>
              </div>

              <div className="space-y-1">
                {recentSearches.map((term, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setQuery(term);
                      setSearchParams({ q: term });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="text-xs font-medium">{term}</span>
                    <button
                      onClick={(e) => clearRecent(term, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-rose-400 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {recentSearches.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-500">
                    No active index memory. Type any string to build cache blocks.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Browse Tags */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>Suggested Category Vectors</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'Personal IDs', 'Banking', 'Medical', 'Legal', 
                  'Travel', 'Confidential', 'Verified', 'Crypto', 'Emergency'
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(tag);
                      setSearchParams({ q: tag });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-gray-300 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* SEARCH RESULTS AREA */
          <div className="space-y-6">
            {totalResults === 0 ? (
              <div className="text-center py-16 glass-panel rounded-3xl border border-white/5">
                <SearchIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-300">No decrypted blocks found</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                  We couldn't match "{query}" against your local metadata keys. Try expanding your parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Folders hits */}
                {(activeFilter === 'all' || activeFilter === 'folders') && results.folders.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Encrypted Folders ({results.folders.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {results.folders.map(f => (
                        <div
                          key={f.id}
                          onClick={() => navigate(`/vault`)}
                          className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Folder className="w-4 h-4" style={{ color: f.color }} />
                            <span className="text-xs font-semibold text-gray-200 group-hover:text-white">
                              {f.name}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files hits */}
                {(activeFilter === 'all' || activeFilter === 'files') && results.files.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Secure Documents ({results.files.length})
                    </span>
                    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
                      {results.files.map(f => (
                        <div
                          key={f.id}
                          onClick={() => navigate(`/vault?fileId=${f.id}`)}
                          className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                                {f.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                <span className="bg-white/5 px-1 py-0.2 rounded text-gray-300">
                                  {f.category}
                                </span>
                                <span>{(f.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passwords hits */}
                {(activeFilter === 'all' || activeFilter === 'passwords') && results.passwords.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Saved Credentials ({results.passwords.length})
                    </span>
                    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
                      {results.passwords.map(p => (
                        <div
                          key={p.id}
                          onClick={() => navigate('/passwords')}
                          className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                              <KeyRound className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                                {p.title}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                {p.username || 'No identity label'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            {p.strength}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes hits */}
                {(activeFilter === 'all' || activeFilter === 'notes') && results.notes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Private Notes ({results.notes.length})
                    </span>
                    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
                      {results.notes.map(n => (
                        <div
                          key={n.id}
                          onClick={() => navigate('/notes')}
                          className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-white/5 text-emerald-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                                {n.title}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                {n.category} • {n.isLocked ? '🔒 PIN Protected' : 'Client Wrapped'}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
