import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Pencil,
  Image,
  FileArchive,
  File,
  Music,
  Video,
  X,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { CategoryType, FileItem } from '../types';
import { useToast } from '../components/ui/Toast';
import { Tabs } from '../components/ui/Tabs';
import { getFileContent, isLocalFileUrl, getFileIdFromUrl } from '../lib/localDB';

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
  if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
  if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
  if (type.includes('zip') || type.includes('archive') || type.includes('tar') || type.includes('rar')) return <FileArchive className="w-5 h-5" />;
  if (type.includes('pdf') || type.includes('word') || type.includes('text') || type.includes('document')) return <FileText className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [previewFile, setPreviewFile] = useState<FileItem | null>(
    initialFileId ? files.find(f => f.id === initialFileId) || null : null
  );
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string | null>(null);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<CategoryType>('Personal IDs');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [sharePassword, setSharePassword] = useState('');
  const [shareIsOneTime, setShareIsOneTime] = useState(true);

  const [editFile, setEditFile] = useState<FileItem | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFileCategory, setEditFileCategory] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);

  const CATEGORIES: { id: string; label: string }[] = [
    { id: 'All', label: 'All Files' },
    { id: 'Personal IDs', label: 'Personal IDs' },
    { id: 'Banking', label: 'Banking & Finance' },
    { id: 'Medical', label: 'Medical Records' },
    { id: 'Legal', label: 'Legal & Contracts' },
    { id: 'Education', label: 'Education Docs' },
    { id: 'Insurance', label: 'Insurance Docs' },
  ];

  const FOLDER_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899'];

  useEffect(() => {
    if (!previewFile) { setResolvedPreviewUrl(null); return; }
    if (isLocalFileUrl(previewFile.url)) {
      getFileContent(getFileIdFromUrl(previewFile.url)).then(url => {
        setResolvedPreviewUrl(url || null);
      }).catch(() => setResolvedPreviewUrl(null));
    } else if (previewFile.url) {
      setResolvedPreviewUrl(previewFile.url);
    } else {
      setResolvedPreviewUrl(null);
    }
  }, [previewFile]);

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

  const handleDeleteFile = async (file: FileItem) => {
    await deleteFile(file.id);
    toast({ title: 'File Deleted', description: `"${file.name}" removed from your vault.`, type: 'info' });
    setConfirmDelete(null);
    if (previewFile?.id === file.id) setPreviewFile(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const dataUrl = await readFileAsDataUrl(file);

        await addFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: '',
          folderId: currentFolderId,
          category: uploadCategory,
          tags: [],
          isStarred: false,
          isArchived: false,
        }, dataUrl);
      }

      toast({ 
        title: fileList.length > 1 ? `${fileList.length} Files Saved` : 'File Saved',
        description: 'Stored permanently on your device.',
        type: 'success' 
      });
      setShowUploadModal(false);
    } catch {
      toast({ title: 'Upload Failed', description: 'Could not read the file.', type: 'error' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file: FileItem) => {
    let dataUrl = resolvedPreviewUrl;
    if (!dataUrl && isLocalFileUrl(file.url)) {
      dataUrl = (await getFileContent(getFileIdFromUrl(file.url))) || null;
    } else if (!dataUrl && file.url && !isLocalFileUrl(file.url)) {
      dataUrl = file.url;
    }

    if (!dataUrl) {
      toast({ title: 'No file content available', type: 'error' });
      return;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = file.name;
    a.click();
    toast({ title: 'Download Started', description: file.name, type: 'success' });
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
      toast({ title: 'Shared Link Copied', type: 'success' });
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
      } else { break; }
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const isImage = (type: string) => type.startsWith('image/');
  const isPdf = (type: string) => type === 'application/pdf';

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Documents</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            All files saved privately on your device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl px-2 py-1.5 border border-white/10">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer max-w-[80px]"
            >
              <option value="date" className="bg-slate-900">Date</option>
              <option value="name" className="bg-slate-900">Name</option>
              <option value="size" className="bg-slate-900">Size</option>
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
            className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span className="hidden xs:inline">New Folder</span>
            <span className="xs:hidden">Folder</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
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
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0 no-scrollbar min-w-0">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
              currentFolderId === null ? 'text-white font-bold bg-white/5' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id || idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  currentFolderId === crumb.id ? 'text-white font-bold bg-white/5' : 'text-gray-400 hover:text-white'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] text-white text-xs rounded-xl pl-8 pr-3 py-2 border border-white/10 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Main Browse Container */}
      <div className="space-y-5">
        {currentFolders.length > 0 && searchQuery.trim() === '' && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Folders</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {currentFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[80px]"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform" style={{ color: folder.color }}>
                      <FolderIcon className="w-4 h-4 fill-current opacity-20" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder.name}" and all its files?`)) {
                          deleteFolder(folder.id);
                          toast({ title: 'Folder Deleted', type: 'info' });
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-white">
                      {folder.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
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
            <span className="text-[10px] text-gray-500">{filteredFiles.length} files</span>
          </div>

          {filteredFiles.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredFiles.map((file) => (
                  <motion.div
                    layout
                    key={file.id}
                    onClick={() => setPreviewFile(file)}
                    className="p-3 sm:p-4 rounded-2xl glass-panel border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="p-2 rounded-xl bg-white/5 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>

                      <div className="flex items-center gap-0.5 flex-shrink-0">
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
                          className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 transition-colors hidden sm:block"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(file);
                          }}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-100 truncate group-hover:text-white">
                        {file.name}
                      </p>
                      <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-300 border border-white/5 inline-block mt-1">
                        {file.category}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size/1024).toFixed(1)} KB` : `${(file.size/1048576).toFixed(1)} MB`}</span>
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
                      className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-white/5 text-blue-400 flex-shrink-0">
                          {getFileIcon(file.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                              {file.name}
                            </p>
                            {file.isStarred && <Star className="w-3 h-3 text-amber-400 fill-current flex-shrink-0" />}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                            <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-300 font-medium">
                              {file.category}
                            </span>
                            <span className="hidden xs:inline">•</span>
                            <span className="hidden xs:inline">
                              {file.size < 1048576 ? `${(file.size/1024).toFixed(1)} KB` : `${(file.size/1048576).toFixed(1)} MB`}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShareFile(file); }}
                          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all hidden sm:block"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(file); }}
                          className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete"
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
            <div className="text-center py-14 glass-panel rounded-3xl border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-600">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-300">No files here yet</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                Upload your first file — it stays on your device, never in the cloud.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold active:scale-95 transition-transform"
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FILE PREVIEW MODAL ── */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md" 
              onClick={() => setPreviewFile(null)} 
            />
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full sm:max-w-3xl glass-panel-premium sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-blue-400 flex-shrink-0">{getFileIcon(previewFile.type)}</div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{previewFile.name}</h3>
                    <p className="text-[10px] text-gray-400">
                      {previewFile.type || 'File'} • {previewFile.size < 1048576 ? `${(previewFile.size/1024).toFixed(1)} KB` : `${(previewFile.size/1048576).toFixed(1)} MB`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {resolvedPreviewUrl && (
                    <button
                      onClick={() => {
                        if (!resolvedPreviewUrl) return;
                        // Convert data URL to blob for clean new-tab opening
                        if (resolvedPreviewUrl.startsWith('data:')) {
                          const arr = resolvedPreviewUrl.split(',');
                          const mimeMatch = arr[0].match(/:(.*?);/);
                          const mime = mimeMatch ? mimeMatch[1] : previewFile.type || 'application/octet-stream';
                          const bstr = atob(arr[1]);
                          const n = bstr.length;
                          const u8arr = new Uint8Array(n);
                          for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
                          const blob = new Blob([u8arr], { type: mime });
                          const blobUrl = URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank');
                          setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
                        } else {
                          window.open(resolvedPreviewUrl, '_blank');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 active:scale-95"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Open</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(previewFile)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Download</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirmDelete(previewFile);
                      setPreviewFile(null);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-auto min-h-[200px] sm:min-h-[300px] p-4">
                {resolvedPreviewUrl ? (
                  isImage(previewFile.type) ? (
                    <img 
                      src={resolvedPreviewUrl} 
                      alt={previewFile.name} 
                      className="max-h-full max-w-full object-contain rounded shadow-2xl"
                    />
                  ) : isPdf(previewFile.type) ? (
                    <iframe
                      src={resolvedPreviewUrl}
                      className="w-full h-full min-h-[300px] rounded"
                      title={previewFile.name}
                    />
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto text-blue-400">
                        {getFileIcon(previewFile.type)}
                      </div>
                      <p className="text-sm font-semibold text-white">{previewFile.name}</p>
                      <p className="text-xs text-gray-400">Preview not available for this file type.</p>
                      <button
                        onClick={() => handleDownload(previewFile)}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                      >
                        Download to View
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-gray-600">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-semibold text-gray-400">File stored on your device</p>
                    <p className="text-[10px] text-gray-600">No preview available</p>
                  </div>
                )}
              </div>

              <div className="px-4 sm:px-6 py-3 border-t border-white/5 bg-white/[0.01] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500 block">Category</span>
                  <span className="text-white font-medium">{previewFile.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Storage</span>
                  <span className="text-emerald-400 font-medium">On Your Device</span>
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

      {/* ── CONFIRM DELETE MODAL ── */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Delete File?</h3>
                  <p className="text-xs text-gray-400 mt-0.5">This will permanently remove the file from your device.</p>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-200 truncate font-medium">{confirmDelete.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{confirmDelete.category} • {(confirmDelete.size/1024).toFixed(1)} KB</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteFile(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors active:scale-95"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE FOLDER MODAL ── */}
      <AnimatePresence>
        {showCreateFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowCreateFolder(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4"
            >
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Color Tag</label>
                  <div className="flex items-center gap-2.5">
                    {FOLDER_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewFolderColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform ${newFolderColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowCreateFolder(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── UPLOAD FILE MODAL ── */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !isUploading && setShowUploadModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full sm:max-w-md glass-panel-premium sm:rounded-2xl rounded-t-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Upload File</h3>
                <button onClick={() => !isUploading && setShowUploadModal(false)} className="text-gray-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Files are saved directly on your device — no cloud, no limits.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as CategoryType)}
                  className="w-full bg-[#0d0d14] text-white text-xs rounded-xl px-3.5 py-2.5 border border-white/10 focus:border-blue-500 outline-none"
                >
                  {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <label className={`block border-2 border-dashed rounded-xl p-8 text-center transition-colors relative cursor-pointer ${isUploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/20 hover:border-blue-500/50'}`}>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <>
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white">Saving to device...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white">Tap to select files</p>
                    <p className="text-[10px] text-gray-500 mt-1">Images, PDFs, Docs, Videos & more</p>
                    <p className="text-[10px] text-blue-400 mt-1">Multiple files supported</p>
                  </>
                )}
              </label>

              <button 
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SHARE FILE MODAL ── */}
      <AnimatePresence>
        {shareFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShareFile(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel-premium rounded-2xl p-6 border border-white/10 shadow-2xl z-10 space-y-4"
            >
              <div>
                <h3 className="text-base font-bold text-white">Share Secure Link</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Create a protected link for "{shareFile.name}".
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

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareIsOneTime}
                    onChange={(e) => setShareIsOneTime(e.target.checked)}
                    className="rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs text-gray-300">Link expires after one download</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShareFile(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
                    Copy Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT FILE MODAL ── */}
      <AnimatePresence>
        {editFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setEditFile(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel-premium rounded-3xl p-6 border border-white/10 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-400" />
                  <span>Edit File</span>
                </h3>
                <button onClick={() => setEditFile(null)} className="text-gray-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditFileSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">File Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
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
                    {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setEditFile(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
