import React from 'react';
import { FileText, Trash2, GripVertical, FileImage } from 'lucide-react';
import { WorkspaceFile } from '@converto/core';

interface FileCardProps {
  file: WorkspaceFile;
  index?: number;
  onRemove?: () => void;
  canReorder?: boolean;
}

export function FileCard({ file, index, onRemove, canReorder = false }: FileCardProps) {
  const isImage = file.type.startsWith('image/');
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition">
      <div className="flex items-center gap-3 truncate">
        {canReorder && (
          <div className="cursor-grab text-slate-400 hover:text-slate-600">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          {isImage ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>

        <div className="truncate">
          <div className="text-sm font-semibold text-slate-800 dark:text-white truncate">
            {index !== undefined && <span className="text-slate-400 font-normal mr-1">#{index + 1}</span>}
            {file.name}
          </div>
          <div className="text-xs text-slate-400">
            {sizeMb} MB {file.pageCount ? `• ${file.pageCount} pages` : ''}
          </div>
        </div>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition ml-2 flex-shrink-0"
          title="Remove file"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
