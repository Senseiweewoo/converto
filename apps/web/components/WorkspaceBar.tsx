'use client';

import React, { useState, useEffect } from 'react';
import { Undo2, Redo2, History, Trash2, FolderSync } from 'lucide-react';
import { workspaceManager } from '../lib/workspace-store';
import { WorkspaceFile } from '@converto/core';
import { WorkspaceHistoryEntry } from '../lib/workspace-db';
import { WorkspaceTimelineModal } from './WorkspaceTimelineModal';

export function WorkspaceBar() {
  const [activeFiles, setActiveFiles] = useState<WorkspaceFile[]>([]);
  const [history, setHistory] = useState<WorkspaceHistoryEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  useEffect(() => {
    workspaceManager.init();

    const updateState = () => {
      setActiveFiles(workspaceManager.getActiveFiles());
      setHistory(workspaceManager.getHistory());
      setCanUndo(workspaceManager.canUndo());
      setCanRedo(workspaceManager.canRedo());
    };

    updateState();
    const unsub = workspaceManager.subscribe(updateState);

    // Global keyboard shortcuts for undo / redo
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          workspaceManager.redo();
        } else {
          e.preventDefault();
          workspaceManager.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        workspaceManager.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsub();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (activeFiles.length === 0 && history.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 animate-fade-in max-w-xl w-[92%] sm:w-auto">
        {/* Workspace status badge */}
        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
            {activeFiles.length} file{activeFiles.length !== 1 ? 's' : ''} in workspace
          </span>
        </div>

        {/* Undo / Redo controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => workspaceManager.undo()}
            className={`p-1.5 rounded-lg transition ${
              canUndo
                ? 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Undo last action (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={() => workspaceManager.redo()}
            className={`p-1.5 rounded-lg transition ${
              canRedo
                ? 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Redo action (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Modal Toggle */}
        <button
          type="button"
          onClick={() => setIsTimelineOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="View full operations history timeline"
        >
          <History className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Timeline</span>
          {history.length > 0 && (
            <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              {history.length}
            </span>
          )}
        </button>

        {/* Clear workspace */}
        <button
          type="button"
          onClick={() => workspaceManager.clearWorkspace()}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition ml-auto sm:ml-0"
          title="Clear all local session files"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <WorkspaceTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        history={history}
      />
    </>
  );
}
