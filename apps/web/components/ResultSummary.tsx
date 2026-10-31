'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, CheckCircle, ArrowRight, Share2, FileText, Clock, HardDrive, RefreshCw, Archive, Volume2, Play, Pause, Square, BookOpen } from 'lucide-react';
import { ToolResult, WorkspaceFile } from '@converto/core';
import { createZipArchive, downloadZip } from '@/lib/zip-export';
import { workspaceManager } from '@/lib/workspace-store';

interface ResultSummaryProps {
  result: ToolResult;
  onReset: () => void;
  onContinueWithTool?: (toolSlug: string, file: WorkspaceFile) => void;
}

export function ResultSummary({ result, onReset }: ResultSummaryProps) {
  const router = useRouter();
  const primaryFile = result.files[0];

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isSpeechTool = result.summary.includes('Web Speech');
  const isBionicTool = result.summary.includes('Bionic');

  const handlePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Document read aloud via Converto Web Speech local synthesizer.');
    utterance.onend = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleStopAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  };

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

  const handleDownloadZip = () => {
    const entries = result.files.map((f) => ({
      name: f.name,
      data: f.data,
    }));
    const zipBytes = createZipArchive(entries);
    downloadZip(zipBytes, 'converto_results.zip');
  };

  const handleContinueTool = async (nextSlug: string) => {
    // Send files directly into workspace and route to the next tool
    await workspaceManager.setActiveFiles(result.files);
    router.push(`/tools/${nextSlug}`);
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

      {/* Interactive Web Speech Audio Player Widget */}
      {isSpeechTool && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-emerald-600 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-foreground">Local Text-to-Speech Player</div>
              <div className="text-[11px] text-muted-foreground">Synthesized via in-browser Web Speech API</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPlayingAudio ? (
              <button
                onClick={handlePlayAudio}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Play Aloud
              </button>
            ) : (
              <button
                onClick={handleStopAudio}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Square className="w-3.5 h-3.5 fill-white" /> Stop
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactive Bionic Reading Preview Widget */}
      {isBionicTool && (
        <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Bionic Reading Sample Visualization</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Con</strong>verto <strong className="text-foreground">is</strong> <strong className="text-foreground">a</strong> <strong className="text-foreground">pri</strong>vacy-<strong className="text-foreground">fir</strong>st, <strong className="text-foreground">lo</strong>cal-<strong className="text-foreground">fir</strong>st <strong className="text-foreground">doc</strong>ument <strong className="text-foreground">edi</strong>tor. <strong className="text-foreground">Bio</strong>nic <strong className="text-foreground">rea</strong>ding <strong className="text-foreground">gui</strong>des <strong className="text-foreground">yo</strong>ur <strong className="text-foreground">ey</strong>es <strong className="text-foreground">thr</strong>ough <strong className="text-foreground">art</strong>ificial <strong className="text-foreground">fix</strong>ation <strong className="text-foreground">poi</strong>nts, <strong className="text-foreground">dra</strong>stically <strong className="text-foreground">inc</strong>reasing <strong className="text-foreground">rea</strong>ding <strong className="text-foreground">spe</strong>ed <strong className="text-foreground">and</strong> <strong className="text-foreground">com</strong>prehension.
          </p>
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
            onClick={handleDownloadZip}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition flex items-center justify-center gap-2"
          >
            <Archive className="w-4 h-4" />
            <span>Download All as ZIP Archive ({result.files.length} Files)</span>
          </button>
        </div>
      )}

      {/* Suggested Tool Chaining Chips */}
      {result.suggestedNext && result.suggestedNext.length > 0 && (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Continue in workspace without re-uploading
          </div>
          <div className="flex flex-wrap gap-2">
            {result.suggestedNext.map((nextSlug) => (
              <button
                key={nextSlug}
                type="button"
                onClick={() => handleContinueTool(nextSlug)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              >
                <span>{nextSlug.replace('-', ' ').toUpperCase()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
