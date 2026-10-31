'use client';

export interface ShareLinkRecord {
  id: string;
  filename: string;
  fileSizeBytes: number;
  data: Uint8Array;
  isViewOnly: boolean;
  password?: string;
  maxDownloads?: number;
  downloadCount: number;
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
}

const SHARES_STORAGE_KEY = 'converto_share_links';

class ShareService {
  private inMemoryShares: Map<string, ShareLinkRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SHARES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const item of parsed) {
          // Re-hydrate byte array
          item.data = new Uint8Array(
            atob(item.dataBase64)
              .split('')
              .map((c: string) => c.charCodeAt(0))
          );
          this.inMemoryShares.set(item.id, item);
        }
      }
    } catch {
      // ignore
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      const arrayToSave = Array.from(this.inMemoryShares.values()).map((item) => ({
        ...item,
        dataBase64: btoa(String.fromCharCode(...item.data)),
      }));
      localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(arrayToSave));
    } catch {
      // ignore
    }
  }

  public createShareLink(params: {
    filename: string;
    data: Uint8Array;
    isViewOnly?: boolean;
    password?: string;
    expiryHours?: number;
    maxDownloads?: number;
  }): ShareLinkRecord {
    const id = (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)).replace(/-/g, '');
    const hours = params.expiryHours || 24;
    const expiresAt = Date.now() + hours * 60 * 60 * 1000;

    const record: ShareLinkRecord = {
      id,
      filename: params.filename,
      fileSizeBytes: params.data.length,
      data: params.data,
      isViewOnly: !!params.isViewOnly,
      password: params.password,
      maxDownloads: params.maxDownloads,
      downloadCount: 0,
      createdAt: Date.now(),
      expiresAt,
      revoked: false,
    };

    this.inMemoryShares.set(id, record);
    this.persist();
    return record;
  }

  public getShareLink(id: string): ShareLinkRecord | null {
    this.loadFromStorage();
    const item = this.inMemoryShares.get(id);
    if (!item) return null;

    if (item.revoked || Date.now() > item.expiresAt) {
      return null;
    }

    if (item.maxDownloads && item.downloadCount >= item.maxDownloads) {
      return null;
    }

    return item;
  }

  public recordDownload(id: string): boolean {
    const item = this.getShareLink(id);
    if (!item || item.isViewOnly) return false;

    item.downloadCount++;
    this.persist();
    return true;
  }

  public revokeShareLink(id: string): boolean {
    const item = this.inMemoryShares.get(id);
    if (!item) return false;

    item.revoked = true;
    this.inMemoryShares.delete(id);
    this.persist();
    return true;
  }
}

export const shareService = new ShareService();
