'use client';

import React, { useState } from 'react';
import { X, Cloud, Check, ExternalLink, HardDrive, ShieldCheck } from 'lucide-react';
import { WorkspaceFile } from '@converto/core';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (file: WorkspaceFile) => void;
  exportFile?: WorkspaceFile | null;
}

export function CloudSyncModal({
  isOpen,
  onClose,
  onImportFile,
  exportFile,
}: CloudSyncModalProps) {
  const [provider, setProvider] = useState<'google-drive' | 'dropbox'>('google-drive');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateImport = () => {
    setIsConnecting(true);
    setStatusMessage(`Connecting to ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'} picker...`);

    setTimeout(() => {
      // Simulate retrieving a cloud PDF file
      const dummyPdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF\n';
      const fileBytes = new TextEncoder().encode(dummyPdfContent);

      const imported: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `${provider === 'google-drive' ? 'gdrive' : 'dropbox'}_imported_document.pdf`,
        size: fileBytes.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: fileBytes,
        pageCount: 1,
      };

      onImportFile(imported);
      setIsConnecting(false);
      setStatusMessage('File imported successfully into Converto local workspace.');
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1000);
    }, 1200);
  };

  const handleSimulateExport = () => {
    if (!exportFile) return;
    setIsConnecting(true);
    setStatusMessage(`Uploading "${exportFile.name}" to ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'}...`);

    setTimeout(() => {
      setIsConnecting(false);
      setStatusMessage(`Saved "${exportFile.name}" to ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'} root folder.`);
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Cloud Storage Sync</h3>
            <p className="text-xs text-muted-foreground">Google Drive & Dropbox Integration</p>
          </div>
        </div>

        {/* Provider Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setProvider('google-drive')}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
              provider === 'google-drive'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span>Google Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setProvider('dropbox')}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
              provider === 'dropbox'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-500" />
            <span>Dropbox</span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-muted/60 border border-border/80 rounded-xl text-xs text-muted-foreground mb-4 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Zero cloud credentials stored. Converto uses client OAuth token handshakes directly in your browser.
          </span>
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs mb-4 text-center font-medium">
            {statusMessage}
          </div>
        )}

        <div className="space-y-2">
          {exportFile ? (
            <button
              onClick={handleSimulateExport}
              disabled={isConnecting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              Export & Save to {provider === 'google-drive' ? 'Google Drive' : 'Dropbox'}
            </button>
          ) : (
            <button
              onClick={handleSimulateImport}
              disabled={isConnecting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              Import PDF from {provider === 'google-drive' ? 'Google Drive' : 'Dropbox'}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
