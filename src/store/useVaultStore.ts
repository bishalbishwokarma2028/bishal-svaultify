import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  UserProfile, 
  Folder, 
  FileItem, 
  PasswordItem, 
  NoteItem, 
  ReminderItem, 
  ActivityLog, 
  EmergencyContact, 
  SharedLink,
  ActiveSession
} from '../types';
import { supabase } from '../lib/supabase';
import { idbStorage, storeFileContent, getFileContent, deleteFileContent, LOCAL_FILE_PREFIX, isLocalFileUrl, getFileIdFromUrl } from '../lib/localDB';
import { saveRequest, isEmailApproved, fetchAdminSettingsFromCloud, submitTxScreenshot } from '../lib/premiumRequests';

export const FREE_STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB default
export const getFreeStorageLimit = (): number => {
  try {
    const gb = Number(localStorage.getItem('vaultify-admin-free-limit-gb'));
    if (gb > 0) return gb * 1024 * 1024 * 1024;
  } catch { /* ignore */ }
  return FREE_STORAGE_LIMIT;
};

interface VaultStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  hiddenVaultUnlocked: boolean;
  hiddenVaultPin: string;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isPremium: boolean;
  paymentStatus: 'none' | 'pending' | 'approved';
  premiumTransactionId: string;
  premiumScreenshot: string;
  planAccess: Record<string, 'free' | 'premium'>;
  freeStorageLimitGB: number;
  subscriptionPrice: number;
  submitPremiumPayment: (screenshot?: string) => void;
  approvePayment: () => void;
  syncPremiumFromGlobal: () => void;
  dataOwnerId: string | null;
  
  folders: Folder[];
  files: FileItem[];
  passwords: PasswordItem[];
  notes: NoteItem[];
  reminders: ReminderItem[];
  activityLogs: ActivityLog[];
  emergencyContacts: EmergencyContact[];
  sharedLinks: SharedLink[];
  sessions: ActiveSession[];

  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  createFolder: (name: string, parentId?: string | null, color?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>, fileContent?: File | Blob | string) => Promise<void>;
  updateFile: (id: string, updates: Partial<FileItem>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;

  addPassword: (pwd: Omit<PasswordItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePassword: (id: string, updates: Partial<PasswordItem>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;

  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<NoteItem>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addReminder: (reminder: Omit<ReminderItem, 'id' | 'createdAt'>) => Promise<void>;
  resolveReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  logActivity: (action: ActivityLog['action'], details: string) => Promise<void>;
  clearActivityLogs: () => void;
  setHiddenVaultPin: (pin: string) => void;
  unlockHiddenVault: (pin: string) => boolean;
  lockHiddenVault: () => void;

  addEmergencyContact: (contact: Omit<EmergencyContact, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  triggerEmergencyAccess: () => void;

  createSharedLink: (link: Omit<SharedLink, 'id' | 'createdAt' | 'downloadsCount'>) => Promise<void>;

  syncFromSupabase: () => Promise<boolean>;
  refreshAdminSettings: () => Promise<void>;
  backupData: () => Promise<void>;
  restoreData: (backupJson: string) => Promise<{ success: boolean; message: string; restored: number }>;
}

const genId = () => crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hiddenVaultUnlocked: false,
      hiddenVaultPin: '',
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      isPremium: false,
      paymentStatus: 'none',
      premiumTransactionId: '',
      dataOwnerId: null,
      premiumScreenshot: '',
      planAccess: (() => { try { return JSON.parse(localStorage.getItem('vaultify-plan-access') || '{}'); } catch { return {}; } })(),
      freeStorageLimitGB: (() => { const g = Number(localStorage.getItem('vaultify-admin-free-limit-gb')); return g > 0 ? g : 5; })(),
      subscriptionPrice: (() => { const p = Number(localStorage.getItem('vaultify-subscription-price')); return p > 0 ? p : 300; })(),
      submitPremiumPayment: (screenshot) => {
        const user = get().user;
        const txId = 'SCR-' + Date.now();
        if (user) {
          saveRequest({
            id: genId(),
            email: user.email,
            userId: user.id,
            transactionId: txId,
            screenshotBase64: screenshot,
            status: 'pending',
            submittedAt: new Date().toISOString(),
          });

          // Fire-and-forget: resize screenshot and upload to cloud admin metadata
          if (screenshot) {
            (async () => {
              try {
                const resized = await new Promise<string>((resolve) => {
                  const img = new Image();
                  img.onload = () => {
                    const MAX = 400;
                    let w = img.naturalWidth, h = img.naturalHeight;
                    const scale = Math.min(1, MAX / Math.max(w, h));
                    w = Math.round(w * scale); h = Math.round(h * scale);
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.55));
                  };
                  img.onerror = () => resolve(screenshot);
                  img.src = screenshot;
                });
                await submitTxScreenshot({
                  id: txId,
                  user_email: user.email,
                  user_id: user.id,
                  transaction_id: txId,
                  screenshot_data: resized,
                  submitted_at: new Date().toISOString(),
                });
              } catch { /* cloud upload failure is non-fatal */ }
            })();
          }
        }
        set({ paymentStatus: 'pending', premiumTransactionId: txId, premiumScreenshot: screenshot || '' });
      },
      approvePayment: () => {
        set({ paymentStatus: 'approved', isPremium: true });
      },
      syncPremiumFromGlobal: () => {
        const user = get().user;
        if (user && isEmailApproved(user.email)) {
          set({ isPremium: true, paymentStatus: 'approved' });
        }
      },
      
      folders: [],
      files: [],
      passwords: [],
      notes: [],
      reminders: [],
      activityLogs: [],
      emergencyContacts: [],
      sharedLinks: [],
      sessions: [],

      login: (user) => {
        const currentOwnerId = get().dataOwnerId;
        const sessionEntry = {
          id: 'sess-' + Date.now(),
          device: 'Web Browser',
          browser: 'Vaultify Secure Web',
          ip: '127.0.0.1',
          lastActive: 'Just now',
          isCurrent: true,
          location: 'Local Access'
        };
        
        if (currentOwnerId && currentOwnerId !== user.id) {
          // Different user — clear previous user's vault data for privacy
          set({
            isAuthenticated: true,
            user,
            dataOwnerId: user.id,
            folders: [],
            files: [],
            passwords: [],
            notes: [],
            reminders: [],
            activityLogs: [],
            emergencyContacts: [],
            sharedLinks: [],
            hiddenVaultPin: '',
            hiddenVaultUnlocked: false,
            isPremium: false,
            paymentStatus: 'none',
            premiumTransactionId: '',
            sessions: [sessionEntry]
          });
        } else {
          // Same user or first login — preserve existing vault data
          set({
            isAuthenticated: true,
            user,
            dataOwnerId: user.id,
            sessions: [sessionEntry]
          });
        }

        // Restore PIN from localStorage if not already set (covers fresh device)
        setTimeout(() => {
          const state = get();
          if (!state.hiddenVaultPin) {
            try {
              const savedPin = localStorage.getItem(`vaultify_hvpin_${user.id}`);
              if (savedPin) set({ hiddenVaultPin: savedPin });
            } catch { /* ignore */ }
          }
        }, 0);
      },

      logout: async () => {
        if (supabase) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
        }
      },

      clearAuth: () => {
        // Keep vault data and dataOwnerId so same user's data persists on re-login
        set({
          isAuthenticated: false,
          user: null,
          hiddenVaultUnlocked: false,
          activityLogs: [],
          emergencyContacts: [],
          sharedLinks: [],
          sessions: [],
        });
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));
      },

      createFolder: async (name, parentId = null, color = '#3b82f6') => {
        const localId = genId();
        const now = new Date().toISOString();
        const newFolder: Folder = { id: localId, name, parentId: parentId ?? null, color, createdAt: now, updatedAt: now };
        set((state) => ({ folders: [...state.folders, newFolder] }));

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const { data, error } = await supabase.from('folders').insert([{
              name, color, parent_id: parentId, user_id: userId,
            }]).select().single();
            if (!error && data) {
              set((state) => ({
                folders: state.folders.map(f => f.id === localId ? {
                  id: data.id, name: data.name, parentId: data.parent_id,
                  color: data.color, createdAt: data.created_at, updatedAt: data.updated_at
                } : f)
              }));
            }
          } catch { /* keep local */ }
        }
        get().logActivity('upload', `Created folder "${name}"`);
      },

      deleteFolder: async (id) => {
        const filesToDelete = get().files.filter(f => f.folderId === id);
        set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          files: state.files.filter(f => f.folderId !== id)
        }));
        for (const f of filesToDelete) {
          deleteFileContent(f.id).catch(() => {});
        }

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            await supabase.from('folders').delete().eq('id', id).eq('user_id', userId);
          } catch { /* keep local delete */ }
        }
        get().logActivity('delete', 'Deleted folder');
      },

      addFile: async (fileData, fileContent?: File | Blob | string) => {
        const { isPremium, files } = get();
        if (!isPremium) {
          const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
          if (usedBytes + fileData.size > getFreeStorageLimit()) {
            throw new Error('STORAGE_LIMIT_EXCEEDED');
          }
        }
        const localId = genId();
        const now = new Date().toISOString();
        const isBlob = fileContent instanceof Blob;

        const localFileUrl = fileContent ? `${LOCAL_FILE_PREFIX}${localId}` : (fileData.url || '');

        const newFile: FileItem = {
          id: localId,
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          url: localFileUrl,
          folderId: fileData.folderId,
          category: fileData.category,
          tags: fileData.tags,
          isStarred: fileData.isStarred,
          isArchived: fileData.isArchived,
          createdAt: now,
          updatedAt: now,
          expiryDate: fileData.expiryDate
        };

        // Store metadata immediately so UI updates right away
        set((state) => ({
          files: [newFile, ...state.files],
          user: state.user ? { ...state.user, usedStorage: state.user.usedStorage + newFile.size } : null
        }));

        // Store file content in local IDB — await so content is readable before we return
        if (fileContent) {
          await storeFileContent(localId, fileContent).catch(() => {});
        }

        // ── All Supabase operations run in background — don't block the UI ──
        const userId = get().user?.id;
        if (userId && supabase) {
          (async () => {
            // Try Supabase Storage upload for cross-device access via public URL
            let storageUrl: string | null = null;
            if (isBlob) {
              try {
                await supabase.storage.createBucket('vault-files', { public: true }).catch(() => {});
                const ext = fileData.name.includes('.') ? fileData.name.split('.').pop()!.toLowerCase() : 'bin';
                const storagePath = `${userId}/${localId}.${ext}`;
                const { error: uploadError } = await supabase.storage
                  .from('vault-files')
                  .upload(storagePath, fileContent as Blob, {
                    contentType: fileData.type || 'application/octet-stream',
                    upsert: true,
                  });
                if (!uploadError) {
                  storageUrl = supabase.storage.from('vault-files').getPublicUrl(storagePath).data.publicUrl;
                  set((state) => ({
                    files: state.files.map(f => f.id === localId ? { ...f, url: storageUrl! } : f)
                  }));
                }
              } catch { /* keep local */ }
            }

            // Base64 fallback — files ≤ 20 MB stored in content column for cross-device sync
            let dbContent: string | null = null;
            if (!isBlob && typeof fileContent === 'string') {
              dbContent = fileContent;
            } else if (isBlob && !storageUrl && (fileContent as Blob).size <= 20 * 1024 * 1024) {
              try {
                dbContent = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(fileContent as Blob);
                });
              } catch { /* local-only */ }
            }

            try {
              const dbUrl = storageUrl || localFileUrl;
              const { data, error } = await supabase.from('files').insert([{
                name: fileData.name, size: fileData.size, type: fileData.type,
                url: dbUrl, content: dbContent,
                folder_id: fileData.folderId, category: fileData.category,
                tags: fileData.tags, is_starred: fileData.isStarred, is_archived: fileData.isArchived,
                expiry_date: fileData.expiryDate || null, user_id: userId,
              }]).select().single();
              if (!error && data) {
                // Mirror IDB content under the canonical Supabase UUID so both
                // keys work (sync looks up local://localId from the DB url field,
                // fallback checks local://data.id — both now have content).
                if (fileContent) {
                  getFileContent(localId).then(blob => {
                    if (blob) storeFileContent(data.id, blob).catch(() => {});
                  }).catch(() => {});
                }
                // IMPORTANT: keep url as local://localId (NOT local://data.id).
                // The localOnlyFiles filter in syncFromSupabase detects "never-synced"
                // files by checking getFileIdFromUrl(url) === f.id. Changing url to
                // local://data.id would make synced files look "never-synced" and
                // prevent remote deletions from propagating to this device.
                set((state) => ({
                  files: state.files.map(f => f.id === localId
                    ? { ...f, id: data.id, ...(storageUrl ? { url: storageUrl } : {}) }
                    : f
                  )
                }));
              }
            } catch { /* keep local */ }
          })().catch(() => {});
        }
        get().logActivity('upload', `Uploaded file "${newFile.name}"`);
      },

      updateFile: async (id, updates) => {
        set((state) => ({
          files: state.files.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f)
        }));
        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
            if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.category !== undefined) dbUpdates.category = updates.category;
            await supabase.from('files').update(dbUpdates).eq('id', id).eq('user_id', userId);
          } catch { /* keep local update */ }
        }
      },

      deleteFile: async (id) => {
        const file = get().files.find(f => f.id === id);
        set((state) => ({
          files: state.files.filter(f => f.id !== id),
          user: state.user && file ? { ...state.user, usedStorage: Math.max(0, state.user.usedStorage - file.size) } : state.user
        }));
        deleteFileContent(id).catch(() => {});

        // Delete from Supabase Storage if the file was uploaded there
        if (file && supabase && file.url && !isLocalFileUrl(file.url)) {
          try {
            const urlObj = new URL(file.url);
            const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/vault-files\/(.+)$/);
            if (match) {
              await supabase.storage.from('vault-files').remove([decodeURIComponent(match[1])]).catch(() => {});
            }
          } catch { /* ignore */ }
        }

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            await supabase.from('files').delete().eq('id', id).eq('user_id', userId);
          } catch { /* keep local delete */ }
        }
        if (file) get().logActivity('delete', `Deleted file "${file.name}"`);
      },

      addPassword: async (pwdData) => {
        const localId = genId();
        const now = new Date().toISOString();
        const newPwd: PasswordItem = {
          id: localId,
          title: pwdData.title,
          username: pwdData.username || '',
          passwordEncrypted: pwdData.passwordEncrypted,
          url: pwdData.url,
          category: pwdData.category || 'Personal',
          notes: pwdData.notes,
          strength: pwdData.strength,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ passwords: [newPwd, ...state.passwords] }));

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const { data, error } = await supabase.from('passwords').insert([{
              title: pwdData.title, username: pwdData.username,
              password_encrypted: pwdData.passwordEncrypted, url: pwdData.url || null,
              category: pwdData.category || 'Personal', notes: pwdData.notes || null,
              strength: pwdData.strength, user_id: userId,
            }]).select().single();
            if (!error && data) {
              set((state) => ({
                passwords: state.passwords.map(p => p.id === localId ? {
                  id: data.id, title: data.title, username: data.username || '',
                  passwordEncrypted: data.password_encrypted, url: data.url,
                  category: data.category, notes: data.notes,
                  strength: data.strength, createdAt: data.created_at,
                  updatedAt: data.updated_at,
                } : p)
              }));
            }
          } catch { /* keep local */ }
        }
        get().logActivity('upload', `Saved password for "${newPwd.title}"`);
      },

      updatePassword: async (id, updates) => {
        set((state) => ({
          passwords: state.passwords.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
        }));
        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (updates.lastUsed !== undefined) dbUpdates.last_used = updates.lastUsed;
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.username !== undefined) dbUpdates.username = updates.username;
            if (updates.passwordEncrypted !== undefined) dbUpdates.password_encrypted = updates.passwordEncrypted;
            await supabase.from('passwords').update(dbUpdates).eq('id', id).eq('user_id', userId);
          } catch { /* keep local update */ }
        }
      },

      deletePassword: async (id) => {
        set((state) => ({ passwords: state.passwords.filter(p => p.id !== id) }));
        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            await supabase.from('passwords').delete().eq('id', id).eq('user_id', userId);
          } catch { /* keep local delete */ }
        }
        get().logActivity('delete', 'Deleted saved password');
      },

      addNote: async (noteData) => {
        const localId = genId();
        const now = new Date().toISOString();
        const newNote: NoteItem = {
          id: localId,
          title: noteData.title,
          content: noteData.content,
          category: noteData.category,
          isPinned: noteData.isPinned,
          isLocked: noteData.isLocked,
          tags: noteData.tags,
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const { data, error } = await supabase.from('notes').insert([{
              title: noteData.title, content: noteData.content, category: noteData.category,
              is_pinned: noteData.isPinned, is_locked: noteData.isLocked,
              tags: noteData.tags, user_id: userId,
            }]).select().single();
            if (!error && data) {
              set((state) => ({
                notes: state.notes.map(n => n.id === localId ? {
                  id: data.id, title: data.title, content: data.content,
                  category: data.category, isPinned: data.is_pinned, isLocked: data.is_locked,
                  tags: data.tags || [], createdAt: data.created_at, updatedAt: data.updated_at
                } : n)
              }));
            }
          } catch { /* keep local */ }
        }
        get().logActivity('upload', `Created note "${newNote.title}"`);
      },

      updateNote: async (id, updates) => {
        set((state) => ({
          notes: state.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
        }));
        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.content !== undefined) dbUpdates.content = updates.content;
            if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
            if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
            await supabase.from('notes').update(dbUpdates).eq('id', id).eq('user_id', userId);
          } catch { /* keep local update */ }
        }
      },

      deleteNote: async (id) => {
        set((state) => ({ notes: state.notes.filter(n => n.id !== id) }));
        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
          } catch { /* keep local delete */ }
        }
        get().logActivity('delete', 'Deleted secure note');
      },

      addReminder: async (remData) => {
        const localId = genId();
        const now = new Date().toISOString();
        const newRem: ReminderItem = {
          id: localId,
          title: remData.title,
          itemId: remData.itemId,
          itemType: remData.itemType,
          expiryDate: remData.expiryDate,
          notifyBeforeDays: remData.notifyBeforeDays,
          isResolved: remData.isResolved,
          createdAt: now
        };
        set((state) => ({ reminders: [newRem, ...state.reminders] }));

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const { data, error } = await supabase.from('reminders').insert([{
              title: remData.title, item_id: remData.itemId, item_type: remData.itemType,
              expiry_date: remData.expiryDate, notify_before_days: remData.notifyBeforeDays,
              is_resolved: remData.isResolved, user_id: userId,
            }]).select().single();
            if (!error && data) {
              set((state) => ({
                reminders: state.reminders.map(r => r.id === localId ? {
                  id: data.id, title: data.title, itemId: data.item_id, itemType: data.item_type,
                  expiryDate: data.expiry_date, notifyBeforeDays: data.notify_before_days,
                  isResolved: data.is_resolved, createdAt: data.created_at
                } : r)
              }));
            }
          } catch { /* keep local */ }
        }
        get().logActivity('reminder', `Added reminder for "${newRem.title}"`);
      },

      resolveReminder: async (id) => {
        set((state) => ({
          reminders: state.reminders.map(r => r.id === id ? { ...r, isResolved: true } : r)
        }));
        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            await supabase.from('reminders').update({ is_resolved: true }).eq('id', id).eq('user_id', userId);
          } catch { /* keep local update */ }
        }
      },

      deleteReminder: async (id) => {
        set((state) => ({ reminders: state.reminders.filter(r => r.id !== id) }));
        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);
          } catch { /* keep local delete */ }
        }
      },

      logActivity: async (action, details) => {
        const userId = get().user?.id;
        const newLog: ActivityLog = {
          id: 'log-' + Date.now(),
          action,
          details,
          ipAddress: '127.0.0.1',
          device: 'Web Browser',
          timestamp: new Date().toISOString()
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs.slice(0, 49)] }));

        if (userId && supabase) {
          try {
            await supabase.from('activity_logs').insert([{
              action: newLog.action, details: newLog.details,
              ip_address: newLog.ipAddress, device: newLog.device,
              timestamp: newLog.timestamp, user_id: userId
            }]);
          } catch { /* silently ignore */ }
        }
      },

      setHiddenVaultPin: (pin) => {
        set({ hiddenVaultPin: pin });
        // Persist PIN to Supabase user metadata for cross-device sync
        if (supabase) {
          supabase.auth.updateUser({ data: { vault_pin: pin } }).catch(() => {});
        }
        // Also save in localStorage keyed by userId
        const userId = get().user?.id;
        if (userId) {
          try { localStorage.setItem(`vaultify_hvpin_${userId}`, pin); } catch { /* ignore */ }
        }
        get().logActivity('edit', 'Updated Secret Vault PIN');
      },

      unlockHiddenVault: (pin) => {
        if (pin === get().hiddenVaultPin) {
          set({ hiddenVaultUnlocked: true });
          get().logActivity('emergency', 'Unlocked Secret Vault');
          return true;
        }
        return false;
      },

      lockHiddenVault: () => {
        set({ hiddenVaultUnlocked: false });
      },

      addEmergencyContact: async (contactData) => {
        const localId = genId();
        const now = new Date().toISOString();
        const newContact: EmergencyContact = {
          id: localId,
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          relationship: contactData.relationship,
          accessDelayHours: contactData.accessDelayHours,
          status: 'Active',
          createdAt: now
        };
        set((state) => ({ emergencyContacts: [...state.emergencyContacts, newContact] }));

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const { data, error } = await supabase.from('emergency_contacts').insert([{
              name: contactData.name, email: contactData.email, phone: contactData.phone,
              relationship: contactData.relationship, access_delay_hours: contactData.accessDelayHours,
              status: 'Active', user_id: userId,
            }]).select().single();
            if (!error && data) {
              set((state) => ({
                emergencyContacts: state.emergencyContacts.map(c => c.id === localId ? {
                  id: data.id, name: data.name, email: data.email, phone: data.phone,
                  relationship: data.relationship, accessDelayHours: data.access_delay_hours,
                  status: data.status, createdAt: data.created_at
                } : c)
              }));
            }
          } catch { /* keep local */ }
        }
        get().logActivity('emergency', `Added emergency contact: ${newContact.name}`);
      },

      clearActivityLogs: () => {
        set({ activityLogs: [] });
      },

      triggerEmergencyAccess: () => {
        set((state) => ({
          user: state.user ? { ...state.user, emergencyActivated: true } : null,
          emergencyContacts: state.emergencyContacts.map(c => ({ ...c, status: 'Triggered' as const }))
        }));
        get().logActivity('emergency', 'Triggered Emergency Access!');
      },

      createSharedLink: async (linkData) => {
        const token = Math.random().toString(36).substring(2, 15);
        const localId = genId();
        const now = new Date().toISOString();
        const newLink: SharedLink = {
          id: localId,
          fileId: linkData.fileId,
          urlToken: token,
          isPasswordProtected: linkData.isPasswordProtected,
          password: linkData.password,
          isOneTime: linkData.isOneTime,
          downloadsCount: 0,
          createdAt: now
        };
        set((state) => ({ sharedLinks: [newLink, ...state.sharedLinks] }));

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const { data, error } = await supabase.from('shared_links').insert([{
              file_id: linkData.fileId, url_token: token,
              is_password_protected: linkData.isPasswordProtected, password: linkData.password || null,
              is_one_time: linkData.isOneTime, expires_at: linkData.expiresAt || null, user_id: userId,
            }]).select().single();
            if (!error && data) {
              set((state) => ({
                sharedLinks: state.sharedLinks.map(l => l.id === localId ? {
                  id: data.id, fileId: data.file_id, urlToken: data.url_token,
                  isPasswordProtected: data.is_password_protected, password: data.password,
                  isOneTime: data.is_one_time, downloadsCount: 0, createdAt: data.created_at
                } : l)
              }));
            }
          } catch { /* keep local */ }
        }
        get().logActivity('share', 'Created shared file link');
      },

      syncFromSupabase: async () => {
        const userId = get().user?.id;
        if (!userId || !supabase) return false;

        try {
          const [foldersRes, filesRes, pwdRes, notesRes, remRes, ecRes] = await Promise.all([
            supabase.from('folders').select('*').eq('user_id', userId),
            supabase.from('files').select('*').eq('user_id', userId),
            supabase.from('passwords').select('*').eq('user_id', userId),
            supabase.from('notes').select('*').eq('user_id', userId),
            supabase.from('reminders').select('*').eq('user_id', userId),
            supabase.from('emergency_contacts').select('*').eq('user_id', userId),
          ]);

          if (foldersRes.error && pwdRes.error) {
            return false;
          }

          // Build sets of Supabase IDs for deduplication
          const sbFolderIds = new Set((foldersRes.data || []).map((f: any) => f.id));
          const sbFileIds = new Set((filesRes.data || []).map((f: any) => f.id));
          const sbPwdIds = new Set((pwdRes.data || []).map((p: any) => p.id));
          const sbNoteIds = new Set((notesRes.data || []).map((n: any) => n.id));
          const sbRemIds = new Set((remRes.data || []).map((r: any) => r.id));
          const sbEcIds = new Set((ecRes.data || []).map((c: any) => c.id));

          // Map Supabase data
          const sbFolders: Folder[] = (foldersRes.data || []).map((f: any) => ({
            id: f.id, name: f.name, parentId: f.parent_id,
            color: f.color || '#3b82f6', createdAt: f.created_at, updatedAt: f.updated_at
          }));

          let totalUsed = 0;
          const sbFiles: FileItem[] = await Promise.all((filesRes.data || []).map(async (f: any) => {
            totalUsed += Number(f.size || 0);

            let resolvedUrl = '';

            if (f.content) {
              // Base64 content in DB → restore to local IDB keyed by Supabase UUID
              const existing = await getFileContent(f.id);
              if (!existing) {
                await storeFileContent(f.id, f.content).catch(() => {});
              }
              resolvedUrl = `${LOCAL_FILE_PREFIX}${f.id}`;
            } else if (f.url && !f.url.startsWith('local://')) {
              // Valid remote storage URL — accessible cross-device directly
              resolvedUrl = f.url;
            } else {
              // url is 'local://<originalLocalId>' with no content column.
              // Check if this device already has the blob.
              // First try the original local placeholder ID (Device A upload path).
              const localId = f.url ? f.url.replace('local://', '') : null;
              if (localId) {
                const localBlob = await getFileContent(localId);
                if (localBlob) {
                  // Re-index under the canonical Supabase UUID for consistency
                  await storeFileContent(f.id, localBlob).catch(() => {});
                  resolvedUrl = `${LOCAL_FILE_PREFIX}${f.id}`;
                }
              }
              // Fallback: check under the canonical Supabase UUID itself.
              // This covers the case where a backup restore already wrote content
              // to IDB under f.id BEFORE sync ran.
              if (!resolvedUrl) {
                const canonicalBlob = await getFileContent(f.id);
                if (canonicalBlob) {
                  resolvedUrl = `${LOCAL_FILE_PREFIX}${f.id}`;
                }
              }
              // else: truly not available on this device
            }

            return {
              id: f.id, name: f.name, size: Number(f.size || 0),
              type: f.type,
              url: resolvedUrl,
              folderId: f.folder_id,
              category: f.category, tags: f.tags || [],
              isStarred: f.is_starred, isArchived: f.is_archived,
              createdAt: f.created_at, updatedAt: f.updated_at, expiryDate: f.expiry_date
            };
          }));

          const sbPasswords: PasswordItem[] = (pwdRes.data || []).map((p: any) => ({
            id: p.id, title: p.title, username: p.username || '',
            passwordEncrypted: p.password_encrypted, url: p.url,
            category: p.category || 'Personal', notes: p.notes,
            strength: p.strength || 'Medium', createdAt: p.created_at,
            updatedAt: p.updated_at, lastUsed: p.last_used
          }));

          const sbNotes: NoteItem[] = (notesRes.data || []).map((n: any) => ({
            id: n.id, title: n.title, content: n.content,
            category: n.category || 'Personal', isPinned: n.is_pinned || false,
            isLocked: n.is_locked || false, tags: n.tags || [],
            createdAt: n.created_at, updatedAt: n.updated_at
          }));

          const sbReminders: ReminderItem[] = (remRes.data || []).map((r: any) => ({
            id: r.id, title: r.title, itemId: r.item_id,
            itemType: r.item_type, expiryDate: r.expiry_date,
            notifyBeforeDays: r.notify_before_days, isResolved: r.is_resolved,
            createdAt: r.created_at
          }));

          const sbEmergencyContacts: EmergencyContact[] = (ecRes.data || []).map((c: any) => ({
            id: c.id, name: c.name, email: c.email, phone: c.phone,
            relationship: c.relationship, accessDelayHours: c.access_delay_hours,
            status: c.status, createdAt: c.created_at
          }));

          // Merge: combine Supabase data with local-only items
          const state = get();
          const localOnlyFolders = state.folders.filter(f => !sbFolderIds.has(f.id));
          // A file is truly "local-only pending sync" only if its id is embedded in its own url
          // (i.e. local://id === id).  Files that were previously synced to Supabase and then
          // deleted there will have a Supabase UUID as id but a different localId in their url —
          // those must NOT be preserved; they should be treated as deleted on this device too.
          const localOnlyFiles = state.files.filter(f => {
            if (sbFileIds.has(f.id)) return false; // in Supabase — handled above
            // Only preserve if this file has never reached Supabase yet
            // (its id still matches the local placeholder id embedded in its url)
            if (isLocalFileUrl(f.url)) {
              return getFileIdFromUrl(f.url) === f.id;
            }
            // Non-local URL and not in Supabase → was synced then deleted remotely → remove
            return false;
          });
          const localOnlyPasswords = state.passwords.filter(p => !sbPwdIds.has(p.id));
          const localOnlyNotes = state.notes.filter(n => !sbNoteIds.has(n.id));
          const localOnlyReminders = state.reminders.filter(r => !sbRemIds.has(r.id));
          const localOnlyContacts = state.emergencyContacts.filter(c => !sbEcIds.has(c.id));

          set((s) => ({
            folders: [...sbFolders, ...localOnlyFolders],
            files: [...sbFiles, ...localOnlyFiles],
            passwords: [...sbPasswords, ...localOnlyPasswords],
            notes: [...sbNotes, ...localOnlyNotes],
            reminders: [...sbReminders, ...localOnlyReminders],
            emergencyContacts: [...sbEmergencyContacts, ...localOnlyContacts],
            user: s.user ? { ...s.user, usedStorage: totalUsed } : null
          }));

          // ── Fetch admin cloud settings and apply them ──────────────────────
          // This syncs subscription price, premium approvals, plan access, and
          // free storage limit from the admin's last save to every device.
          try {
            const cloudCfg = await fetchAdminSettingsFromCloud();
            if (cloudCfg) {
              if (cloudCfg.subscriptionPrice > 0) {
                localStorage.setItem('vaultify-subscription-price', String(cloudCfg.subscriptionPrice));
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'vaultify-subscription-price',
                  newValue: String(cloudCfg.subscriptionPrice)
                }));
              }
              if (Array.isArray(cloudCfg.approvedEmails)) {
                localStorage.setItem('vaultify-premium-approved', JSON.stringify(cloudCfg.approvedEmails));
              }
              if (cloudCfg.planAccess && typeof cloudCfg.planAccess === 'object') {
                localStorage.setItem('vaultify-plan-access', JSON.stringify(cloudCfg.planAccess));
                set({ planAccess: cloudCfg.planAccess });
              }
              if (cloudCfg.freeStorageLimitGB > 0) {
                localStorage.setItem('vaultify-admin-free-limit-gb', String(cloudCfg.freeStorageLimitGB));
                set({ freeStorageLimitGB: cloudCfg.freeStorageLimitGB });
              }
              if (cloudCfg.subscriptionPrice > 0) {
                set({ subscriptionPrice: cloudCfg.subscriptionPrice });
              }
              if (typeof cloudCfg.announcement === 'string') {
                localStorage.setItem('vaultify-admin-announcement', cloudCfg.announcement);
              }
              // Grant OR revoke premium based on the admin-controlled approved list.
              // This is the single source of truth — local isPremium state is always
              // overwritten by whatever the cloud says, so admin removals take effect
              // within one sync cycle (≤30 s with visibilitychange).
              const user = get().user;
              if (user && Array.isArray(cloudCfg.approvedEmails)) {
                const approvedSet = new Set(cloudCfg.approvedEmails.map((e: string) => e.toLowerCase().trim()));
                if (approvedSet.has(user.email.toLowerCase().trim())) {
                  set({ isPremium: true, paymentStatus: 'approved' });
                } else {
                  // Not in approved list — revoke premium unconditionally.
                  // If user currently has isPremium:true or paymentStatus:'approved',
                  // that means admin removed them and we must reflect that immediately.
                  set({ isPremium: false, paymentStatus: 'none' });
                }
              }
            }
          } catch { /* ignore — settings will use local defaults */ }

          return true;
        } catch (err) {
          console.error('syncFromSupabase error:', err);
          return false;
        }
      },

      refreshAdminSettings: async () => {
        try {
          const cloudCfg = await fetchAdminSettingsFromCloud();
          if (!cloudCfg) return;
          if (cloudCfg.subscriptionPrice > 0) {
            localStorage.setItem('vaultify-subscription-price', String(cloudCfg.subscriptionPrice));
            set({ subscriptionPrice: cloudCfg.subscriptionPrice });
          }
          if (Array.isArray(cloudCfg.approvedEmails)) {
            localStorage.setItem('vaultify-premium-approved', JSON.stringify(cloudCfg.approvedEmails));
          }
          if (cloudCfg.planAccess && typeof cloudCfg.planAccess === 'object') {
            localStorage.setItem('vaultify-plan-access', JSON.stringify(cloudCfg.planAccess));
            set({ planAccess: cloudCfg.planAccess });
          }
          if (cloudCfg.freeStorageLimitGB > 0) {
            localStorage.setItem('vaultify-admin-free-limit-gb', String(cloudCfg.freeStorageLimitGB));
            set({ freeStorageLimitGB: cloudCfg.freeStorageLimitGB });
          }
          if (typeof cloudCfg.announcement === 'string') {
            localStorage.setItem('vaultify-admin-announcement', cloudCfg.announcement);
          }
          const user = get().user;
          if (user && Array.isArray(cloudCfg.approvedEmails)) {
            const approvedSet = new Set(cloudCfg.approvedEmails.map((e: string) => e.toLowerCase().trim()));
            if (approvedSet.has(user.email.toLowerCase().trim())) {
              set({ isPremium: true, paymentStatus: 'approved' });
            } else if (get().paymentStatus === 'approved') {
              set({ isPremium: false, paymentStatus: 'none' });
            }
          }
        } catch { /* ignore — use cached values */ }
      },

      backupData: async () => {
        const state = get();
        const filesWithContent = await Promise.all(
          state.files.map(async (f) => {
            let blobContent: string | null = null;
            if (isLocalFileUrl(f.url)) {
              const localId = getFileIdFromUrl(f.url);
              const content = await getFileContent(localId);
              if (content instanceof Blob) {
                blobContent = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(content);
                });
              } else if (typeof content === 'string') {
                blobContent = content;
              }
            } else if (f.url && !f.url.startsWith('local://')) {
              blobContent = f.url;
            }
            return { ...f, blobContent };
          })
        );

        const backup = {
          version: 2,
          exportedAt: new Date().toISOString(),
          userEmail: state.user?.email || '',
          folders: state.folders,
          files: filesWithContent,
          passwords: state.passwords,
          notes: state.notes,
          reminders: state.reminders,
        };

        const json = JSON.stringify(backup);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vaultify-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      restoreData: async (backupJson: string) => {
        try {
          const backup = JSON.parse(backupJson);
          if (!backup.version || !Array.isArray(backup.files)) {
            return { success: false, message: 'Invalid backup file format.', restored: 0 };
          }

          const userId = get().user?.id;
          let restoredCount = 0;

          // 1. Restore folders
          const existingFolderIds = new Set(get().folders.map((f) => f.id));
          const newFolders: Folder[] = [];
          for (const folder of (backup.folders || []) as Folder[]) {
            if (!existingFolderIds.has(folder.id)) {
              newFolders.push(folder);
              if (userId && supabase) {
                await supabase.from('folders').upsert({
                  id: folder.id, name: folder.name, parent_id: folder.parentId,
                  color: folder.color || '#3b82f6', user_id: userId,
                }).catch(() => {});
              }
              restoredCount++;
            }
          }

          // 2. Restore files
          // Track IDs that already exist so we know whether to add vs update
          const existingFileMap = new Map(get().files.map((f) => [f.id, f]));
          const newFiles: FileItem[] = [];
          // IDs whose URL we need to patch in the existing state array
          const urlPatches: Map<string, string> = new Map();

          for (const fileEntry of (backup.files || []) as (FileItem & { blobContent?: string })[]) {
            const { blobContent, ...fileData } = fileEntry;
            let resolvedUrl = fileData.url || '';
            let dbContent: string | null = null;

            if (blobContent && typeof blobContent === 'string' && blobContent.startsWith('data:')) {
              // Write blob content under the Supabase UUID (canonical key)
              await storeFileContent(fileData.id, blobContent).catch(() => {});
              // ALSO write under the original local placeholder ID that the DB url field
              // points to (local://localId). This is what syncFromSupabase looks up first,
              // so storing here ensures sync never clobbers the URL back to ''.
              if (isLocalFileUrl(fileData.url)) {
                const originalLocalId = getFileIdFromUrl(fileData.url);
                if (originalLocalId && originalLocalId !== fileData.id) {
                  await storeFileContent(originalLocalId, blobContent).catch(() => {});
                }
              }
              resolvedUrl = `${LOCAL_FILE_PREFIX}${fileData.id}`;
              dbContent = blobContent;
            } else if (blobContent && typeof blobContent === 'string' && blobContent.startsWith('http')) {
              resolvedUrl = blobContent;
            }

            const existingFile = existingFileMap.get(fileData.id);
            if (existingFile) {
              // File already in state (sync may have added it with url:'').
              // If we have a better URL now, patch it in state.
              const currentUrlOk = existingFile.url && existingFile.url !== '';
              if (!currentUrlOk && resolvedUrl) {
                urlPatches.set(fileData.id, resolvedUrl);
                restoredCount++;
              }
              // Either way, if we have dbContent, push it to Supabase so future
              // syncs on other devices also get the content column.
              if (dbContent && userId && supabase) {
                await supabase.from('files').update({ content: dbContent, url: resolvedUrl })
                  .eq('id', fileData.id).eq('user_id', userId).catch(() => {});
              }
              continue;
            }

            // File not yet in state — add it
            const fileItem: FileItem = {
              id: fileData.id, name: fileData.name, size: fileData.size,
              type: fileData.type, url: resolvedUrl,
              folderId: fileData.folderId, category: fileData.category,
              tags: fileData.tags || [], isStarred: fileData.isStarred,
              isArchived: fileData.isArchived, createdAt: fileData.createdAt,
              updatedAt: fileData.updatedAt, expiryDate: fileData.expiryDate,
            };
            newFiles.push(fileItem);

            if (userId && supabase) {
              await supabase.from('files').upsert({
                id: fileData.id, name: fileData.name, size: fileData.size,
                type: fileData.type, url: resolvedUrl,
                content: dbContent,
                folder_id: fileData.folderId, category: fileData.category,
                tags: fileData.tags || [], is_starred: fileData.isStarred,
                is_archived: fileData.isArchived,
                expiry_date: fileData.expiryDate || null, user_id: userId,
              }).catch(() => {});
            }
            restoredCount++;
          }

          // 3. Restore passwords
          const existingPwdIds = new Set(get().passwords.map((p) => p.id));
          const newPasswords: PasswordItem[] = [];
          for (const pwd of (backup.passwords || []) as PasswordItem[]) {
            if (!existingPwdIds.has(pwd.id)) {
              newPasswords.push(pwd);
              if (userId && supabase) {
                await supabase.from('passwords').upsert({
                  id: pwd.id, title: pwd.title, username: pwd.username,
                  password_encrypted: pwd.passwordEncrypted, url: pwd.url || null,
                  category: pwd.category || 'Personal', notes: pwd.notes || null,
                  strength: pwd.strength, user_id: userId,
                }).catch(() => {});
              }
              restoredCount++;
            }
          }

          // 4. Restore notes
          const existingNoteIds = new Set(get().notes.map((n) => n.id));
          const newNotes: NoteItem[] = [];
          for (const note of (backup.notes || []) as NoteItem[]) {
            if (!existingNoteIds.has(note.id)) {
              newNotes.push(note);
              if (userId && supabase) {
                await supabase.from('notes').upsert({
                  id: note.id, title: note.title, content: note.content,
                  category: note.category, is_pinned: note.isPinned,
                  is_locked: note.isLocked, tags: note.tags || [], user_id: userId,
                }).catch(() => {});
              }
              restoredCount++;
            }
          }

          // 5. Restore reminders
          const existingRemIds = new Set(get().reminders.map((r) => r.id));
          const newReminders: ReminderItem[] = [];
          for (const rem of (backup.reminders || []) as ReminderItem[]) {
            if (!existingRemIds.has(rem.id)) {
              newReminders.push(rem);
              if (userId && supabase) {
                await supabase.from('reminders').upsert({
                  id: rem.id, title: rem.title, item_id: rem.itemId,
                  item_type: rem.itemType, expiry_date: rem.expiryDate,
                  notify_before_days: rem.notifyBeforeDays,
                  is_resolved: rem.isResolved, user_id: userId,
                }).catch(() => {});
              }
              restoredCount++;
            }
          }

          // Apply all new items to state, and patch URLs for existing files
          set((s) => ({
            folders: [...s.folders, ...newFolders],
            files: [
              // Patch existing files that had empty URLs
              ...s.files.map(f => urlPatches.has(f.id) ? { ...f, url: urlPatches.get(f.id)! } : f),
              // Append brand-new files
              ...newFiles,
            ],
            passwords: [...s.passwords, ...newPasswords],
            notes: [...s.notes, ...newNotes],
            reminders: [...s.reminders, ...newReminders],
          }));

          return {
            success: true,
            message: `Successfully restored ${restoredCount} item(s) from backup.`,
            restored: restoredCount,
          };
        } catch (err) {
          return {
            success: false,
            message: `Restore failed: ${(err as Error).message}`,
            restored: 0,
          };
        }
      },
    }),
    {
      name: 'vaultify-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        theme: state.theme,
        hiddenVaultPin: state.hiddenVaultPin,
        passwords: state.passwords,
        notes: state.notes,
        reminders: state.reminders,
        folders: state.folders,
        files: state.files,
        isPremium: state.isPremium,
        paymentStatus: state.paymentStatus,
        premiumTransactionId: state.premiumTransactionId,
        dataOwnerId: state.dataOwnerId,
      }),
    }
  )
);
