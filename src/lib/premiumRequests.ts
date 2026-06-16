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

// ── Cloud config via Supabase admin_config table ──────────────────────────────
// Settings (subscription price, storage limit, approved emails, plan access,
// announcement) live in a single row (id=1) in the admin_config table.
// The table has fully-public RLS so every device — whether the user is logged
// in or not — can read it, and the admin panel can write it without signing
// into Supabase (the admin auth is a local password check only).
//
// This replaces the old approach of signing in to the admin Supabase account
// and writing to user_metadata, which broke whenever the admin account did
// not exist in the connected project.

let _cfgCache: { settings: AdminCloudSettings; ts: number } | null = null;
const CFG_CACHE_TTL = 30 * 1000; // 30 s — short so changes reach users quickly

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
    const { error } = await supabase
      .from('admin_config')
      .upsert(
        {
          id: 1,
          approved_emails: settings.approvedEmails,
          subscription_price: settings.subscriptionPrice,
          free_storage_limit_gb: settings.freeStorageLimitGB,
          plan_access: settings.planAccess,
          announcement: settings.announcement,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (!error) {
      _cfgCache = { settings, ts: Date.now() };
    } else {
      console.warn('[admin_config] push failed:', error.message);
    }
  } catch (e) {
    console.warn('[admin_config] push error:', e);
  }
};

export const fetchAdminSettingsFromCloud = async (): Promise<AdminCloudSettings | null> => {
  if (_cfgCache && Date.now() - _cfgCache.ts < CFG_CACHE_TTL) return _cfgCache.settings;
  try {
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return null;
    const settings: AdminCloudSettings = {
      approvedEmails: data.approved_emails || [],
      subscriptionPrice: data.subscription_price || 300,
      freeStorageLimitGB: data.free_storage_limit_gb || 5,
      planAccess: data.plan_access || {},
      announcement: data.announcement || '',
      updatedAt: data.updated_at || new Date().toISOString(),
    };
    _cfgCache = { settings, ts: Date.now() };
    return settings;
  } catch {
    return null;
  }
};

// ── Transaction Screenshots ───────────────────────────────────────────────────
// Stored in the payment_screenshots Supabase table.
// screenshot_data is a base64 JPEG data URL (resized to ≤800 px / 55% quality
// before submission — roughly 40–100 KB each).
// The table allows: authenticated INSERT (own row), public SELECT + DELETE
// (so the admin panel — which has no Supabase session — can fetch and remove).

export interface TxScreenshot {
  id: string;
  user_email: string;
  user_id: string;
  transaction_id: string;
  screenshot_data: string; // base64 data URL
  submitted_at: string;
}

export const submitTxScreenshot = async (entry: TxScreenshot): Promise<void> => {
  try {
    // One entry per user — delete any previous submission first
    await supabase
      .from('payment_screenshots')
      .delete()
      .eq('user_id', entry.user_id);

    const { error } = await supabase
      .from('payment_screenshots')
      .insert({
        id: entry.id,
        user_id: entry.user_id,
        user_email: entry.user_email.toLowerCase(),
        transaction_id: entry.transaction_id,
        screenshot_data: entry.screenshot_data,
      });
    if (error) console.warn('[payment_screenshots] insert failed:', error.message);
  } catch (e) {
    console.warn('[payment_screenshots] submit error:', e);
  }
};

export const fetchTxScreenshots = async (): Promise<TxScreenshot[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_screenshots')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error || !data) return [];
    return data.map(s => ({
      id: s.id,
      user_email: s.user_email,
      user_id: s.user_id || '',
      transaction_id: s.transaction_id || '',
      screenshot_data: s.screenshot_data,
      submitted_at: s.submitted_at,
    }));
  } catch {
    return [];
  }
};

export const deleteTxScreenshot = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('payment_screenshots')
      .delete()
      .eq('id', id);
    if (error) console.warn('[payment_screenshots] delete failed:', error.message);
  } catch (e) {
    console.warn('[payment_screenshots] delete error:', e);
  }
};

// ── Cloud User Registry ───────────────────────────────────────────────────────
// Every user is upserted into user_profiles on signup / signin so the admin
// panel can see all registered users across all devices in real time.
// The table has public SELECT (anon) so admin can read without Supabase auth,
// and authenticated upsert restricted to the user's own row.

export const syncUserToCloud = async (user: { id: string; email: string; fullName: string }): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: user.id,
          email: user.email.toLowerCase().trim(),
          full_name: user.fullName || '',
          last_sign_in_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) console.warn('[user_profiles] upsert failed:', error.message);
  } catch { /* ignore — non-fatal */ }
};

export const fetchCloudUsersRegistry = async (): Promise<RegisteredUser[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('last_sign_in_at', { ascending: false });
    if (error || !data) return [];
    return data.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name || '',
      registeredAt: u.registered_at,
      lastSignInAt: u.last_sign_in_at,
    }));
  } catch {
    return [];
  }
};
