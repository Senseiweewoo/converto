'use client';

import React from 'react';
import Link from 'next/link';
import { Download, CheckCircle, ArrowRight, Share2, FileText, Clock, HardDrive, RefreshCw } from 'lucide-react';
import { ToolResult, WorkspaceFile } from '@converto/core';

interface ResultSummaryProps {
  result: ToolResult;
  onReset: () => void;
  onContinueWithTool?: (toolSlug: string, file: WorkspaceFile) => void;
}

export function ResultSummary({ result, onReset }: ResultSummaryProps) {
  const primaryFile = result.files[0];

  const handleDownload = (file: WorkspaceFile) => {
    const blob = new Blob([file.data as any], { type: file.type || 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    result.files.forEach((file) => handleDownload(file));
  };

  const originalMb = result.metrics ? (result.metrics.originalSize / (1024 * 1024)).toFixed(2) : null;
  const finalMb = result.metrics ? (result.metrics.finalSize / (1024 * 1024)).toFixed(2) : null;
  const durationSec = result.metrics ? (result.metrics.durationMs / 1000).toFixed(2) : null;

  return (
    <div className="w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in">
      {/* Top success badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Task Complete
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Metrics breakdown */}
      {result.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" /> Size
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-white">
              {finalMb} MB
            </div>
            {originalMb && (
              <div className="text-[11px] text-slate-400">
                from {originalMb} MB
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-500" /> Pages
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-white">
              {result.metrics.pageCount}
            </div>
            <div className="text-[11px] text-slate-400">
              {result.files.length} output file{result.files.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Processing Time
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-white">
              {durationSec}s
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              100% In-Browser
            </div>
          </div>
        </div>
      )}

      {/* Output Files Download Section */}
      <div className="space-y-3 mb-6">
        {result.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {file.name}
                </div>
                <div className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDownload(file)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        ))}
      </div>

      {result.files.length > 1 && (
        <div className="mb-6">
          <button
            onClick={handleDownloadAll}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download All ({result.files.length} Files)</span>
          </button>
        </div>
      )}

      {/* Suggested Tool Chaining Chips */}
      {result.suggestedNext && result.suggestedNext.length > 0 && (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Continue with another tool
          </div>
          <div className="flex flex-wrap gap-2">
            {result.suggestedNext.map((nextSlug) => (
              <Link
                key={nextSlug}
                href={`/tools/${nextSlug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              >
                <span>{nextSlug.replace('-', ' ').toUpperCase()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reset / New File action */}
      <div className="mt-8 pt-4 flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Process another file</span>
        </button>
        <span>Files automatically clear when you close this tab</span>
      </div>
    </div>
  );
}
