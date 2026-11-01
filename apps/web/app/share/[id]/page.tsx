'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { shareService, ShareLinkRecord, base64ToUint8Array } from '@/lib/share-service';
import { ShieldCheck, Lock, Download, Eye, AlertCircle, Clock, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ShareRecipientPage() {
  const params = useParams();
  const shareId = params?.id as string;

  const [record, setRecord] = useState<ShareLinkRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  const [isServerShare, setIsServerShare] = useState(false);

  useEffect(() => {
    if (!shareId) return;

    // 1. Try local storage first
    const item = shareService.getShareLink(shareId);
    if (item) {
      setRecord(item);
      setIsServerShare(false);
      if (!item.password) {
        setIsUnlocked(true);
        const blob = new Blob([item.data.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
      setLoading(false);
      return;
    }

    // 2. Fall back to server endpoint for cross-device sharing
    fetch(`/api/v1/share/${shareId}`)
      .then(async (res) => {
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setIsServerShare(true);

        if (data.requiresPassword) {
          setRecord({
            id: data.id,
            filename: data.filename,
            fileSizeBytes: data.fileSizeBytes || 0,
            data: new Uint8Array(),
            isViewOnly: !!data.isViewOnly,
            password: '***',
            createdAt: Date.now(),
            expiresAt: data.expiresAt || 0,
            downloadCount: 0,
            revoked: false,
          });
        } else if (data.dataBase64) {
          const bytes = base64ToUint8Array(data.dataBase64);
          setRecord({
            id: data.id,
            filename: data.filename,
            fileSizeBytes: bytes.byteLength,
            data: bytes,
            isViewOnly: !!data.isViewOnly,
            createdAt: Date.now(),
            expiresAt: data.expiresAt || 0,
            downloadCount: data.downloadCount || 0,
            maxDownloads: data.maxDownloads,
            revoked: false,
          });
          setIsUnlocked(true);
          const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [shareId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    if (!isServerShare) {
      if (passwordInput === record.password) {
        setIsUnlocked(true);
        setPasswordError('');
        const blob = new Blob([record.data.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
      return;
    }

    // Server-side password verification
    try {
      const res = await fetch(`/api/v1/share/${record.id}?pwd=${encodeURIComponent(passwordInput)}`);
      if (!res.ok) {
        setPasswordError('Incorrect password. Please try again.');
        return;
      }
      const data = await res.json();
      if (data.dataBase64) {
        const bytes = base64ToUint8Array(data.dataBase64);
        setRecord((prev) => prev ? { ...prev, data: bytes } : null);
        setIsUnlocked(true);
        setPasswordError('');
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Error verifying password.');
    }
  };

  const handleDownload = async () => {
    if (!record || record.isViewOnly) return;

    if (!isServerShare) {
      const success = shareService.recordDownload(record.id);
      if (!success) {
        alert('Download limit has been reached or link is no longer valid.');
        return;
      }

      const blob = new Blob([record.data.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Refresh record
      const updated = shareService.getShareLink(record.id);
      setRecord(updated);
      return;
    }

    // Server share download
    try {
      const res = await fetch(`/api/v1/share/${record.id}?download=1&pwd=${encodeURIComponent(passwordInput)}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Download limit reached.');
        return;
      }

      const blob = new Blob([record.data.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setRecord((prev) => prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null);
    } catch {
      alert('Failed to download document.');
    }
  };

  const handleRevoke = async () => {
    if (!record) return;
    if (confirm('Are you sure you want to revoke this link? Anyone with this URL will immediately lose access.')) {
      if (!isServerShare) {
        shareService.revokeShareLink(record.id);
      } else {
        await fetch(`/api/v1/share/${record.id}`, { method: 'DELETE' }).catch(() => {});
      }
      setRecord(null);
      setRevokedMessage('This share link has been revoked and the file data deleted.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (revokedMessage) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-card border border-border rounded-2xl shadow-sm text-center">
        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Link Revoked</h2>
        <p className="text-sm text-muted-foreground mb-6">{revokedMessage}</p>
        <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-card border border-border rounded-2xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Link Expired or Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This secure share link does not exist, has expired, or reached its maximum download limit.
        </p>
        <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium inline-block">
          Go to Converto Home
        </Link>
      </div>
    );
  }

  const remainingHours = Math.max(0, Math.round((record.expiresAt - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Converto
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Secure Document Share
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            End-to-end client tokenized transmission &bull; Document: <span className="font-medium text-foreground">{record.filename}</span> ({(record.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {record.isViewOnly ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 text-xs font-medium rounded-full border border-amber-500/20">
              <Eye className="w-3.5 h-3.5" /> View Only
            </span>
          ) : (
            <button
              onClick={handleDownload}
              disabled={!isUnlocked}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          )}

          <button
            onClick={handleRevoke}
            title="Revoke access"
            className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security info banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-xs">
          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="text-muted-foreground">Expires In</div>
            <div className="font-semibold">{remainingHours} hours</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-xs">
          <Download className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="text-muted-foreground">Downloads</div>
            <div className="font-semibold">
              {record.downloadCount} {record.maxDownloads ? `/ ${record.maxDownloads} max` : 'unlimited'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="text-muted-foreground">Privacy Protection</div>
            <div className="font-semibold text-emerald-600">Encrypted in Transit</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!isUnlocked ? (
        <div className="max-w-md mx-auto my-12 p-8 bg-card border border-border rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Password Protected</h2>
          <p className="text-xs text-muted-foreground mb-6">
            The sender has protected this document. Enter the password below to decrypt and view.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-500 mt-1.5 text-left">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              Unlock Document
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm overflow-hidden">
          {previewUrl && (
            <div className="w-full h-[650px] rounded-xl overflow-hidden border border-border/60 bg-muted/20">
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full border-0"
                title={record.filename}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
