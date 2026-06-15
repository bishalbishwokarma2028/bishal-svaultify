import { supabase } from './supabase';

const REQUESTS_KEY = 'vaultify-payment-requests';
const APPROVED_KEY = 'vaultify-premium-approved';
const USERS_REGISTRY_KEY = 'vaultify-users-registry';
const ADMIN_TOKEN_KEY = 'vaultify-admin-token';

export interface PremiumRequest {
  id: string;
  email: string;
  userId: string;
  transactionId: string;
  screenshotBase64?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  registeredAt: string;
  lastSignInAt: string;
}

export const getAllRequests = (): PremiumRequest[] => {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveRequest = (req: PremiumRequest): void => {
  const existing = getAllRequests();
  const idx = existing.findIndex(r => r.email === req.email);
  if (idx >= 0) {
    existing[idx] = req;
  } else {
    existing.push(req);
  }
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(existing));
};

export const updateRequestStatus = (
  email: string,
  status: 'approved' | 'rejected'
): void => {
  const all = getAllRequests();
  const updated = all.map(r =>
    r.email === email
      ? { ...r, status, reviewedAt: new Date().toISOString() }
      : r
  );
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
};

const getApprovedSet = (): Set<string> => {
  try {
    const arr = JSON.parse(localStorage.getItem(APPROVED_KEY) || '[]') as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
};

export const addApprovedEmail = (email: string): void => {
  const set = getApprovedSet();
  set.add(email.toLowerCase().trim());
  localStorage.setItem(APPROVED_KEY, JSON.stringify(Array.from(set)));
};

export const removeApprovedEmail = (email: string): void => {
  const set = getApprovedSet();
  set.delete(email.toLowerCase().trim());
  localStorage.setItem(APPROVED_KEY, JSON.stringify(Array.from(set)));
};

export const getApprovedEmails = (): string[] =>
  Array.from(getApprovedSet());

export const isEmailApproved = (email: string): boolean =>
  getApprovedSet().has(email.toLowerCase().trim());

export const registerUser = (user: { id: string; email: string; fullName: string }): void => {
  const existing = getUsersRegistry();
  const lowerEmail = user.email.toLowerCase().trim();
  const idx = existing.findIndex(u => u.email === lowerEmail);
  const now = new Date().toISOString();
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], lastSignInAt: now, fullName: user.fullName || existing[idx].fullName };
  } else {
    existing.push({ id: user.id, email: lowerEmail, fullName: user.fullName, registeredAt: now, lastSignInAt: now });
  }
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(existing));
};

export const getUsersRegistry = (): RegisteredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_REGISTRY_KEY) || '[]');
  } catch {
    return [];
  }
};

export const setAdminSession = (): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, 'authenticated-' + Date.now());
};

export const getAdminSession = (): boolean => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  return token.startsWith('authenticated-');
};

export const clearAdminSession = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

// ── Cloud config via admin Supabase user metadata ────────────────────────────
// Admin settings are stored in the admin Supabase account's user_metadata so
// any device can fetch them on sync by signing in temporarily (in-memory only,
// won't disrupt the logged-in user's session).

const _SB_URL = 'https://vdqblgmisqmnelwocids.supabase.co';
const _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcWJsZ21pc3FtbmVsd29jaWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4ODIyOTAsImV4cCI6MjA5NTQ1ODI5MH0.HMbpcR_hm3-JrjW1UAf2Wk6gf1cfuanCCdw5tUsyQEw';
const _ADMIN_EMAIL = 'bishalbishwokarma089@gmail.com';
const _ADMIN_PASSWORD = 'bishal@ado@9746294386';

let _cfgCache: { settings: AdminCloudSettings; ts: number } | null = null;
const CFG_CACHE_TTL = 30 * 1000; // 30 seconds — short so admin changes reach users quickly

const makeTempClient = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(_SB_URL, _SB_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
};

export interface AdminCloudSettings {
  approvedEmails: string[];
  subscriptionPrice: number;
  freeStorageLimitGB: number;
  planAccess: Record<string, 'free' | 'premium'>;
  announcement: string;
  updatedAt: string;
}

export const pushAdminSettingsToCloud = async (settings: AdminCloudSettings): Promise<void> => {
  try {
    const client = await makeTempClient();
    const { error } = await client.auth.signInWithPassword({ email: _ADMIN_EMAIL, password: _ADMIN_PASSWORD });
    if (error) return;
    await client.auth.updateUser({ data: { admin_config: JSON.stringify(settings) } });
    await client.auth.signOut();
    _cfgCache = { settings, ts: Date.now() };
  } catch { /* silently ignore */ }
};

export const fetchAdminSettingsFromCloud = async (): Promise<AdminCloudSettings | null> => {
  if (_cfgCache && Date.now() - _cfgCache.ts < CFG_CACHE_TTL) return _cfgCache.settings;
  try {
    const client = await makeTempClient();
    const { error } = await client.auth.signInWithPassword({ email: _ADMIN_EMAIL, password: _ADMIN_PASSWORD });
    if (error) return null;
    const { data: { user } } = await client.auth.getUser();
    await client.auth.signOut();
    const raw = user?.user_metadata?.admin_config;
    if (!raw) return null;
    const settings = JSON.parse(raw) as AdminCloudSettings;
    _cfgCache = { settings, ts: Date.now() };
    return settings;
  } catch { /* silently ignore */ }
  return null;
};
