'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Archive,
  Loader2,
  Sparkles,
  Settings,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  WorkflowDefinition,
  WorkflowStep,
  WORKFLOW_TEMPLATES,
  executeWorkflowPipeline,
  WorkspaceFile,
} from '@converto/core';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { createZipArchive, downloadZip } from '@/lib/zip-export';
import { WorkspaceBar } from '@/components/WorkspaceBar';

const AVAILABLE_TOOLS = [
  { id: 'rotate-pdf', title: 'Rotate PDF', defaultSettings: { angle: 90, pages: 'all' } },
  { id: 'compress-pdf', title: 'Compress PDF', defaultSettings: { preset: 'strong', removeMetadata: true } },
  { id: 'page-numbers', title: 'Page Numbers', defaultSettings: { position: 'bottom-right', format: 'slash', pages: 'all' } },
  { id: 'watermark-pdf', title: 'Watermark PDF', defaultSettings: { type: 'text', text: 'CONFIDENTIAL', opacity: 0.2, rotation: 45 } },
  { id: 'merge-pdf', title: 'Merge All Input Files', defaultSettings: {} },
];

export default function WorkflowsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition>(WORKFLOW_TEMPLATES[0]);
  const [inputFiles, setInputFiles] = useState<WorkspaceFile[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [outputFiles, setOutputFiles] = useState<WorkspaceFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTemplate = (template: WorkflowDefinition) => {
    setSelectedWorkflow({
      ...template,
      steps: template.steps.map((s) => ({ ...s })),
    });
    setOutputFiles([]);
    setStepLogs([]);
  };

  const handleAddStep = (toolId: string) => {
    const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
    if (!tool) return;

    const newStep: WorkflowStep = {
      id: Math.random().toString(36).substring(2, 9),
      toolId: tool.id,
      title: tool.title,
      settings: { ...tool.defaultSettings },
    };

    setSelectedWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const handleRemoveStep = (stepId: string) => {
    setSelectedWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
    }));
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const loaded: WorkspaceFile[] = [];

    for (const f of files) {
      const buffer = await f.arrayBuffer();
      loaded.push({
        id: Math.random().toString(36).substring(2, 9),
        name: f.name,
        size: f.size,
        type: 'application/pdf',
        lastModified: f.lastModified,
        data: new Uint8Array(buffer),
      });
    }

    setInputFiles(loaded);
    setOutputFiles([]);
  };

  const handleRunWorkflow = async () => {
    if (inputFiles.length === 0 || selectedWorkflow.steps.length === 0 || isRunning) return;

    setIsRunning(true);
    setProgressText('Starting custom pipeline execution...');
    setStepLogs([]);

    try {
      const res = await executeWorkflowPipeline(inputFiles, selectedWorkflow, {
        onProgress: (pct, msg) => {
          if (msg) setProgressText(msg);
        },
      });

      setOutputFiles(res.files);
      setStepLogs(res.stepLogs);
    } catch (err: any) {
      setStepLogs((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadZip = () => {
    if (outputFiles.length === 0) return;
    const entries = outputFiles.map((f) => ({ name: f.name, data: f.data }));
    const zipBytes = createZipArchive(entries);
    downloadZip(zipBytes, `${selectedWorkflow.id}_results.zip`);
  };

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
              Visual Workflow Pipeline Builder
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
              Phase C
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Chain multiple PDF operations into an automated, reusable pipeline running 100% locally on your device.
          </p>
        </div>
        <PrivacyBadge runtime="local" />
      </div>

      {/* Templates Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Ready-Made Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKFLOW_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                selectedWorkflow.id === tmpl.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{tmpl.name}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {tmpl.description}
              </p>
              <div className="mt-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {tmpl.steps.length} sequential steps
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Builder Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline Steps Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pipeline Steps ({selectedWorkflow.steps.length})
            </h3>

            {/* Add Step Dropdown */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddStep(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
            >
              <option value="" disabled>+ Add Step to Pipeline</option>
              {AVAILABLE_TOOLS.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.title}
                </option>
              ))}
            </select>
          </div>

          {/* Steps Ordered Cards */}
          <div className="space-y-3">
            {selectedWorkflow.steps.map((step, idx) => (
              <div
                key={step.id}
                className="relative flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      tool: {step.toolId}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveStep(step.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition"
                  title="Remove step"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Execution Logs */}
          {stepLogs.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs space-y-1.5">
              <div className="text-slate-400 uppercase tracking-wider text-[10px] font-bold pb-1 border-b border-slate-800">
                Pipeline Execution Audit Log
              </div>
              {stepLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Input Documents & Run Action */}
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Input Documents
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 dark:text-emerald-300 border border-dashed border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition text-center"
            >
              {inputFiles.length === 0
                ? '+ Select PDF(s) to Run Pipeline'
                : `${inputFiles.length} file(s) selected`}
            </button>

            {inputFiles.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {inputFiles.map((f) => (
                  <div key={f.id} className="text-xs text-slate-600 dark:text-slate-300 truncate flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                disabled={inputFiles.length === 0 || selectedWorkflow.steps.length === 0 || isRunning}
                onClick={handleRunWorkflow}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 ${
                  inputFiles.length > 0 && selectedWorkflow.steps.length > 0 && !isRunning
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                    : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60'
                }`}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Pipeline</span>
                  </>
                )}
              </button>

              {outputFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 transition flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download Finished ZIP ({outputFiles.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <WorkspaceBar />
    </div>
  );
}
