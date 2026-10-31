'use client';

import React from 'react';
import { ShieldAlert, Server, Sparkles, Check, X, Clock, Trash2, Lock } from 'lucide-react';
import { ToolRuntime } from '@converto/tools';

interface UploadConsentModalProps {
  isOpen: boolean;
  toolTitle: string;
  runtime: ToolRuntime;
  onConsent: () => void;
  onCancel: () => void;
}

export function UploadConsentModal({
  isOpen,
  toolTitle,
  runtime,
  onConsent,
  onCancel,
}: UploadConsentModalProps) {
  if (!isOpen) return null;

  const isAi = runtime === 'ai';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            {isAi ? <Sparkles className="w-6 h-6 text-purple-600" /> : <Server className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAi ? 'AI Document Processing Notice' : 'Server Processing Notice'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tool: <span className="font-semibold text-slate-700 dark:text-slate-300">{toolTitle}</span>
            </p>
          </div>
        </div>

        {/* Content & Privacy Pledges */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            {isAi
              ? 'This tool uses AI models to analyze document text. Because API secrets cannot be safely kept in your browser, your document text will be sent securely to our server endpoint.'
              : 'This operation requires a server sandbox (e.g. high-fidelity Microsoft Office rendering). Your document will be processed in our isolated container.'}
          </p>

          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-white">Automatic 1-Hour Purge: </span>
                <span className="text-slate-500 dark:text-slate-400">Files and extraction logs are permanently deleted within 1 hour.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-white">No AI Model Training: </span>
                <span className="text-slate-500 dark:text-slate-400">Your documents are never used to train or fine-tune AI models.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-white">Zero File Logging: </span>
                <span className="text-slate-500 dark:text-slate-400">Document contents and filenames are never logged into server telemetry.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel (Keep Local)
          </button>
          <button
            type="button"
            onClick={onConsent}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>I Agree & Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
