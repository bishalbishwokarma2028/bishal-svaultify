import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder as FolderIcon, 
  FileText, 
  Grid, 
  List, 
  Search, 
  ArrowUpDown, 
  Star, 
  Trash2, 
  Share2, 
  Download, 
  Eye, 
  ChevronRight, 
  Home, 
  FolderPlus,
  Upload,
  Pencil
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { CategoryType, FileItem } from '../types';
import { useToast } from '../components/ui/Toast';
import { Tabs } from '../components/ui/Tabs';

export const Vault: React.FC = () => {
  const { 
    folders, 
    files, 
    createFolder, 
    deleteFolder, 
    addFile, 
    updateFile, 
    deleteFile,
    createSharedLink
  } = useVaultStore();

  const [searchParams] = useSearchParams();
  const initialFileId = searchParams.get('fileId');

  const { toast } = useToast();

  // Traversal & Filtering states
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Active Previews & Dialogs
  const [previewFile, setPreviewFile] = useState<FileItem | null>(
    initialFileId ? files.find(f => f.id === initialFileId) || null : null
  );
  
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

  const [showUploadModal, setShowUploadModal] = useState(false);

  // Sharing Modal
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [sharePassword, setSharePassword] = useState('');
  const [shareIsOneTime, setShareIsOneTime] = useState(true);

  // Edit File Modal
  const [editFile, setEditFile] = useState<FileItem | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFileCategory, setEditFileCategory] = useState('');

  // Built-in categories
  const CATEGORIES: { id: string; label: string }[] = [
    { id: 'All', label: 'All Files' },
    { id: 'Personal IDs', label: 'Personal IDs' },
    { id: 'Banking', label: 'Banking & Finance' },
    { id: 'Medical', label: 'Medical Records' },
    { id: 'Legal', label: 'Legal & Contracts' },
    { id: 'Education', label: 'Education Docs' },
    { id: 'Insurance', label: 'Insurance Docs' },
  ];

  const currentFolders = useMemo(() => {
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      if (searchQuery.trim() !== '') {
        const matchesQuery = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCat = activeCategory === 'All' || f.category === activeCategory;
        return matchesQuery && matchesCat;
      }

      const matchesFolder = f.folderId === currentFolderId;
      const matchesCat = activeCategory === 'All' || f.category === activeCategory;
      return matchesFolder && matchesCat;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'size') {
        return sortOrder === 'asc' ? a.size - b.size : b.size - a.size;
      }
      return sortOrder === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [files, currentFolderId, activeCategory, searchQuery, sortBy, sortOrder]);

  const toggleStar = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateFile(id, { isStarred: !current });
    toast({ title: !current ? 'Added to Starred files' : 'Removed from Starred', type: 'info' });
  };

  const openEditFile = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditFile(file);
    setEditFileName(file.name);
    setEditFileCategory(file.category);
  };

  const handleEditFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFile && editFileName.trim()) {
      await updateFile(editFile.id, { name: editFileName.trim(), category: editFileCategory as CategoryType });
      toast({ title: 'File Updated', type: 'success' });
      setEditFile(null);
    }
  };

  const handleSimulatedFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      
      await addFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        folderId: currentFolderId,
        category: activeCategory === 'All' ? 'Personal IDs' : (activeCategory as CategoryType),
        tags: ['Uploaded'],
        isStarred: false,
        isArchived: false,
      });

      toast({ 
        title: 'File Uploaded', 
        description: `Saved directly to your storage.`, 
        type: 'success' 
      });

      setShowUploadModal(false);
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim(), currentFolderId, newFolderColor);
      toast({ title: 'Folder Created', type: 'success' });
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shareFile) {
      const token = Math.random().toString(36).substring(2, 15);
      await createSharedLink({
        fileId: shareFile.id,
        urlToken: token,
        isPasswordProtected: !!sharePassword,
        password: sharePassword || undefined,
        isOneTime: shareIsOneTime
      });

      const fullUrl = `${window.location.origin}/share/${token}`;
      navigator.clipboard?.writeText?.(fullUrl);

      toast({ 
        title: 'Shared Link Copied', 
        description: `Link copied securely. Passwords and download limits are ready.`, 
        type: 'success' 
      });

      setShareFile(null);
      setSharePassword('');
    }
  };

  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [];
    let curr = currentFolderId;
    while (curr) {
      const folder = folders.find(f => f.id === curr);
      if (folder) {
        crumbs.unshift({ id: folder.id, name: folder.name });
        curr = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My Documents
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Organize all your files. Click folders to open them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggles */}
          <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl px-2 py-1 border border-white/10">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer"
            >
              <option value="date" className="bg-slate-900">Date Added</option>
              <option value="name" className="bg-slate-900">File Name</option>
              <option value="size" className="bg-slate-900">File Size</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="text-xs text-blue-400 font-bold px-1"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          <button
            onClick={() => setShowCreateFolder(true)}
            className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-blue flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <Tabs 
        tabs={CATEGORIES.map(c => ({
          id: c.id,
          label: c.label,
          count: c.id === 'All' ? files.length : files.filter(f => f.category === c.id).length
        }))}
        activeTab={activeCategory}
        onChange={setActiveCategory}
        variant="pills"
      />

      {/* Toolbar */}
      <div className="glass-panel rounded-2xl p-3 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              currentFolderId === null ? 'text-white font-bold bg-white/5' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Folder</span>
          </button>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id || idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  currentFolderId === crumb.id ? 'text-white font-bold bg-white/5' : 'text-gray-400 hover:text-white'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search files here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] text-white text-xs rounded-xl pl-8 pr-3 py-1.5 border border-white/10 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Main Browse Container */}
      <div className="space-y-6">
        {currentFolders.length > 0 && searchQuery.trim() === '' && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Folders
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform" style={{ color: folder.color }}>
                      <FolderIcon className="w-5 h-5 fill-current opacity-20" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder.name}" and everything inside?`)) {
                          deleteFolder(folder.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-white">
                      {folder.name}
                    </p>
                    <p className="text-[9px] text-gray-500">
                      {files.filter(f => f.folderId === folder.id).length} items
                    </p>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: folder.color }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Area */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {searchQuery ? 'Search Results' : 'Saved Files'}
            </h3>
            <span className="text-[10px] text-gray-500">
              {filteredFiles.length} files
            </span>
          </div>

          {filteredFiles.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <motion.div
                    layout
                    key={file.id}
                    onClick={() => setPreviewFile(file)}
                    className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-xl bg-white/5 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleStar(file.id, file.isStarred, e)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            file.isStarred ? 'text-amber-400' : 'text-gray-600 hover:text-gray-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => openEditFile(file, e)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit / Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareFile(file);
                          }}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Share File"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold text-gray-100 truncate group-hover:text-white">
                        {file.name}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[9px] bg-white/5 px-1.5 py-0.2 rounded text-gray-300 border border-white/5">
                          {file.category}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-blue-400">
                      <Eye className="w-3 h-3" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                              {file.name}
                            </p>
                            {file.isStarred && <Star className="w-3 h-3 text-amber-400 fill-current flex-shrink-0" />}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                            <span className="bg-white/5 px-1.5 py-0.2 rounded text-gray-300 font-medium">
                              {file.category}
                            </span>
                            <span>•</span>
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>Added {new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareFile(file);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                          title="Share File"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete file "${file.name}"?`)) {
                              deleteFile(file.id);
                              toast({ title: 'File Deleted', type: 'info' });
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-16 glass-panel rounded-3xl border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-600">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-300">No files found here</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                Upload your first file to keep it private and secure.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold glow-blue"
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILE PREVIEW MODAL */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md" 
              onClick={() => setPreviewFile(null)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl glass-panel-premium rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{previewFile.name}</h3>
                    <p className="text-[10px] text-gray-400">
                      Private Document • {(previewFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setShareFile(previewFile);
                      setPreviewFile(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  <button
                    onClick={() => {
                      toast({ title: 'File Downloaded', description: 'Saved directly to your device.', type: 'success' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 glow-blue"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors ml-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 bg-slate-950 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                {previewFile.url ? (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.name} 
                    className="max-h-full max-w-full object-contain rounded shadow-2xl"
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <FileText className="w-16 h-16 text-blue-500/20 mx-auto" />
                    <p className="text-xs font-semibold text-gray-400">Private File</p>
                    <p className="text-[10px] text-gray-600 max-w-xs">
                      This file is fully encrypted and stored securely inside your digital vault.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500 block">Category</span>
                  <span className="text-white font-medium">{previewFile.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status</span>
                  <span className="text-emerald-400 font-medium">Fully Secure</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Added</span>
                  <span className="text-white font-medium">{new Date(previewFile.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Access</span>
                  <span className="text-blue-400 font-medium">Only You</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE FOLDER MODAL */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateFolder(false)} />
          <div className="relative w-full max-w-md glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Folder</h3>
            
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Folder Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Work Documents"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-sm rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Folder Color Tag</label>
                <div className="flex items-center gap-2">
                  {[
                    '#3b82f6', // blue
                    '#10b981', // emerald
                    '#ef4444', // red
                    '#8b5cf6', // purple
                    '#f59e0b', // amber
                    '#ec4899', // pink
                  ].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${newFolderColor === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD FILE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
          <div className="relative w-full max-w-md glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-white">Upload Secure File</h3>
            <p className="text-xs text-gray-400">
              Select any file directly from your device. It will be stored safely in your account.
            </p>
            
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors relative cursor-pointer">
              <input 
                type="file" 
                onChange={handleSimulatedFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Click or drag a file here</p>
              <p className="text-[10px] text-gray-500 mt-1">Supports Images, PDFs, Word files, & Archives</p>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE FILE MODAL */}
      {shareFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShareFile(null)} />
          <div className="relative w-full max-w-md glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Share Secure Link</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Create a temporary, protected link to download "{shareFile.name}".
              </p>
            </div>

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Optional Password</label>
                <input
                  type="text"
                  placeholder="Leave empty for open download"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="oneTimeCheck"
                  checked={shareIsOneTime}
                  onChange={(e) => setShareIsOneTime(e.target.checked)}
                  className="rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0"
                />
                <label htmlFor="oneTimeCheck" className="text-xs text-gray-300 cursor-pointer">
                  Link expires after one successful download
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShareFile(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue"
                >
                  Copy Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FILE MODAL */}
      {editFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditFile(null)} />
          <div className="relative w-full max-w-md glass-panel-premium rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />
                <span>Edit File</span>
              </h3>
              <button onClick={() => setEditFile(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditFileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">File Name</label>
                <input
                  type="text"
                  required
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="w-full bg-white/[0.04] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Category</label>
                <select
                  value={editFileCategory}
                  onChange={(e) => setEditFileCategory(e.target.value)}
                  className="w-full bg-[#0d0d14] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                >
                  {['Documents', 'Photos', 'Videos', 'Audio', 'Archives', 'Code', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditFile(null)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold glow-blue">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
