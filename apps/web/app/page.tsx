'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Combine,
  Scissors,
  LayoutGrid,
  Minimize2,
  FileImage,
  Image as ImageIcon,
  RotateCw,
  Hash,
  Stamp,
  Lock,
  Unlock,
  Wand2,
  PenTool,
  EyeOff,
  FileSearch,
  Bot,
  FileSpreadsheet,
  ShieldCheck,
  Cpu,
  Zap,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react';
import { CONVERTO_TOOLS, ToolCategory } from '@converto/tools';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { DropZone } from '@/components/DropZone';
import { useRouter } from 'next/navigation';

const CATEGORY_TITLES: Record<ToolCategory, string> = {
  organize: 'Organize PDF',
  optimize: 'Optimize & Repair',
  'convert-to': 'Convert to PDF',
  'convert-from': 'Convert from PDF',
  edit: 'Edit & Annotate',
  security: 'Security & Signatures',
  intelligence: 'Document Intelligence & AI',
};

const ICON_MAP: Record<string, React.ElementType> = {
  Combine,
  Scissors,
  LayoutGrid,
  Minimize2,
  FileImage,
  Image: ImageIcon,
  RotateCw,
  Hash,
  Stamp,
  Lock,
  Unlock,
  Wand2,
  PenTool,
  EyeOff,
  FileSearch,
  Bot,
  FileSpreadsheet,
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return CONVERTO_TOOLS;
    const q = searchQuery.toLowerCase();
    return CONVERTO_TOOLS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set<ToolCategory>();
    filteredTools.forEach((t) => cats.add(t.category));
    return Array.from(cats);
  }, [filteredTools]);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-12 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Zero Server Uploads for Local Tools • 100% Free</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Convert, edit and fix any PDF,{' '}
          <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-300 dark:decoration-emerald-700 decoration-wavy decoration-2">
            privately.
          </span>
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
          The all-in-one PDF toolkit that runs entirely in your browser. Complete any everyday PDF task in under 30 seconds with no signup, limits, or watermarks.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What do you want to do with your PDF? (e.g. merge, compress, protect...)"
            className="w-full pl-12 pr-4 py-4 rounded-2xl text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </section>

      {/* Smart Fix Dropzone Front & Center */}
      {!searchQuery && (
        <section className="max-w-4xl mx-auto px-4">
          <div className="p-1 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 shadow-xl">
            <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[22px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Smart Fix
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                        New
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Not sure what you need? Drop your file for an instant browser health scan
                    </p>
                  </div>
                </div>
                <PrivacyBadge runtime="local" />
              </div>

              <DropZone
                accept={['application/pdf']}
                minFiles={1}
                maxFiles={1}
                onFilesSelected={(files) => {
                  if (files.length > 0) {
                    router.push('/tools/compress-pdf');
                  }
                }}
                title="Drop one PDF here for instant Smart Fix"
                description="We'll analyze rotation, blank pages, corruption, and compression on your device"
              />
            </div>
          </div>
        </section>
      )}

      {/* Categorized Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {categories.map((category) => {
          const categoryTools = filteredTools.filter((t) => t.category === category);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {CATEGORY_TITLES[category]}
                </h3>
                <span className="text-xs text-slate-400">
                  {categoryTools.length} tools
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryTools.map((tool) => {
                  const IconComp = ICON_MAP[tool.iconName] || FileImage;
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 dark:bg-slate-800 dark:group-hover:bg-emerald-950/80 flex items-center justify-center text-slate-700 group-hover:text-emerald-600 dark:text-slate-300 dark:group-hover:text-emerald-400 transition-colors">
                            <IconComp className="w-5 h-5" />
                          </div>
                          <PrivacyBadge runtime={tool.runtime} />
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {tool.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {tool.tagline}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <span>Open Tool</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Privacy Promise Banner */}
      <section id="privacy" className="max-w-5xl mx-auto px-4 pt-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>The Converto Privacy Pledge</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Your files never leave your device by default.
            </h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Unlike legacy PDF sites that silently upload your confidential contracts and IDs to unknown servers, Converto compiles WebAssembly and pure TypeScript in Web Workers right on your device.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero server logs or telemetry of document bytes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>No account required, no file size tricks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Auditable live network proof in every session</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>1-hour auto-purge for any opt-in cloud feature</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflows & Batch Preview */}
      <section id="workflows" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-3">
                Phase B Delivered
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Batch & Folder Processing
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Drag in 100+ files or entire folders. Bounded concurrency protects your device memory, and results download as a single ZIP archive.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/batch"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition"
              >
                <span>Open Batch Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 mb-3">
                In-Memory Chaining
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Seamless Tool Chaining & History
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Send results directly into the next tool (Unlock → Merge → Compress → Sign) with zero re-downloading. Includes timeline audit and full undo/redo.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Ctrl+Z / Ctrl+Y</span>
              <span>Supported across all tools</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
