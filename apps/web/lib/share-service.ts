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

// Safe chunked Base64 encoding that never overflows the JS call stack
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const CHUNK_SIZE = 8192;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

// Safe decoding from Base64 to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

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
          item.data = base64ToUint8Array(item.dataBase64);
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
        dataBase64: uint8ArrayToBase64(item.data),
      }));
      localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(arrayToSave));
    } catch {
      // Quota exceeded or private browsing restricted: in-memory copy persists
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
