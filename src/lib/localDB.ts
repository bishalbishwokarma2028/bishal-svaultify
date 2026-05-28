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

export const storeFileContent = (id: string, data: Blob | string): Promise<void> =>
  set(id, data, fileStore);

export const getFileContent = (id: string): Promise<Blob | string | undefined> =>
  get<Blob | string>(id, fileStore);

export const getFileContentUrl = async (id: string): Promise<string | undefined> => {
  const content = await get<Blob | string>(id, fileStore);
  if (!content) return undefined;
  if (content instanceof Blob) return URL.createObjectURL(content);
  return content as string;
};

export const deleteFileContent = (id: string): Promise<void> =>
  del(id, fileStore);

export const LOCAL_FILE_PREFIX = 'local://';

export const isLocalFileUrl = (url: string): boolean =>
  typeof url === 'string' && url.startsWith(LOCAL_FILE_PREFIX);

export const getFileIdFromUrl = (url: string): string =>
  url.replace(LOCAL_FILE_PREFIX, '');
