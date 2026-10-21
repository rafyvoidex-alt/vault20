import { VaultFile } from './storage';

const DB_NAME = 'LifetimeCloudVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'user_files';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('ownerEmail', 'ownerEmail', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredVaultFile extends VaultFile {
  ownerEmail: string;
}

export async function saveFileToIndexedDB(file: VaultFile, ownerEmail: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record: StoredVaultFile = { ...file, ownerEmail };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage:', err);
    // Fallback: save metadata to localStorage
    const localKey = `vault_files_${ownerEmail}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = existing.filter((f: VaultFile) => f.id !== file.id);
    // Omit large dataUrl for localStorage safety if too large
    const safeFile = { ...file, dataUrl: file.dataUrl && file.dataUrl.length > 500000 ? undefined : file.dataUrl };
    filtered.unshift(safeFile);
    localStorage.setItem(localKey, JSON.stringify(filtered));
  }
}

export async function getFilesFromIndexedDB(ownerEmail: string): Promise<VaultFile[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('ownerEmail');
      const request = index.getAll(IDBKeyRange.only(ownerEmail));

      request.onsuccess = () => {
        const files: StoredVaultFile[] = request.result || [];
        // Sort newest first
        files.sort((a, b) => b.uploadedAt - a.uploadedAt);
        resolve(files);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Reading from localStorage fallback:', err);
    const localKey = `vault_files_${ownerEmail}`;
    return JSON.parse(localStorage.getItem(localKey) || '[]');
  }
}

export async function deleteFileFromIndexedDB(id: string, ownerEmail: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    const localKey = `vault_files_${ownerEmail}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = existing.filter((f: VaultFile) => f.id !== id);
    localStorage.setItem(localKey, JSON.stringify(filtered));
  }
}

export async function clearAllFilesForUser(ownerEmail: string): Promise<void> {
  try {
    const db = await openDatabase();
    const files = await getFilesFromIndexedDB(ownerEmail);
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    for (const f of files) {
      store.delete(f.id);
    }
  } catch (err) {
    localStorage.removeItem(`vault_files_${ownerEmail}`);
  }
}
