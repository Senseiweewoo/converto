'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileUp, AlertCircle } from 'lucide-react';
import { WorkspaceFile } from '@converto/core';

interface DropZoneProps {
  accept: string[];
  minFiles: number;
  maxFiles: number;
  onFilesSelected: (files: WorkspaceFile[]) => void;
  title?: string;
  description?: string;
}

function expandAcceptList(acceptList: string[]): string[] {
  const result = new Set<string>(acceptList);
  for (const item of acceptList) {
    if (item === 'application/pdf') result.add('.pdf');
    else if (item.includes('wordprocessingml') || item === 'application/msword') {
      result.add('.docx');
      result.add('.doc');
    } else if (item.includes('spreadsheetml') || item === 'application/vnd.ms-excel' || item === 'text/csv') {
      result.add('.xlsx');
      result.add('.xls');
      result.add('.csv');
    } else if (item.includes('presentationml') || item === 'application/vnd.ms-powerpoint') {
      result.add('.pptx');
      result.add('.ppt');
    } else if (item === 'image/*' || item.startsWith('image/')) {
      result.add('.png');
      result.add('.jpg');
      result.add('.jpeg');
      result.add('.webp');
    } else if (item === 'text/html') {
      result.add('.html');
      result.add('.htm');
    } else if (item === 'text/markdown') {
      result.add('.md');
    }
  }
  return Array.from(result);
}

export function DropZone({
  accept,
  minFiles,
  maxFiles,
  onFilesSelected,
  title = 'Drop your files here',
  description = 'or click to browse from your device',
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expandedAccept = expandAcceptList(accept);

  const processFileList = useCallback(
    async (fileList: FileList | File[]) => {
      setErrorMsg(null);
      const rawFiles = Array.from(fileList);

      if (rawFiles.length === 0) return;

      if (rawFiles.length > maxFiles) {
        setErrorMsg(`You can select at most ${maxFiles} file${maxFiles > 1 ? 's' : ''} for this operation.`);
        return;
      }

      const validFiles: WorkspaceFile[] = [];

      for (const file of rawFiles) {
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const isPdf = file.type === 'application/pdf' || ext === '.pdf';

        const matchesMime = accept.some((a) => {
          if (a.endsWith('/*')) {
            const prefix = a.replace('/*', '');
            return file.type.startsWith(prefix);
          }
          return file.type === a;
        });
        const matchesExt = expandedAccept.some((a) => a.startsWith('.') && ext === a.toLowerCase());

        if (!matchesMime && !matchesExt && accept.length > 0) {
          setErrorMsg(`"${file.name}" is not a supported file format for this tool.`);
          return;
        }

        const buffer = await file.arrayBuffer();
        validFiles.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          type: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
          lastModified: file.lastModified,
          data: new Uint8Array(buffer),
        });
      }

      onFilesSelected(validFiles);
    },
    [accept, expandedAccept, maxFiles, onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFileList(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-emerald-400 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={expandedAccept.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            {description}
          </p>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition"
          >
            <FileUp className="w-4 h-4" />
            <span>Select Files</span>
          </button>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span>Accepted formats: {accept.map((a) => a.replace('application/', '').replace('image/', '')).join(', ')}</span>
            {maxFiles > 1 && <span>• Up to {maxFiles} files</span>}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
