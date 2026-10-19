import { Project } from '../types';

const DB_NAME = 'WhiteboardAnimatorDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        objectStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
      }
    };
  });
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = (request.result || []) as Project[];
      // Sort by modifiedAt desc
      list.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getProject(id: number): Promise<Project | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectToDB(project: Partial<Project>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const now = new Date().toISOString();

    const dataToSave: any = {
      ...project,
      modifiedAt: now,
      createdAt: project.createdAt || now,
    };

    if (dataToSave.id == null || dataToSave.id === undefined) {
      delete dataToSave.id;
    }

    const request = (typeof project.id === 'number' && project.id > 0)
      ? store.put(dataToSave)
      : store.add(dataToSave);

    request.onsuccess = () => resolve(Number(request.result));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProjectFromDB(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getEstimatedStorageUsage(): Promise<string> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      if (used < 1024) return `${used} B`;
      if (used < 1024 * 1024) return `${(used / 1024).toFixed(1)} KB`;
      return `${(used / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return 'Storage available';
    }
  }
  return 'Local Storage';
}
