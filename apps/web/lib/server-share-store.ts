export interface ServerShareRecord {
  id: string;
  filename: string;
  fileSizeBytes: number;
  dataBase64: string;
  isViewOnly: boolean;
  passwordHash?: string;
  maxDownloads?: number;
  downloadCount: number;
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
}

// Global server memory store with TTL purge (backed in production by Redis / S3)
const globalServerShares = new Map<string, ServerShareRecord>();

export function purgeExpiredShares() {
  const now = Date.now();
  for (const [id, record] of globalServerShares.entries()) {
    if (record.revoked || now > record.expiresAt) {
      globalServerShares.delete(id);
    }
  }
}

export function saveServerShare(record: ServerShareRecord) {
  purgeExpiredShares();
  globalServerShares.set(record.id, record);
}

export function getServerShare(id: string): ServerShareRecord | null {
  purgeExpiredShares();
  const record = globalServerShares.get(id);
  if (!record || record.revoked || Date.now() > record.expiresAt) {
    return null;
  }
  return record;
}

export function recordServerShareDownload(id: string): boolean {
  const record = getServerShare(id);
  if (!record) return false;
  if (record.maxDownloads && record.downloadCount >= record.maxDownloads) return false;
  record.downloadCount += 1;
  return true;
}

export function revokeServerShare(id: string): boolean {
  const record = globalServerShares.get(id);
  if (record) {
    record.revoked = true;
    return true;
  }
  return false;
}
