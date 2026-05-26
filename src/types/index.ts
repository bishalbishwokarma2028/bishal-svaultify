export type CategoryType = 
  | 'Personal IDs' 
  | 'Education' 
  | 'Banking' 
  | 'Medical' 
  | 'Insurance' 
  | 'Legal' 
  | 'Passwords' 
  | 'Notes'
  | 'Custom';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  securityScore: number;
  totalStorageLimit: number; // in bytes
  usedStorage: number; // in bytes
  createdAt: string;
  isPremium: boolean;
  emergencyActivated?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  icon?: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string; // 'image/jpeg', 'application/pdf', etc.
  url: string;
  folderId: string | null;
  category: CategoryType;
  tags: string[];
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  expiryDate?: string;
  thumbnailUrl?: string;
}

export interface PasswordItem {
  id: string;
  title: string;
  username: string;
  passwordEncrypted: string;
  url?: string;
  category: string;
  notes?: string;
  strength: 'Weak' | 'Medium' | 'Strong' | 'Excellent';
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  itemId: string; // ID of the file or password
  itemType: 'file' | 'password' | 'custom';
  expiryDate: string;
  notifyBeforeDays: number;
  isResolved: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: 'upload' | 'edit' | 'delete' | 'login' | 'share' | 'emergency' | 'reminder';
  details: string;
  ipAddress?: string;
  device?: string;
  timestamp: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  accessDelayHours: number; // 0 for instant
  status: 'Pending' | 'Active' | 'Triggered';
  createdAt: string;
}

export interface SharedLink {
  id: string;
  fileId: string;
  urlToken: string;
  isPasswordProtected: boolean;
  password?: string;
  expiresAt?: string;
  isOneTime: boolean;
  downloadsCount: number;
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  location: string;
}
