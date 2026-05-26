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
import { idbStorage, storeFileContent, deleteFileContent, LOCAL_FILE_PREFIX } from '../lib/localDB';
import { saveRequest, isEmailApproved } from '../lib/premiumRequests';

export const FREE_STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB

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
  submitPremiumPayment: (txId: string) => void;
  approvePayment: () => void;
  syncPremiumFromGlobal: () => void;
  
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

  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>, fileContent?: string) => Promise<void>;
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
  setHiddenVaultPin: (pin: string) => void;
  unlockHiddenVault: (pin: string) => boolean;
  lockHiddenVault: () => void;

  addEmergencyContact: (contact: Omit<EmergencyContact, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  triggerEmergencyAccess: () => void;

  createSharedLink: (link: Omit<SharedLink, 'id' | 'createdAt' | 'downloadsCount'>) => Promise<void>;

  syncFromSupabase: () => Promise<boolean>;
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
      submitPremiumPayment: (txId) => {
        const user = get().user;
        if (user) {
          saveRequest({
            id: genId(),
            email: user.email,
            userId: user.id,
            transactionId: txId,
            status: 'pending',
            submittedAt: new Date().toISOString(),
          });
        }
        set({ paymentStatus: 'pending', premiumTransactionId: txId });
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
        set({
          isAuthenticated: true,
          user,
          sessions: [
            {
              id: 'sess-' + Date.now(),
              device: 'Web Browser',
              browser: 'Vaultify Secure Web',
              ip: '127.0.0.1',
              lastActive: 'Just now',
              isCurrent: true,
              location: 'Local Access'
            }
          ]
        });
      },

      logout: async () => {
        if (supabase) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
        }
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          hiddenVaultUnlocked: false,
          folders: [],
          files: [],
          passwords: [],
          notes: [],
          reminders: [],
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

      addFile: async (fileData, fileContent?: string) => {
        const { isPremium, files } = get();
        if (!isPremium) {
          const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
          if (usedBytes + fileData.size > FREE_STORAGE_LIMIT) {
            throw new Error('STORAGE_LIMIT_EXCEEDED');
          }
        }
        const localId = genId();
        const now = new Date().toISOString();

        const fileUrl = fileContent ? `${LOCAL_FILE_PREFIX}${localId}` : (fileData.url || '');

        const newFile: FileItem = {
          id: localId,
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          url: fileUrl,
          folderId: fileData.folderId,
          category: fileData.category,
          tags: fileData.tags,
          isStarred: fileData.isStarred,
          isArchived: fileData.isArchived,
          createdAt: now,
          updatedAt: now,
          expiryDate: fileData.expiryDate
        };

        if (fileContent) {
          await storeFileContent(localId, fileContent).catch(() => {});
        }

        set((state) => ({
          files: [newFile, ...state.files],
          user: state.user ? { ...state.user, usedStorage: state.user.usedStorage + newFile.size } : null
        }));

        const userId = get().user?.id;
        if (userId && supabase) {
          try {
            const { data, error } = await supabase.from('files').insert([{
              name: fileData.name, size: fileData.size, type: fileData.type,
              url: fileData.url || '', folder_id: fileData.folderId, category: fileData.category,
              tags: fileData.tags, is_starred: fileData.isStarred, is_archived: fileData.isArchived,
              expiry_date: fileData.expiryDate || null, user_id: userId,
            }]).select().single();
            if (!error && data) {
              set((state) => ({
                files: state.files.map(f => f.id === localId ? {
                  ...f, id: data.id
                } : f)
              }));
            }
          } catch { /* keep local */ }
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

          const folders: Folder[] = (foldersRes.data || []).map(f => ({
            id: f.id, name: f.name, parentId: f.parent_id,
            color: f.color || '#3b82f6', createdAt: f.created_at, updatedAt: f.updated_at
          }));

          let totalUsed = 0;
          const files: FileItem[] = (filesRes.data || []).map(f => {
            totalUsed += Number(f.size || 0);
            return {
              id: f.id, name: f.name, size: Number(f.size || 0),
              type: f.type, url: f.url, folderId: f.folder_id,
              category: f.category, tags: f.tags || [],
              isStarred: f.is_starred, isArchived: f.is_archived,
              createdAt: f.created_at, updatedAt: f.updated_at, expiryDate: f.expiry_date
            };
          });

          const passwords: PasswordItem[] = (pwdRes.data || []).map(p => ({
            id: p.id, title: p.title, username: p.username || '',
            passwordEncrypted: p.password_encrypted, url: p.url,
            category: p.category || 'Personal', notes: p.notes,
            strength: p.strength || 'Medium', createdAt: p.created_at,
            updatedAt: p.updated_at, lastUsed: p.last_used
          }));

          const notes: NoteItem[] = (notesRes.data || []).map(n => ({
            id: n.id, title: n.title, content: n.content,
            category: n.category || 'Personal', isPinned: n.is_pinned || false,
            isLocked: n.is_locked || false, tags: n.tags || [],
            createdAt: n.created_at, updatedAt: n.updated_at
          }));

          const reminders: ReminderItem[] = (remRes.data || []).map(r => ({
            id: r.id, title: r.title, itemId: r.item_id,
            itemType: r.item_type, expiryDate: r.expiry_date,
            notifyBeforeDays: r.notify_before_days, isResolved: r.is_resolved,
            createdAt: r.created_at
          }));

          const emergencyContacts: EmergencyContact[] = (ecRes.data || []).map(c => ({
            id: c.id, name: c.name, email: c.email, phone: c.phone,
            relationship: c.relationship, accessDelayHours: c.access_delay_hours,
            status: c.status, createdAt: c.created_at
          }));

          set((state) => ({
            folders, files, passwords, notes, reminders, emergencyContacts,
            user: state.user ? { ...state.user, usedStorage: totalUsed } : null
          }));

          return true;
        } catch (err) {
          console.error('syncFromSupabase error:', err);
          return false;
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
      }),
    }
  )
);
