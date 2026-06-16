import { get, set, del, createStore } from 'idb-keyval';

const stateStore = createStore('vaultify-db', 'app-state');
const fileStore = createStore('vaultify-files', 'file-blobs');

export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get<string>(name, stateStore);
      return value ?? null;
    } catch {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value, stateStore);
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name, stateStore);
    } catch {
      localStorage.removeItem(name);
    }
  },
};

export const storeFileContent = async (id: string, data: Blob | string): Promise<void> => {
  try {
    await set(id, data, fileStore);
  } catch {
    try {
      if (typeof data === 'string') {
        localStorage.setItem('vf-file-' + id, data);
      } else {
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(data);
        });
        localStorage.setItem('vf-file-' + id, b64);
      }
    } catch { /* silently fail */ }
  }
};

export const getFileContent = async (id: string): Promise<Blob | string | undefined> => {
  try {
    const val = await get<Blob | string>(id, fileStore);
    if (val !== undefined) return val;
    const ls = localStorage.getItem('vf-file-' + id);
    return ls ?? undefined;
  } catch {
    try {
      const ls = localStorage.getItem('vf-file-' + id);
      return ls ?? undefined;
    } catch { return undefined; }
  }
};

export const getFileContentUrl = async (id: string): Promise<string | undefined> => {
  try {
    const content = await getFileContent(id);
    if (!content) return undefined;
    if (content instanceof Blob) return URL.createObjectURL(content);
    return content as string;
  } catch { return undefined; }
};

export const deleteFileContent = async (id: string): Promise<void> => {
  try {
    await del(id, fileStore);
  } catch { /* ignore */ }
  try { localStorage.removeItem('vf-file-' + id); } catch { /* ignore */ }
};

export const LOCAL_FILE_PREFIX = 'local://';

export const isLocalFileUrl = (url: string): boolean =>
  typeof url === 'string' && url.startsWith(LOCAL_FILE_PREFIX);

export const getFileIdFromUrl = (url: string): string =>
  url.replace(LOCAL_FILE_PREFIX, '');
