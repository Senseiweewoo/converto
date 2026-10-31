'use client';

import React from 'react';
import { RotateCw, Trash2, Copy, Plus, FileText } from 'lucide-react';
import { OrganizePageItem } from '@converto/core';

interface OrganizeGridProps {
  pages: OrganizePageItem[];
  onChange: (pages: OrganizePageItem[]) => void;
}

export function OrganizeGrid({ pages, onChange }: OrganizeGridProps) {
  const rotatePage = (index: number) => {
    const updated = [...pages];
    const currentRot = updated[index].rotation || 0;
    updated[index] = {
      ...updated[index],
      rotation: (currentRot + 90) % 360,
    };
    onChange(updated);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return;
    const updated = pages.filter((_, i) => i !== index);
    onChange(updated);
  };

  const duplicatePage = (index: number) => {
    const updated = [...pages];
    const toDup = updated[index];
    updated.splice(index + 1, 0, {
      ...toDup,
      id: Math.random().toString(36).substring(2, 9),
    });
    onChange(updated);
  };

  const insertBlankPage = (afterIndex?: number) => {
    const updated = [...pages];
    const blank: OrganizePageItem = {
      id: Math.random().toString(36).substring(2, 9),
      isBlank: true,
      rotation: 0,
    };
    if (afterIndex !== undefined) {
      updated.splice(afterIndex + 1, 0, blank);
    } else {
      updated.push(blank);
    }
    onChange(updated);
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const updated = [...pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {pages.length} Pages in Document
        </span>
        <button
          type="button"
          onClick={() => insertBlankPage()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Insert Blank Page</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
        {pages.map((page, idx) => (
          <div
            key={page.id}
            className="group relative flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
          >
            {/* Page number badge */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white dark:bg-slate-100 dark:text-slate-900 z-10">
              #{idx + 1}
            </div>

            {/* Page preview card */}
            <div
              className={`w-full aspect-[1/1.4] rounded-xl flex flex-col items-center justify-center transition-transform duration-200 my-2 ${
                page.isBlank
                  ? 'bg-slate-100 dark:bg-slate-700/40 border border-dashed border-slate-300 dark:border-slate-600'
                  : 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-slate-200 dark:border-slate-700'
              }`}
              style={{
                transform: `rotate(${page.rotation || 0}deg)`,
              }}
            >
              <FileText className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition" />
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {page.isBlank ? 'Blank' : `Page ${(page.sourcePageIndex ?? idx) + 1}`}
              </div>
            </div>

            {/* Action Bar */}
            <div className="w-full flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => rotatePage(idx)}
                className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => duplicatePage(idx)}
                className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                title="Duplicate Page"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {pages.length > 1 && (
                <button
                  type="button"
                  onClick={() => deletePage(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  title="Delete Page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
