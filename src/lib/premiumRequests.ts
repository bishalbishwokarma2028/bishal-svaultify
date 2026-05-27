const REQUESTS_KEY = 'vaultify-payment-requests';
const APPROVED_KEY = 'vaultify-premium-approved';

export interface PremiumRequest {
  id: string;
  email: string;
  userId: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
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
