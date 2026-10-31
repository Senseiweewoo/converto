'use client';

import { WorkspaceFile } from '@converto/core';

export interface WorkspaceHistoryEntry {
  id: string;
  timestamp: number;
  toolId: string;
  toolTitle: string;
  summary: string;
  inputIds: string[];
  outputIds: string[];
}

const DB_NAME = 'converto_workspace_db';
const DB_VERSION = 1;
const STORE_FILES = 'files';
const STORE_HISTORY = 'history';

class WorkspaceDB {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallbackFiles: Map<string, WorkspaceFile> = new Map();
  private memoryFallbackHistory: WorkspaceHistoryEntry[] = [];

  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not supported in this environment.');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_FILES)) {
            db.createObjectStore(STORE_FILES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_HISTORY)) {
            db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return this.dbPromise;
  }

  public async saveFile(file: WorkspaceFile): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readwrite');
        const store = tx.objectStore(STORE_FILES);
        const req = store.put(file);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallbackFiles.set(file.id, file);
    }
  }

  public async saveFiles(files: WorkspaceFile[]): Promise<void> {
    for (const f of files) {
      await this.saveFile(f);
    }
  }

  public async getFile(id: string): Promise<WorkspaceFile | undefined> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readonly');
        const store = tx.objectStore(STORE_FILES);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallbackFiles.get(id);
    }
  }

  public async getAllFiles(): Promise<WorkspaceFile[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readonly');
        const store = tx.objectStore(STORE_FILES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(this.memoryFallbackFiles.values());
    }
  }

  public async deleteFile(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FILES, 'readwrite');
        const store = tx.objectStore(STORE_FILES);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallbackFiles.delete(id);
    }
  }

  public async addHistory(entry: WorkspaceHistoryEntry): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_HISTORY, 'readwrite');
        const store = tx.objectStore(STORE_HISTORY);
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallbackHistory.push(entry);
    }
  }

  public async getHistory(): Promise<WorkspaceHistoryEntry[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_HISTORY, 'readonly');
        const store = tx.objectStore(STORE_HISTORY);
        const req = store.getAll();
        req.onsuccess = () => {
          const res: WorkspaceHistoryEntry[] = req.result || [];
          res.sort((a, b) => b.timestamp - a.timestamp); // latest first
          resolve(res);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [...this.memoryFallbackHistory].reverse();
    }
  }

  public async clearAllData(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_FILES, STORE_HISTORY], 'readwrite');
        tx.objectStore(STORE_FILES).clear();
        tx.objectStore(STORE_HISTORY).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      this.memoryFallbackFiles.clear();
      this.memoryFallbackHistory = [];
    }
  }
}

export const workspaceDb = new WorkspaceDB();
