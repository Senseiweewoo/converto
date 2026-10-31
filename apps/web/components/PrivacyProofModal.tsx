'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Activity, Lock, CheckCircle2 } from 'lucide-react';
import { privacyProofTracker, NetworkAuditLog } from '../lib/privacy-proof';

interface PrivacyProofModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyProofModal({ isOpen, onClose }: PrivacyProofModalProps) {
  const [logs, setLogs] = useState<NetworkAuditLog[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    privacyProofTracker.init();
    setLogs(privacyProofTracker.getLogs());
    const unsub = privacyProofTracker.subscribe(() => {
      setLogs(privacyProofTracker.getLogs());
    });
    return () => {
      unsub();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBytes = privacyProofTracker.getTotalBytesUploaded();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Live Privacy Proof
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited network activity for this browser session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Proof Summary Banner */}
        <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-300">
                Total File Uploads
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {totalBytes === 0 ? '0 bytes uploaded' : `${(totalBytes / 1024).toFixed(1)} KB`}
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              100% In-Browser Execution
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-900/80 dark:text-emerald-300/80">
            All PDF operations run purely inside Web Workers on your device. We do not track, inspect, or retain your documents.
          </p>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Network Requests Recorded
          </h4>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-500" />
              Zero network requests made so far. All local processing is isolated.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono uppercase font-bold text-slate-600 dark:text-slate-300">
                      {log.method}
                    </span>
                    <span className="truncate text-slate-700 dark:text-slate-300 font-mono">
                      {log.url}
                    </span>
                  </div>
                  <div className="text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-medium">
                    {log.bytesUploaded} bytes sent
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-xl transition"
          >
            Close Privacy Proof
          </button>
        </div>
      </div>
    </div>
  );
}
