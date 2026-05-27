export interface SupportMessage {
  id: string;
  userEmail: string;
  userId?: string;
  message: string;
  isFromAdmin: boolean;
  createdAt: string;
  read: boolean;
}

const MESSAGES_KEY = 'vaultify-support-messages';
const PRICE_KEY = 'vaultify-subscription-price';

export const getSubscriptionPrice = (): number => {
  const raw = localStorage.getItem(PRICE_KEY);
  return raw ? Number(raw) : 300;
};

export const setSubscriptionPrice = (price: number) => {
  localStorage.setItem(PRICE_KEY, String(price));
  window.dispatchEvent(new StorageEvent('storage', { key: PRICE_KEY, newValue: String(price) }));
};

export const getAllMessages = (): SupportMessage[] => {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getMessagesForUser = (email: string): SupportMessage[] => {
  return getAllMessages()
    .filter(m => m.userEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const sendUserMessage = (
  email: string,
  userId: string | undefined,
  message: string
): SupportMessage => {
  const msg: SupportMessage = {
    id: crypto.randomUUID(),
    userEmail: email,
    userId,
    message: message.trim(),
    isFromAdmin: false,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const all = getAllMessages();
  all.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  window.dispatchEvent(new StorageEvent('storage', { key: MESSAGES_KEY }));
  return msg;
};

export const sendAdminReply = (userEmail: string, message: string): SupportMessage => {
  const msg: SupportMessage = {
    id: crypto.randomUUID(),
    userEmail,
    userId: undefined,
    message: message.trim(),
    isFromAdmin: true,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const all = getAllMessages();
  all.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  window.dispatchEvent(new StorageEvent('storage', { key: MESSAGES_KEY }));
  return msg;
};

export const markUserMessagesRead = (email: string) => {
  const all = getAllMessages().map(m =>
    m.userEmail.toLowerCase() === email.toLowerCase() && m.isFromAdmin
      ? { ...m, read: true }
      : m
  );
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
};

export const markAdminRead = (email: string) => {
  const all = getAllMessages().map(m =>
    m.userEmail.toLowerCase() === email.toLowerCase() && !m.isFromAdmin
      ? { ...m, read: true }
      : m
  );
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
};

export const getUnreadForUser = (email: string): number =>
  getAllMessages().filter(
    m => m.userEmail.toLowerCase() === email.toLowerCase() && m.isFromAdmin && !m.read
  ).length;

export const getUnreadAdminTotal = (): number =>
  getAllMessages().filter(m => !m.isFromAdmin && !m.read).length;

export interface Conversation {
  email: string;
  messages: SupportMessage[];
  unreadCount: number;
  lastMessage: SupportMessage | null;
}

export const getAllConversations = (): Conversation[] => {
  const all = getAllMessages();
  const byEmail: Record<string, SupportMessage[]> = {};
  all.forEach(m => {
    const key = m.userEmail.toLowerCase();
    if (!byEmail[key]) byEmail[key] = [];
    byEmail[key].push(m);
  });
  return Object.entries(byEmail)
    .map(([email, messages]) => {
      const sorted = messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return {
        email,
        messages: sorted,
        unreadCount: sorted.filter(m => !m.isFromAdmin && !m.read).length,
        lastMessage: sorted[sorted.length - 1] || null,
      };
    })
    .sort((a, b) => {
      const aT = a.lastMessage?.createdAt || '';
      const bT = b.lastMessage?.createdAt || '';
      return bT.localeCompare(aT);
    });
};
