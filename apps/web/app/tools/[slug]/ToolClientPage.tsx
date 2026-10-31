'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Play, RefreshCw, FileText, CheckCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { getToolBySlug } from '@converto/tools';
import { WorkspaceFile, ToolResult, OrganizePageItem, safeLoadPdf } from '@converto/core';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { DropZone } from '@/components/DropZone';
import { FileCard } from '@/components/FileCard';
import { ToolSettings } from '@/components/ToolSettings';
import { OrganizeGrid } from '@/components/OrganizeGrid';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultSummary } from '@/components/ResultSummary';
import { ErrorPanel } from '@/components/ErrorPanel';
import { executeTool } from '@/lib/worker-client';

export function ToolClientPage({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [settings, setSettings] = useState<any>(tool.defaultSettings);
  const [organizePages, setOrganizePages] = useState<OrganizePageItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('');
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // When files are selected
  const handleFilesSelected = async (newFiles: WorkspaceFile[]) => {
    setError(null);
    setResult(null);

    // Initialize organize pages if tool is organize-pdf
    if (tool.id === 'organize-pdf' && newFiles.length > 0) {
      try {
        const doc = await safeLoadPdf(newFiles[0].data);
        const count = doc.getPageCount();
        const initialPages: OrganizePageItem[] = [];
        for (let i = 0; i < count; i++) {
          initialPages.push({
            id: Math.random().toString(36).substring(2, 9),
            sourcePageIndex: i,
            rotation: 0,
          });
        }
        setOrganizePages(initialPages);
      } catch (err: any) {
        setError(err);
      }
    }

    if (tool.inputs.max === 1) {
      setFiles([newFiles[0]]);
    } else {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setResult(null);
      setError(null);
    }
  };

  const handleRun = async () => {
    if (files.length === 0) return;

    setError(null);
    setIsRunning(true);
    setProgress(0);
    setStepText('Initializing local worker...');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const activeSettings =
        tool.id === 'organize-pdf' ? { pages: organizePages } : settings;

      const toolResult = await executeTool(tool.id, files, activeSettings, {
        signal: controller.signal,
        onProgress: (pct, step) => {
          setProgress(pct);
          if (step) setStepText(step);
        },
      });

      setResult(toolResult);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setError(new Error('Operation cancelled by user.'));
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const canRun = files.length >= tool.inputs.min && !isRunning;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>
      </div>

      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {tool.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {tool.tagline}
          </p>
        </div>
        <div>
          <PrivacyBadge runtime={tool.runtime} />
        </div>
      </div>

      {/* Main Interactive Workspace Area */}
      {!result ? (
        <div className="space-y-6">
          {files.length === 0 ? (
            <DropZone
              accept={tool.inputs.accept}
              minFiles={tool.inputs.min}
              maxFiles={tool.inputs.max}
              onFilesSelected={handleFilesSelected}
              title={`Drop ${tool.inputs.accept.includes('application/pdf') ? 'PDF' : 'image'} files here`}
              description={`Processed 100% locally on your browser. Zero bytes uploaded.`}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* File list / Visual layout */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Selected File{files.length > 1 ? 's' : ''} ({files.length})
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-xs text-rose-500 hover:text-rose-600 transition"
                  >
                    Clear All
                  </button>
                </div>

                {tool.id === 'organize-pdf' ? (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <OrganizeGrid
                      pages={organizePages}
                      onChange={setOrganizePages}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        index={files.length > 1 ? idx : undefined}
                        onRemove={() => handleRemoveFile(idx)}
                        canReorder={files.length > 1}
                      />
                    ))}

                    {files.length < tool.inputs.max && (
                      <div className="pt-2">
                        <DropZone
                          accept={tool.inputs.accept}
                          minFiles={1}
                          maxFiles={tool.inputs.max - files.length}
                          onFilesSelected={handleFilesSelected}
                          title="Add more files"
                          description="Combine additional documents"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Settings and Action Panel */}
              <div className="space-y-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                    Tool Options
                  </h3>

                  <ToolSettings
                    toolId={tool.id}
                    settings={settings}
                    onChange={setSettings}
                  />

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={!canRun}
                      onClick={handleRun}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 ${
                        canRun
                          ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                          : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{tool.title}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Runs entirely inside your browser sandbox.</span>
                </div>
              </div>
            </div>
          )}

          {/* Running Progress Bar */}
          {isRunning && (
            <div className="mt-6">
              <ProgressBar
                progress={progress}
                stepText={stepText}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Error Panel */}
          {error && (
            <div className="mt-6">
              <ErrorPanel
                error={error}
                onRetry={handleRun}
                onPasswordSubmit={(pwd) => {
                  setSettings((prev: any) => ({ ...prev, password: pwd }));
                  handleRun();
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* Result Summary Screen */
        <ResultSummary
          result={result}
          onReset={handleReset}
        />
      )}

      {/* Below the Fold: How-To Steps and FAQ */}
      <section className="pt-12 border-t border-slate-200 dark:border-slate-800 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            How to use {tool.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center mb-2">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Select your files
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Drag and drop your document directly into the tool. Files are loaded securely into browser memory.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center mb-2">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Customize Settings
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose options such as compression level, page ranges, or rotation angles according to your needs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center mb-2">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Download Instantly
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Download your processed PDF with one click or continue chaining directly into another tool.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Is my document uploaded to a server?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No. This tool operates 100% on your device using Web Workers. You can verify this by checking the live Privacy Proof audit panel in the navigation header.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Are there any file size or usage limits?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No artificial caps, watermarks, or forced registrations exist. Processing capability is limited only by your browser’s available memory.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
