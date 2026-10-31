'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderArchive,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Archive,
  FileText,
  Loader2,
  Trash2,
  Layers,
} from 'lucide-react';
import { WorkspaceFile, ToolResult } from '@converto/core';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { executeTool } from '@/lib/worker-client';
import { createZipArchive, downloadZip } from '@/lib/zip-export';
import { WorkspaceBar } from '@/components/WorkspaceBar';

interface BatchItem {
  id: string;
  file: WorkspaceFile;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  result?: ToolResult;
  error?: string;
}

export default function BatchProcessingPage() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<'compress-pdf' | 'rotate-pdf' | 'watermark-pdf' | 'page-numbers'>('compress-pdf');
  const [operationSettings, setOperationSettings] = useState<any>({
    preset: 'basic',
    removeMetadata: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelRef = useRef(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const raw = Array.from(fileList);
    const newItems: BatchItem[] = [];

    for (const f of raw) {
      if (!f.name.toLowerCase().endsWith('.pdf') && !f.type.includes('pdf')) {
        continue;
      }
      const buffer = await f.arrayBuffer();
      const workspaceFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: f.name,
        size: f.size,
        type: 'application/pdf',
        lastModified: f.lastModified,
        data: new Uint8Array(buffer),
      };

      newItems.push({
        id: workspaceFile.id,
        file: workspaceFile,
        status: 'pending',
        progress: 0,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleProcessQueue = async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setIsCancelled(false);
    cancelRef.current = false;

    // Concurrency limit of 2 to preserve tab memory under 1.5 GB
    const queue = [...items];
    const CONCURRENCY = 2;
    let activeWorkers = 0;
    let index = 0;

    const runWorker = async (): Promise<void> => {
      while (index < queue.length && !cancelRef.current) {
        const itemIdx = index++;
        const currentItem = queue[itemIdx];

        if (currentItem.status === 'done') continue;

        // Mark as processing
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === itemIdx ? { ...it, status: 'processing', progress: 0.1 } : it
          )
        );

        try {
          const controller = new AbortController();
          const res = await executeTool(
            selectedOperation,
            [currentItem.file],
            operationSettings,
            {
              signal: controller.signal,
              onProgress: (pct) => {
                setItems((prev) =>
                  prev.map((it, idx) =>
                    idx === itemIdx ? { ...it, progress: pct } : it
                  )
                );
              },
            }
          );

          setItems((prev) =>
            prev.map((it, idx) =>
              idx === itemIdx
                ? { ...it, status: 'done', progress: 1.0, result: res }
                : it
            )
          );
        } catch (err: any) {
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === itemIdx
                ? {
                    ...it,
                    status: 'error',
                    progress: 0,
                    error: err.message || 'Operation failed',
                  }
                : it
            )
          );
        }
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () =>
      runWorker()
    );

    await Promise.all(workers);
    setIsProcessing(false);
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsCancelled(true);
    setIsProcessing(false);
  };

  const handleDownloadAllZip = () => {
    const completedItems = items.filter((it) => it.status === 'done' && it.result);
    if (completedItems.length === 0) return;

    const entries = completedItems.flatMap((it) =>
      it.result!.files.map((f) => ({
        name: f.name,
        data: f.data,
      }))
    );

    const zipBytes = createZipArchive(entries);
    downloadZip(zipBytes, `converto_batch_${selectedOperation}.zip`);
  };

  const completedCount = items.filter((it) => it.status === 'done').length;
  const errorCount = items.filter((it) => it.status === 'error').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Batch & Folder Processing Studio
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
              Phase B
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Process 100+ documents concurrently with safe memory management and ZIP export.
          </p>
        </div>
        <PrivacyBadge runtime="local" />
      </div>

      {/* Batch Controls & Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue Configuration */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              Batch Operation
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Tool
              </label>
              <select
                value={selectedOperation}
                onChange={(e) => {
                  const op = e.target.value as any;
                  setSelectedOperation(op);
                  if (op === 'compress-pdf') {
                    setOperationSettings({ preset: 'basic', removeMetadata: true });
                  } else if (op === 'rotate-pdf') {
                    setOperationSettings({ angle: 90, pages: 'all' });
                  } else if (op === 'page-numbers') {
                    setOperationSettings({ position: 'bottom-center', format: 'page-of-total' });
                  } else if (op === 'watermark-pdf') {
                    setOperationSettings({ type: 'text', text: 'CONFIDENTIAL', opacity: 0.2, rotation: 45 });
                  }
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                <option value="compress-pdf">Compress PDF</option>
                <option value="rotate-pdf">Rotate PDF (90°)</option>
                <option value="page-numbers">Add Page Numbers</option>
                <option value="watermark-pdf">Stamp Watermark</option>
              </select>
            </div>

            {selectedOperation === 'compress-pdf' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Preset
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['basic', 'strong', 'extreme'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOperationSettings({ ...operationSettings, preset: p })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize border transition ${
                        operationSettings.preset === p
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                disabled={items.length === 0 || isProcessing}
                onClick={handleProcessQueue}
                className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 ${
                  items.length > 0 && !isProcessing
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Queue...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Batch Run ({items.length} Files)</span>
                  </>
                )}
              </button>

              {isProcessing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  Stop / Cancel Run
                </button>
              )}

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 shadow-md transition flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download ZIP ({completedCount} Results)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: File Queue List & Dropzone */}
        <div className="lg:col-span-2 space-y-4">
          {/* File Picker & Folder Picker Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
              >
                + Add PDF Files
              </button>

              {/* Folder Upload via webkitdirectory */}
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                // @ts-ignore
                directory="true"
                multiple
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Upload Entire Folder</span>
              </button>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-xs text-rose-500 hover:text-rose-600 transition"
              >
                Clear Queue
              </button>
            )}
          </div>

          {/* Queue Statistics Card */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total in Queue</div>
                <div className="text-lg font-black text-slate-800 dark:text-white">{items.length}</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Completed</div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">{completedCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 text-center">
                <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">Errors</div>
                <div className="text-lg font-black text-rose-700 dark:text-rose-400">{errorCount}</div>
              </div>
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center cursor-pointer hover:border-emerald-500 transition"
            >
              <Layers className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <div className="text-base font-bold text-slate-700 dark:text-slate-200">
                Queue is empty
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Drag in 100+ PDFs or an entire folder to begin batch processing.
              </p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                        {item.file.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.status === 'pending' && (
                      <span className="text-[11px] font-medium text-slate-400">Pending</span>
                    )}

                    {item.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                        <span className="text-[11px] font-mono text-emerald-600">
                          {Math.round(item.progress * 100)}%
                        </span>
                      </div>
                    )}

                    {item.status === 'done' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    )}

                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500" title={item.error}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WorkspaceBar />
    </div>
  );
}
