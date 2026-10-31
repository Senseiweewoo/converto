'use client';

import React from 'react';
import { X, History, RotateCcw, Clock, ArrowRight, FileText } from 'lucide-react';
import { WorkspaceHistoryEntry } from '../lib/workspace-db';
import { workspaceManager } from '../lib/workspace-store';

interface WorkspaceTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: WorkspaceHistoryEntry[];
}

export function WorkspaceTimelineModal({ isOpen, onClose, history }: WorkspaceTimelineModalProps) {
  if (!isOpen) return null;

  const handleRevert = async (entry: WorkspaceHistoryEntry) => {
    await workspaceManager.revertToHistoryEntry(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Workspace History Timeline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit and revert to any version produced in this session
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

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
              No operations performed in this session yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-emerald-200 dark:border-emerald-900 ml-4 space-y-6">
              {history.map((entry, idx) => (
                <div key={entry.id} className="relative pl-6">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 shadow-sm" />

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        {entry.toolTitle}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">
                      {entry.summary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{entry.outputIds.length} output file{entry.outputIds.length > 1 ? 's' : ''}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevert(entry)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Revert to this version</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={() => {
              workspaceManager.clearWorkspace();
              onClose();
            }}
            className="text-xs text-rose-500 hover:text-rose-600 font-medium transition"
          >
            Clear Entire Workspace
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
