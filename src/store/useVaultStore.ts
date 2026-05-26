import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

interface VaultStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  hiddenVaultUnlocked: boolean;
  hiddenVaultPin: string;
  
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

  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hiddenVaultUnlocked: false,
      hiddenVaultPin: '2026',
      
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
        get().syncFromSupabase();
      },

      logout: async () => {
        await supabase.auth.signOut();
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
        const userId = get().user?.id;
        if (!userId) return;

        const { data, error } = await supabase.from('folders').insert([{
          name,
          color,
          parent_id: parentId,
          user_id: userId,
        }]).select().single();

        if (error) { console.error('createFolder error:', error); return; }

        const newFolder: Folder = {
          id: data.id,
          name: data.name,
          parentId: data.parent_id,
          color: data.color,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        set((state) => ({ folders: [...state.folders, newFolder] }));
        get().logActivity('upload', `Created folder "${name}"`);
      },

      deleteFolder: async (id) => {
        const userId = get().user?.id;
        if (!userId) return;

        await supabase.from('folders').delete().eq('id', id).eq('user_id', userId);
        set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          files: state.files.filter(f => f.folderId !== id)
        }));
        get().logActivity('delete', 'Deleted folder');
      },

      addFile: async (fileData) => {
        const userId = get().user?.id;
        if (!userId) return;

        const { data, error } = await supabase.from('files').insert([{
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          url: fileData.url,
          folder_id: fileData.folderId,
          category: fileData.category,
          tags: fileData.tags,
          is_starred: fileData.isStarred,
          is_archived: fileData.isArchived,
          expiry_date: fileData.expiryDate || null,
          user_id: userId,
        }]).select().single();

        if (error) { console.error('addFile error:', error); return; }

        const newFile: FileItem = {
          id: data.id,
          name: data.name,
          size: Number(data.size),
          type: data.type,
          url: data.url,
          folderId: data.folder_id,
          category: data.category,
          tags: data.tags || [],
          isStarred: data.is_starred,
          isArchived: data.is_archived,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          expiryDate: data.expiry_date
        };

        set((state) => ({
          files: [newFile, ...state.files],
          user: state.user ? { ...state.user, usedStorage: state.user.usedStorage + newFile.size } : null
        }));
        get().logActivity('upload', `Uploaded file "${newFile.name}"`);
      },

      updateFile: async (id, updates) => {
        const userId = get().user?.id;
        if (!userId) return;

        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
        if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.category !== undefined) dbUpdates.category = updates.category;

        await supabase.from('files').update(dbUpdates).eq('id', id).eq('user_id', userId);
        set((state) => ({
          files: state.files.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f)
        }));
      },

      deleteFile: async (id) => {
        const userId = get().user?.id;
        if (!userId) return;

        const file = get().files.find(f => f.id === id);
        await supabase.from('files').delete().eq('id', id).eq('user_id', userId);
        set((state) => ({
          files: state.files.filter(f => f.id !== id),
          user: state.user && file ? { ...state.user, usedStorage: Math.max(0, state.user.usedStorage - file.size) } : state.user
        }));
        if (file) get().logActivity('delete', `Deleted file "${file.name}"`);
      },

      addPassword: async (pwdData) => {
        const userId = get().user?.id;
        if (!userId) return;

        const { data, error } = await supabase.from('passwords').insert([{
          title: pwdData.title,
          username: pwdData.username,
          password_encrypted: pwdData.passwordEncrypted,
          url: pwdData.url || null,
          category: pwdData.category,
          notes: pwdData.notes || null,
          strength: pwdData.strength,
          user_id: userId,
        }]).select().single();

        if (error) { console.error('addPassword error:', error); return; }

        const newPwd: PasswordItem = {
          id: data.id,
          title: data.title,
          username: data.username || '',
          passwordEncrypted: data.password_encrypted,
          url: data.url,
          category: data.category,
          notes: data.notes,
          strength: data.strength,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        set((state) => ({ passwords: [newPwd, ...state.passwords] }));
        get().logActivity('upload', `Saved password for "${newPwd.title}"`);
      },

      updatePassword: async (id, updates) => {
        const userId = get().user?.id;
        if (!userId) return;

        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.lastUsed !== undefined) dbUpdates.last_used = updates.lastUsed;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.username !== undefined) dbUpdates.username = updates.username;
        if (updates.passwordEncrypted !== undefined) dbUpdates.password_encrypted = updates.passwordEncrypted;

        await supabase.from('passwords').update(dbUpdates).eq('id', id).eq('user_id', userId);
        set((state) => ({
          passwords: state.passwords.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
        }));
      },

      deletePassword: async (id) => {
        const userId = get().user?.id;
        if (!userId) return;

        await supabase.from('passwords').delete().eq('id', id).eq('user_id', userId);
        set((state) => ({ passwords: state.passwords.filter(p => p.id !== id) }));
        get().logActivity('delete', 'Deleted saved password');
      },

      addNote: async (noteData) => {
        const userId = get().user?.id;
        if (!userId) return;

        const { data, error } = await supabase.from('notes').insert([{
          title: noteData.title,
          content: noteData.content,
          category: noteData.category,
          is_pinned: noteData.isPinned,
          is_locked: noteData.isLocked,
          tags: noteData.tags,
          user_id: userId,
        }]).select().single();

        if (error) { console.error('addNote error:', error); return; }

        const newNote: NoteItem = {
          id: data.id,
          title: data.title,
          content: data.content,
          category: data.category,
          isPinned: data.is_pinned,
          isLocked: data.is_locked,
          tags: data.tags || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
        get().logActivity('upload', `Created note "${newNote.title}"`);
      },

      updateNote: async (id, updates) => {
        const userId = get().user?.id;
        if (!userId) return;

        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
        if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

        await supabase.from('notes').update(dbUpdates).eq('id', id).eq('user_id', userId);
        set((state) => ({
          notes: state.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
        }));
      },

      deleteNote: async (id) => {
        const userId = get().user?.id;
        if (!userId) return;

        await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
        set((state) => ({ notes: state.notes.filter(n => n.id !== id) }));
        get().logActivity('delete', 'Deleted secure note');
      },

      addReminder: async (remData) => {
        const userId = get().user?.id;
        if (!userId) return;

        const { data, error } = await supabase.from('reminders').insert([{
          title: remData.title,
          item_id: remData.itemId,
          item_type: remData.itemType,
          expiry_date: remData.expiryDate,
          notify_before_days: remData.notifyBeforeDays,
          is_resolved: remData.isResolved,
          user_id: userId,
        }]).select().single();

        if (error) { console.error('addReminder error:', error); return; }

        const newRem: ReminderItem = {
          id: data.id,
          title: data.title,
          itemId: data.item_id,
          itemType: data.item_type,
          expiryDate: data.expiry_date,
          notifyBeforeDays: data.notify_before_days,
          isResolved: data.is_resolved,
          createdAt: data.created_at
        };
        set((state) => ({ reminders: [newRem, ...state.reminders] }));
        get().logActivity('reminder', `Added reminder for "${newRem.title}"`);
      },

      resolveReminder: async (id) => {
        const userId = get().user?.id;
        if (!userId) return;

        await supabase.from('reminders').update({ is_resolved: true }).eq('id', id).eq('user_id', userId);
        set((state) => ({
          reminders: state.reminders.map(r => r.id === id ? { ...r, isResolved: true } : r)
        }));
      },

      deleteReminder: async (id) => {
        const userId = get().user?.id;
        if (!userId) return;

        await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);
        set((state) => ({ reminders: state.reminders.filter(r => r.id !== id) }));
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

        if (userId) {
          try {
            await supabase.from('activity_logs').insert([{
              action: newLog.action,
              details: newLog.details,
              ip_address: newLog.ipAddress,
              device: newLog.device,
              timestamp: newLog.timestamp,
              user_id: userId
            }]);
          } catch (err) {
            console.error('logActivity error:', err);
          }
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
        const userId = get().user?.id;
        if (!userId) return;

        const { data, error } = await supabase.from('emergency_contacts').insert([{
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          relationship: contactData.relationship,
          access_delay_hours: contactData.accessDelayHours,
          status: 'Active',
          user_id: userId,
        }]).select().single();

        if (error) { console.error('addEmergencyContact error:', error); return; }

        const newContact: EmergencyContact = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          relationship: data.relationship,
          accessDelayHours: data.access_delay_hours,
          status: data.status,
          createdAt: data.created_at
        };
        set((state) => ({ emergencyContacts: [...state.emergencyContacts, newContact] }));
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
        const userId = get().user?.id;
        if (!userId) return;

        const token = Math.random().toString(36).substring(2, 15);
        const { data, error } = await supabase.from('shared_links').insert([{
          file_id: linkData.fileId,
          url_token: token,
          is_password_protected: linkData.isPasswordProtected,
          password: linkData.password || null,
          is_one_time: linkData.isOneTime,
          expires_at: linkData.expiresAt || null,
          user_id: userId,
        }]).select().single();

        if (error) { console.error('createSharedLink error:', error); return; }

        const newLink: SharedLink = {
          id: data.id,
          fileId: data.file_id,
          urlToken: data.url_token,
          isPasswordProtected: data.is_password_protected,
          password: data.password,
          isOneTime: data.is_one_time,
          downloadsCount: 0,
          createdAt: data.created_at
        };
        set((state) => ({ sharedLinks: [newLink, ...state.sharedLinks] }));
        get().logActivity('share', 'Created shared file link');
      },

      syncFromSupabase: async () => {
        const userId = get().user?.id;
        if (!userId) return false;

        try {
          const [foldersRes, filesRes, pwdRes, notesRes, remRes, ecRes] = await Promise.all([
            supabase.from('folders').select('*').eq('user_id', userId),
            supabase.from('files').select('*').eq('user_id', userId),
            supabase.from('passwords').select('*').eq('user_id', userId),
            supabase.from('notes').select('*').eq('user_id', userId),
            supabase.from('reminders').select('*').eq('user_id', userId),
            supabase.from('emergency_contacts').select('*').eq('user_id', userId),
          ]);

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
              category: f.category || 'Personal IDs', tags: f.tags || [],
              isStarred: f.is_starred || false, isArchived: f.is_archived || false,
              createdAt: f.created_at, updatedAt: f.updated_at, expiryDate: f.expiry_date
            };
          });

          const passwords: PasswordItem[] = (pwdRes.data || []).map(p => ({
            id: p.id, title: p.title, username: p.username || '',
            passwordEncrypted: p.password_encrypted, url: p.url,
            category: p.category || 'Work', notes: p.notes,
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
      partialize: (state) => ({
        hiddenVaultPin: state.hiddenVaultPin,
      }),
    }
  )
);
