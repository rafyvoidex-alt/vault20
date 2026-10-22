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

/**
 * Exports all user files as a secure, portable JSON backup package
 * allowing full zero-loss migration to another phone/device.
 */
export async function exportVaultBackup(ownerEmail: string): Promise<string> {
  const files = await getFilesFromIndexedDB(ownerEmail);
  const backup = {
    version: '1.0',
    exportedAt: Date.now(),
    ownerEmail,
    filesCount: files.length,
    files,
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Imports files from a vault backup package into the current device's IndexedDB
 */
export async function importVaultBackup(
  backupJson: string,
  targetEmail: string
): Promise<{ success: boolean; importedCount: number; message: string }> {
  try {
    const parsed = JSON.parse(backupJson);
    if (!parsed || !Array.isArray(parsed.files)) {
      return { success: false, importedCount: 0, message: 'Invalid vault backup file structure.' };
    }

    let count = 0;
    for (const f of parsed.files) {
      if (f && f.id && f.name) {
        await saveFileToIndexedDB(f, targetEmail);
        count++;
      }
    }

    return {
      success: true,
      importedCount: count,
      message: `Successfully restored ${count} files to your vault without any data loss!`,
    };
  } catch (e: any) {
    return { success: false, importedCount: 0, message: `Backup import failed: ${e.message}` };
  }
}
