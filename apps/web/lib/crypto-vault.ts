'use client';

export interface UserProfileData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  signatureBase64?: string; // PNG data URL
  initialsBase64?: string;
  lastUpdated: number;
}

export interface EncryptedVault {
  saltBase64: string;
  ivBase64: string;
  cipherTextBase64: string;
}

const VAULT_STORAGE_KEY = 'converto_user_vault';

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

import { uint8ArrayToBase64, base64ToUint8Array } from './share-service';

export async function encryptProfile(
  passphrase: string,
  profile: UserProfileData
): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const payload = new TextEncoder().encode(JSON.stringify(profile));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    payload
  );

  return {
    saltBase64: uint8ArrayToBase64(salt),
    ivBase64: uint8ArrayToBase64(iv),
    cipherTextBase64: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
  };
}

export async function decryptProfile(
  passphrase: string,
  vault: EncryptedVault
): Promise<UserProfileData> {
  const salt = base64ToUint8Array(vault.saltBase64);
  const iv = base64ToUint8Array(vault.ivBase64);
  const cipherBytes = base64ToUint8Array(vault.cipherTextBase64);

  const key = await deriveKey(passphrase, salt as unknown as Uint8Array);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      cipherBytes as unknown as BufferSource
    );
    const jsonStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('Incorrect passphrase or corrupted encrypted profile.');
  }
}

export function saveVaultToStorage(vault: EncryptedVault): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
  }
}

export function loadVaultFromStorage(): EncryptedVault | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearVaultFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VAULT_STORAGE_KEY);
  }
}
