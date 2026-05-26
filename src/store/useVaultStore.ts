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
import { getActiveSupabase } from '../lib/supabase';

interface VaultStore {
  // User Authentication & Profile
  user: UserProfile | null;
  isAuthenticated: boolean;
  hiddenVaultUnlocked: boolean;
  hiddenVaultPin: string;
  
  // Vault Data
  folders: Folder[];
  files: FileItem[];
  passwords: PasswordItem[];
  notes: NoteItem[];
  reminders: ReminderItem[];
  activityLogs: ActivityLog[];
  emergencyContacts: EmergencyContact[];
  sharedLinks: SharedLink[];
  sessions: ActiveSession[];

  // Actions
  login: (email: string, fullName?: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  // Folders
  createFolder: (name: string, parentId?: string | null, color?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Files
  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFile: (id: string, updates: Partial<FileItem>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;

  // Passwords
  addPassword: (pwd: Omit<PasswordItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePassword: (id: string, updates: Partial<PasswordItem>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;

  // Notes
  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<NoteItem>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Reminders
  addReminder: (reminder: Omit<ReminderItem, 'id' | 'createdAt'>) => Promise<void>;
  resolveReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Security & Logs
  logActivity: (action: ActivityLog['action'], details: string) => Promise<void>;
  setHiddenVaultPin: (pin: string) => void;
  unlockHiddenVault: (pin: string) => boolean;
  lockHiddenVault: () => void;

  // Emergency
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  triggerEmergencyAccess: () => void;

  // Sharing
  createSharedLink: (link: Omit<SharedLink, 'id' | 'createdAt' | 'downloadsCount'>) => Promise<void>;

  // Sync / Load all from Supabase
  syncFromSupabase: () => Promise<boolean>;
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false, // Start completely fresh and logged out!
      hiddenVaultUnlocked: false,
      hiddenVaultPin: '2026', // Default PIN for the Secret Vault
      
      // Start with completely empty data!
      folders: [],
      files: [],
      passwords: [],
      notes: [],
      reminders: [],
      activityLogs: [],
      emergencyContacts: [],
      sharedLinks: [],
      sessions: [],

      login: (email, fullName) => {
        set({
          isAuthenticated: true,
          user: {
            id: 'usr-' + Date.now(),
            email,
            fullName: fullName || email.split('@')[0],
            securityScore: 100,
            totalStorageLimit: 15 * 1024 * 1024 * 1024, // 15 GB
            usedStorage: 0,
            createdAt: new Date().toISOString(),
            isPremium: true,
          },
          // Add a default active session for the user
          sessions: [
            {
              id: 'sess-' + Date.now(),
              device: 'Current Web Browser',
              browser: 'Vaultify Secure Web',
              ip: '127.0.0.1',
              lastActive: 'Just now',
              isCurrent: true,
              location: 'Local Access'
            }
          ]
        });
        get().logActivity('login', `Logged in as ${email}`);
        // Try to automatically load real data from Supabase if connected
        get().syncFromSupabase();
      },

      logout: () => {
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
          sessions: []
        });
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));
        get().logActivity('edit', 'Updated profile settings');
      },

      createFolder: async (name, parentId = null, color = '#3b82f6') => {
        const newFolder: Folder = {
          id: 'f-' + Date.now(),
          name,
          parentId,
          color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 1. Save locally
        set((state) => ({ folders: [...state.folders, newFolder] }));
        get().logActivity('upload', `Created folder "${name}"`);

        // 2. Save permanently to Supabase
        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('folders').insert([{
              name: newFolder.name,
              color: newFolder.color,
              created_at: newFolder.createdAt,
              updated_at: newFolder.updatedAt
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      deleteFolder: async (id) => {
        // 1. Delete locally
        set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          files: state.files.filter(f => f.folderId !== id)
        }));
        get().logActivity('delete', 'Deleted folder');

        // 2. Delete permanently from Supabase
        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            // If the ID is a real UUID, delete it directly
            await supabase.from('folders').delete().eq('name', id); // We can match by name if local ID was timestamp
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      addFile: async (fileData) => {
        const newFile: FileItem = {
          ...fileData,
          id: 'file-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 1. Save locally
        set((state) => ({
          files: [newFile, ...state.files],
          user: state.user ? { ...state.user, usedStorage: state.user.usedStorage + newFile.size } : null
        }));
        get().logActivity('upload', `Uploaded file "${newFile.name}"`);

        // 2. Save permanently to Supabase
        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('files').insert([{
              name: newFile.name,
              size: newFile.size,
              type: newFile.type,
              url: newFile.url,
              category: newFile.category,
              tags: newFile.tags,
              is_starred: newFile.isStarred,
              is_archived: newFile.isArchived,
              created_at: newFile.createdAt,
              updated_at: newFile.updatedAt
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      updateFile: async (id, updates) => {
        set((state) => ({
          files: state.files.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f)
        }));
        get().logActivity('edit', 'Updated file details');

        const supabase = getActiveSupabase();
        if (supabase) {
          const target = get().files.find(f => f.id === id);
          if (target) {
            try {
              await supabase.from('files').update({
                is_starred: target.isStarred,
                tags: target.tags,
                updated_at: new Date().toISOString()
              }).eq('name', target.name);
            } catch (err) {
              console.error('Supabase sync error:', err);
            }
          }
        }
      },

      deleteFile: async (id) => {
        const file = get().files.find(f => f.id === id);
        if (file) {
          set((state) => ({
            files: state.files.filter(f => f.id !== id),
            user: state.user ? { ...state.user, usedStorage: Math.max(0, state.user.usedStorage - file.size) } : null
          }));
          get().logActivity('delete', `Deleted file "${file.name}"`);

          const supabase = getActiveSupabase();
          if (supabase) {
            try {
              await supabase.from('files').delete().eq('name', file.name);
            } catch (err) {
              console.error('Supabase sync error:', err);
            }
          }
        }
      },

      addPassword: async (pwdData) => {
        const newPwd: PasswordItem = {
          ...pwdData,
          id: 'pwd-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          passwords: [newPwd, ...state.passwords]
        }));
        get().logActivity('upload', `Saved password for "${newPwd.title}"`);

        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('passwords').insert([{
              title: newPwd.title,
              username: newPwd.username,
              password_encrypted: newPwd.passwordEncrypted,
              url: newPwd.url,
              category: newPwd.category,
              notes: newPwd.notes,
              strength: newPwd.strength,
              created_at: newPwd.createdAt,
              updated_at: newPwd.updatedAt
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      updatePassword: async (id, updates) => {
        set((state) => ({
          passwords: state.passwords.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
        }));
        get().logActivity('edit', 'Updated saved password');
      },

      deletePassword: async (id) => {
        const pwd = get().passwords.find(p => p.id === id);
        set((state) => ({
          passwords: state.passwords.filter(p => p.id !== id)
        }));
        get().logActivity('delete', 'Deleted saved password');

        if (pwd) {
          const supabase = getActiveSupabase();
          if (supabase) {
            try {
              await supabase.from('passwords').delete().eq('title', pwd.title);
            } catch (err) {
              console.error('Supabase sync error:', err);
            }
          }
        }
      },

      addNote: async (noteData) => {
        const newNote: NoteItem = {
          ...noteData,
          id: 'note-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({ notes: [newNote, ...state.notes] }));
        get().logActivity('upload', `Created note "${newNote.title}"`);

        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('notes').insert([{
              title: newNote.title,
              content: newNote.content,
              category: newNote.category,
              is_pinned: newNote.isPinned,
              is_locked: newNote.isLocked,
              tags: newNote.tags,
              created_at: newNote.createdAt,
              updated_at: newNote.updatedAt
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      updateNote: async (id, updates) => {
        set((state) => ({
          notes: state.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
        }));
        get().logActivity('edit', 'Updated secure note');

        const supabase = getActiveSupabase();
        if (supabase) {
          const target = get().notes.find(n => n.id === id);
          if (target) {
            try {
              await supabase.from('notes').update({
                title: target.title,
                content: target.content,
                is_pinned: target.isPinned,
                is_locked: target.isLocked,
                updated_at: new Date().toISOString()
              }).eq('title', target.title);
            } catch (err) {
              console.error('Supabase sync error:', err);
            }
          }
        }
      },

      deleteNote: async (id) => {
        const note = get().notes.find(n => n.id === id);
        set((state) => ({ notes: state.notes.filter(n => n.id !== id) }));
        get().logActivity('delete', 'Deleted secure note');

        if (note) {
          const supabase = getActiveSupabase();
          if (supabase) {
            try {
              await supabase.from('notes').delete().eq('title', note.title);
            } catch (err) {
              console.error('Supabase sync error:', err);
            }
          }
        }
      },

      addReminder: async (remData) => {
        const newRem: ReminderItem = {
          ...remData,
          id: 'rem-' + Date.now(),
          createdAt: new Date().toISOString()
        };

        set((state) => ({ reminders: [newRem, ...state.reminders] }));
        get().logActivity('reminder', `Added reminder for "${newRem.title}"`);

        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('reminders').insert([{
              title: newRem.title,
              item_id: newRem.itemId,
              item_type: newRem.itemType,
              expiry_date: newRem.expiryDate,
              notify_before_days: newRem.notifyBeforeDays,
              is_resolved: newRem.isResolved,
              created_at: newRem.createdAt
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      resolveReminder: async (id) => {
        set((state) => ({
          reminders: state.reminders.map(r => r.id === id ? { ...r, isResolved: true } : r)
        }));

        const supabase = getActiveSupabase();
        if (supabase) {
          const target = get().reminders.find(r => r.id === id);
          if (target) {
            try {
              await supabase.from('reminders').update({ is_resolved: true }).eq('title', target.title);
            } catch (err) {
              console.error('Supabase sync error:', err);
            }
          }
        }
      },

      deleteReminder: async (id) => {
        const rem = get().reminders.find(r => r.id === id);
        set((state) => ({ reminders: state.reminders.filter(r => r.id !== id) }));

        if (rem) {
          const supabase = getActiveSupabase();
          if (supabase) {
            try {
              await supabase.from('reminders').delete().eq('title', rem.title);
            } catch (err) {
              console.error('Supabase sync error:', err);
            }
          }
        }
      },

      logActivity: async (action, details) => {
        const newLog: ActivityLog = {
          id: 'log-' + Date.now(),
          action,
          details,
          ipAddress: '127.0.0.1',
          device: 'Web Browser',
          timestamp: new Date().toISOString()
        };

        set((state) => ({ activityLogs: [newLog, ...state.activityLogs.slice(0, 49)] }));

        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('activity_logs').insert([{
              action: newLog.action,
              details: newLog.details,
              ip_address: newLog.ipAddress,
              device: newLog.device,
              timestamp: newLog.timestamp
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
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
        const newContact: EmergencyContact = {
          ...contactData,
          id: 'ec-' + Date.now(),
          status: 'Active',
          createdAt: new Date().toISOString()
        };

        set((state) => ({ emergencyContacts: [...state.emergencyContacts, newContact] }));
        get().logActivity('emergency', `Added emergency contact: ${newContact.name}`);

        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('emergency_contacts').insert([{
              name: newContact.name,
              email: newContact.email,
              phone: newContact.phone,
              relationship: newContact.relationship,
              access_delay_hours: newContact.accessDelayHours,
              status: newContact.status,
              created_at: newContact.createdAt
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      triggerEmergencyAccess: () => {
        set((state) => ({
          user: state.user ? { ...state.user, emergencyActivated: true } : null,
          emergencyContacts: state.emergencyContacts.map(c => ({ ...c, status: 'Triggered' }))
        }));
        get().logActivity('emergency', 'Triggered Emergency Access!');
      },

      createSharedLink: async (linkData) => {
        const newLink: SharedLink = {
          ...linkData,
          id: 'link-' + Date.now(),
          downloadsCount: 0,
          createdAt: new Date().toISOString()
        };

        set((state) => ({ sharedLinks: [newLink, ...state.sharedLinks] }));
        get().logActivity('share', 'Created shared file link');

        const supabase = getActiveSupabase();
        if (supabase) {
          try {
            await supabase.from('shared_links').insert([{
              url_token: newLink.urlToken,
              is_password_protected: newLink.isPasswordProtected,
              password: newLink.password,
              is_one_time: newLink.isOneTime,
              created_at: newLink.createdAt
            }]);
          } catch (err) {
            console.error('Supabase sync error:', err);
          }
        }
      },

      // Completely Load all active data from Supabase if the user connects their keys!
      syncFromSupabase: async () => {
        const supabase = getActiveSupabase();
        if (!supabase) return false;

        try {
          // Fetch Folders
          const { data: foldersData } = await supabase.from('folders').select('*');
          if (foldersData) {
            const mappedFolders: Folder[] = foldersData.map(f => ({
              id: f.id,
              name: f.name,
              parentId: f.parent_id,
              color: f.color || '#3b82f6',
              createdAt: f.created_at,
              updatedAt: f.updated_at
            }));
            set({ folders: mappedFolders });
          }

          // Fetch Files
          const { data: filesData } = await supabase.from('files').select('*');
          if (filesData) {
            let totalUsed = 0;
            const mappedFiles: FileItem[] = filesData.map(f => {
              totalUsed += Number(f.size || 0);
              return {
                id: f.id,
                name: f.name,
                size: Number(f.size || 0),
                type: f.type,
                url: f.url,
                folderId: f.folder_id,
                category: f.category || 'Personal IDs',
                tags: f.tags || [],
                isStarred: f.is_starred || false,
                isArchived: f.is_archived || false,
                createdAt: f.created_at,
                updatedAt: f.updated_at,
                expiryDate: f.expiry_date
              };
            });
            set(state => ({ 
              files: mappedFiles,
              user: state.user ? { ...state.user, usedStorage: totalUsed } : null
            }));
          }

          // Fetch Passwords
          const { data: pwdData } = await supabase.from('passwords').select('*');
          if (pwdData) {
            const mappedPwds: PasswordItem[] = pwdData.map(p => ({
              id: p.id,
              title: p.title,
              username: p.username || '',
              passwordEncrypted: p.password_encrypted,
              url: p.url,
              category: p.category || 'Work',
              notes: p.notes,
              strength: p.strength || 'Medium',
              createdAt: p.created_at,
              updatedAt: p.updated_at,
              lastUsed: p.last_used
            }));
            set({ passwords: mappedPwds });
          }

          // Fetch Notes
          const { data: notesData } = await supabase.from('notes').select('*');
          if (notesData) {
            const mappedNotes: NoteItem[] = notesData.map(n => ({
              id: n.id,
              title: n.title,
              content: n.content,
              category: n.category || 'Personal',
              isPinned: n.is_pinned || false,
              isLocked: n.is_locked || false,
              tags: n.tags || [],
              createdAt: n.created_at,
              updatedAt: n.updated_at
            }));
            set({ notes: mappedNotes });
          }

          // Fetch Reminders
          const { data: remData } = await supabase.from('reminders').select('*');
          if (remData) {
            const mappedRems: ReminderItem[] = remData.map(r => ({
              id: r.id,
              title: r.title,
              itemId: r.item_id,
              itemType: r.item_type as any,
              expiryDate: r.expiry_date,
              notifyBeforeDays: r.notify_before_days || 30,
              isResolved: r.is_resolved || false,
              createdAt: r.created_at
            }));
            set({ reminders: mappedRems });
          }

          // Fetch Emergency Contacts
          const { data: ecData } = await supabase.from('emergency_contacts').select('*');
          if (ecData) {
            const mappedEcs: EmergencyContact[] = ecData.map(e => ({
              id: e.id,
              name: e.name,
              email: e.email,
              phone: e.phone,
              relationship: e.relationship || 'Spouse',
              accessDelayHours: e.access_delay_hours || 24,
              status: e.status as any,
              createdAt: e.created_at
            }));
            set({ emergencyContacts: mappedEcs });
          }

          return true;
        } catch (err) {
          console.error('Supabase load error:', err);
          return false;
        }
      }
    }),
    {
      name: 'vaultify-production-storage-v2', // Updated key to guarantee zero pre-filled mock state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hiddenVaultPin: state.hiddenVaultPin,
        folders: state.folders,
        files: state.files,
        passwords: state.passwords,
        notes: state.notes,
        reminders: state.reminders,
        emergencyContacts: state.emergencyContacts,
        sharedLinks: state.sharedLinks,
      }),
    }
  )
);
