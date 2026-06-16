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

const _SB_URL = import.meta.env.VITE_SUPABASE_URL as string
  || 'https://qstylppeypeabeocqgtv.supabase.co';
const _SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdHlscHBleXBlYWJlb2NxZ3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MDE2MjIsImV4cCI6MjA5NzE3NzYyMn0.NwhRkY4WZLPfmb-HwaNeGtbDiSK4joqzFp8pII8ViBQ';
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

// ── Transaction Screenshots ───────────────────────────────────────────────────
// Stored in the admin account's user_metadata under key `txscr_data` as a JSON
// array. No Supabase Storage buckets are used — only metadata. Screenshots are
// resized client-side to ≤800px / 72% JPEG before submission (~60-120 KB each).

export interface TxScreenshot {
  id: string;
  user_email: string;
  user_id: string;
  transaction_id: string;
  screenshot_b64: string;
  submitted_at: string;
}

const _readTxScreenshots = async (): Promise<TxScreenshot[]> => {
  try {
    const client = await makeTempClient();
    const { error } = await client.auth.signInWithPassword({ email: _ADMIN_EMAIL, password: _ADMIN_PASSWORD });
    if (error) return [];
    const { data: { user } } = await client.auth.getUser();
    await client.auth.signOut();
    const raw = user?.user_metadata?.txscr_data;
    if (!raw) return [];
    return JSON.parse(raw) as TxScreenshot[];
  } catch { return []; }
};

const _writeTxScreenshots = async (screenshots: TxScreenshot[]): Promise<void> => {
  try {
    const client = await makeTempClient();
    const { error: signInErr } = await client.auth.signInWithPassword({ email: _ADMIN_EMAIL, password: _ADMIN_PASSWORD });
    if (signInErr) { console.warn('[txscr] admin sign-in failed:', signInErr.message); return; }
    const { error } = await client.auth.updateUser({ data: { txscr_data: JSON.stringify(screenshots) } });
    if (error) console.warn('[txscr] write failed:', error.message);
    await client.auth.signOut();
  } catch (e) { console.warn('[txscr] write error:', e); }
};

/** User calls this on payment submit — adds or replaces their entry in the cloud queue. */
export const submitTxScreenshot = async (entry: TxScreenshot): Promise<void> => {
  const existing = await _readTxScreenshots();
  // One entry per email — overwrite if the same user resubmits
  const filtered = existing.filter(e => e.user_email.toLowerCase() !== entry.user_email.toLowerCase());
  await _writeTxScreenshots([...filtered, entry]);
};

/** Admin calls this to fetch all pending screenshots. */
export const fetchTxScreenshots = async (): Promise<TxScreenshot[]> => {
  return _readTxScreenshots();
};

/** Admin calls this to delete a specific screenshot by id. */
export const deleteTxScreenshot = async (id: string): Promise<void> => {
  const existing = await _readTxScreenshots();
  await _writeTxScreenshots(existing.filter(e => e.id !== id));
};

// ── Cloud User Registry ───────────────────────────────────────────────────────
// When a user signs in on any device they call syncUserToCloud which upserts
// their entry in the admin account's users_registry metadata key. The admin
// fetches all registered users across all devices with fetchCloudUsersRegistry.

/** Called on every sign-in to register the user in the cloud admin registry. */
export const syncUserToCloud = async (user: { id: string; email: string; fullName: string }): Promise<void> => {
  try {
    const client = await makeTempClient();
    const { error } = await client.auth.signInWithPassword({ email: _ADMIN_EMAIL, password: _ADMIN_PASSWORD });
    if (error) return;
    const { data: { user: adminUser } } = await client.auth.getUser();

    const lowerEmail = user.email.toLowerCase().trim();
    const now = new Date().toISOString();

    let existing: RegisteredUser[] = [];
    try {
      const raw = adminUser?.user_metadata?.users_registry;
      if (raw) existing = JSON.parse(raw);
    } catch { /* start fresh */ }

    const idx = existing.findIndex(u => u.email === lowerEmail);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], lastSignInAt: now, fullName: user.fullName || existing[idx].fullName };
    } else {
      existing.push({ id: user.id, email: lowerEmail, fullName: user.fullName, registeredAt: now, lastSignInAt: now });
    }

    await client.auth.updateUser({ data: { users_registry: JSON.stringify(existing) } });
    await client.auth.signOut();
  } catch { /* ignore — non-fatal */ }
};

/** Admin calls this to retrieve all users who have ever signed in from any device. */
export const fetchCloudUsersRegistry = async (): Promise<RegisteredUser[]> => {
  try {
    const client = await makeTempClient();
    const { error } = await client.auth.signInWithPassword({ email: _ADMIN_EMAIL, password: _ADMIN_PASSWORD });
    if (error) return [];
    const { data: { user } } = await client.auth.getUser();
    await client.auth.signOut();
    const raw = user?.user_metadata?.users_registry;
    if (!raw) return [];
    return JSON.parse(raw) as RegisteredUser[];
  } catch { return []; }
};
