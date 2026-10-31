import React from 'react';
import { XCircle, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0 to 1
  stepText: string;
  onCancel?: () => void;
}

export function ProgressBar({ progress, stepText, onCancel }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div className="w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            {stepText || 'Processing document...'}
          </span>
        </div>
        <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {percent}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
}
