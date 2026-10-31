'use client';

import React from 'react';
import { Settings, Shield, Sliders } from 'lucide-react';

interface ToolSettingsProps {
  toolId: string;
  settings: any;
  onChange: (newSettings: any) => void;
}

export function ToolSettings({ toolId, settings, onChange }: ToolSettingsProps) {
  const update = (key: string, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  switch (toolId) {
    case 'split-pdf':
      return (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Split Mode
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ranges', label: 'Custom Ranges' },
              { id: 'every-n', label: 'Every N Pages' },
              { id: 'extract-all', label: 'Extract All' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => update('mode', mode.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  settings.mode === mode.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {settings.mode === 'ranges' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Page ranges (e.g. 1-3, 5, 7-10)
              </label>
              <input
                type="text"
                value={settings.ranges || ''}
                onChange={(e) => update('ranges', e.target.value)}
                placeholder="1-2"
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mergeRanges"
                  checked={!!settings.mergeRangesIntoOne}
                  onChange={(e) => update('mergeRangesIntoOne', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="mergeRanges" className="text-xs text-slate-600 dark:text-slate-400">
                  Merge all ranges into one single output PDF
                </label>
              </div>
            </div>
          )}

          {settings.mode === 'every-n' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Split every N pages
              </label>
              <input
                type="number"
                min={1}
                value={settings.everyN || 1}
                onChange={(e) => update('everyN', parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>
      );

    case 'compress-pdf':
      return (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Compression Level
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'basic', label: 'Basic', desc: 'Preserves high print quality' },
              { id: 'strong', label: 'Strong', desc: 'Recommended for email uploads' },
              { id: 'extreme', label: 'Extreme', desc: 'Maximum size reduction' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update('preset', p.id)}
                className={`p-3 rounded-xl text-left border transition ${
                  settings.preset === p.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{p.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="rmMeta"
              checked={settings.removeMetadata !== false}
              onChange={(e) => update('removeMetadata', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="rmMeta" className="text-xs text-slate-600 dark:text-slate-400">
              Scrub hidden author metadata & revision history for privacy
            </label>
          </div>
        </div>
      );

    case 'rotate-pdf':
      return (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Rotation Angle
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[90, 180, 270].map((angle) => (
              <button
                key={angle}
                type="button"
                onClick={() => update('angle', angle)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  settings.angle === angle
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {angle}° Clockwise
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Apply to pages
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All Pages' },
                { id: 'odd', label: 'Odd Only' },
                { id: 'even', label: 'Even Only' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update('pages', opt.id)}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                    settings.pages === opt.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'page-numbers':
      return (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Number Position
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'bottom-left', label: 'Bottom Left' },
              { id: 'bottom-center', label: 'Bottom Center' },
              { id: 'bottom-right', label: 'Bottom Right' },
              { id: 'top-left', label: 'Top Left' },
              { id: 'top-center', label: 'Top Center' },
              { id: 'top-right', label: 'Top Right' },
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => update('position', pos.id)}
                className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition ${
                  settings.position === pos.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Format
              </label>
              <select
                value={settings.format || 'page-of-total'}
                onChange={(e) => update('format', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                <option value="page-of-total">Page 1 of 10</option>
                <option value="slash">1 / 10</option>
                <option value="page-only">1 (Only Number)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Number
              </label>
              <input
                type="number"
                min={1}
                value={settings.startFrom || 1}
                onChange={(e) => update('startFrom', parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );

    case 'watermark-pdf':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Watermark Text
            </label>
            <input
              type="text"
              value={settings.text || ''}
              onChange={(e) => update('text', e.target.value)}
              placeholder="CONFIDENTIAL"
              className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opacity ({Math.round((settings.opacity || 0.2) * 100)}%)
              </label>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={settings.opacity || 0.2}
                onChange={(e) => update('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Angle ({settings.rotation || 45}°)
              </label>
              <input
                type="range"
                min="-90"
                max="90"
                step="15"
                value={settings.rotation || 45}
                onChange={(e) => update('rotation', parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      );

    case 'jpg-to-pdf':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Page Size
              </label>
              <select
                value={settings.pageSize || 'A4'}
                onChange={(e) => update('pageSize', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                <option value="A4">A4 Standard</option>
                <option value="LETTER">US Letter</option>
                <option value="FIT_IMAGE">Fit to Image Size</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Orientation
              </label>
              <select
                value={settings.orientation || 'auto'}
                onChange={(e) => update('orientation', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                <option value="auto">Auto (Match Image)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        </div>
      );

    case 'protect-pdf':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Document Password
            </label>
            <input
              type="password"
              value={settings.password || ''}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Enter password..."
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={settings.confirmPassword || ''}
              onChange={(e) => update('confirmPassword', e.target.value)}
              placeholder="Confirm password..."
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>
        </div>
      );

    case 'unlock-pdf':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={settings.password || ''}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Enter document password..."
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
