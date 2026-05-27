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
