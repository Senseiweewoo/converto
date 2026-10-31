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

    case 'compress-to-target':
      return (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target Size Presets
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'government-form', label: 'Govt Form (200 KB)' },
              { id: 'visa-upload', label: 'Visa Portal (300 KB)' },
              { id: 'job-portal', label: 'Job Portal (500 KB)' },
              { id: 'email-attachment', label: 'Email (2 MB)' },
              { id: 'whatsapp', label: 'WhatsApp (16 MB)' },
              { id: 'custom', label: 'Custom Target' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update('preset', p.id)}
                className={`p-2.5 rounded-xl text-left border text-xs font-semibold transition ${
                  settings.preset === p.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {settings.preset === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Size (KB)
              </label>
              <input
                type="number"
                min={50}
                max={50000}
                value={settings.customTargetKb || 500}
                onChange={(e) => update('customTargetKb', parseInt(e.target.value, 10) || 500)}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>
      );

    case 'sign-pdf':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Signature Text
            </label>
            <input
              type="text"
              value={settings.typedSignatureText || ''}
              onChange={(e) => update('typedSignatureText', e.target.value)}
              placeholder="Your Full Name..."
              className="w-full px-3.5 py-2 rounded-xl text-sm italic font-serif border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Placement Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sign-all-pages', label: 'Sign Every Page' },
                { id: 'initial-every-page', label: 'Initial Every Page' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => update('placementMode', m.id)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                    settings.placementMode === m.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'redact-pdf':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Redaction Stamp Label
            </label>
            <input
              type="text"
              value={settings.redactLabel || ''}
              onChange={(e) => update('redactLabel', e.target.value)}
              placeholder="[CONFIDENTIAL REDACTED]"
              className="w-full px-3.5 py-2 rounded-xl text-sm font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="redactMeta"
              checked={settings.scrubMetadata !== false}
              onChange={(e) => update('scrubMetadata', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="redactMeta" className="text-xs text-slate-600 dark:text-slate-400">
              Permanently wipe author, GPS, annotations & revision history
            </label>
          </div>
        </div>
      );

    case 'forms-pdf':
      return (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            Form fields are automatically detected and prepared for one-click flattening into permanent read-only vector content.
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="flattenForm"
              checked={settings.flatten !== false}
              onChange={(e) => update('flatten', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="flattenForm" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Flatten form fields (bakes values permanently into pages)
            </label>
          </div>
        </div>
      );

    case 'smart-fix':
      return (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            Smart Fix analyzes document rotation, blank pages, and stream structures, then executes an automated multi-step healing sequence.
          </div>
        </div>
      );

    case 'remove-pages':
      return (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pages to Remove (e.g. 2, 4, 6)
          </label>
          <input
            type="text"
            value={settings.pagesToRemove || '2'}
            onChange={(e) => update('pagesToRemove', e.target.value)}
            placeholder="2, 4"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      );

    case 'extract-pages':
      return (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pages to Extract (e.g. 1, 3, 5)
          </label>
          <input
            type="text"
            value={settings.pagesToExtract || '1'}
            onChange={(e) => update('pagesToExtract', e.target.value)}
            placeholder="1, 3"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="separateFiles"
              checked={!!settings.separateFiles}
              onChange={(e) => update('separateFiles', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="separateFiles" className="text-xs text-slate-600 dark:text-slate-400">
              Extract each page into a separate individual PDF file
            </label>
          </div>
        </div>
      );

    case 'crop-pdf':
      return (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Crop Margins (Points)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-muted-foreground">Top</label>
              <input
                type="number"
                value={settings.topMargin ?? 20}
                onChange={(e) => update('topMargin', parseInt(e.target.value, 10))}
                className="w-full px-2 py-1 rounded-lg border border-border bg-card"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Bottom</label>
              <input
                type="number"
                value={settings.bottomMargin ?? 20}
                onChange={(e) => update('bottomMargin', parseInt(e.target.value, 10))}
                className="w-full px-2 py-1 rounded-lg border border-border bg-card"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Left</label>
              <input
                type="number"
                value={settings.leftMargin ?? 20}
                onChange={(e) => update('leftMargin', parseInt(e.target.value, 10))}
                className="w-full px-2 py-1 rounded-lg border border-border bg-card"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Right</label>
              <input
                type="number"
                value={settings.rightMargin ?? 20}
                onChange={(e) => update('rightMargin', parseInt(e.target.value, 10))}
                className="w-full px-2 py-1 rounded-lg border border-border bg-card"
              />
            </div>
          </div>
        </div>
      );

    case 'repair-pdf':
      return (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
          Reconstructs missing %%EOF trailer markers, repairs unreadable xref tables, and extracts uncorrupted stream pages into a normalized PDF.
        </div>
      );

    case 'deep-sanitizer':
      return (
        <div className="space-y-2">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
            Deep Sanitizer removes hidden tracking dots, EXIF camera tags, author software fingerprints, and zeroes timestamps.
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wipeMetadata"
              checked={settings.wipeMetadata !== false}
              onChange={(e) => update('wipeMetadata', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="wipeMetadata" className="text-xs text-slate-700 dark:text-slate-300">
              Wipe all author, title, and software tags
            </label>
          </div>
        </div>
      );

    case 'pdf-to-pdfa':
      return (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Archival Conformance Standard
          </label>
          <select
            value={settings.conformance || 'PDF/A-1b'}
            onChange={(e) => update('conformance', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card"
          >
            <option value="PDF/A-1b">PDF/A-1b (Visual reproduction archiving)</option>
            <option value="PDF/A-2b">PDF/A-2b (Modern ISO 19005-2 with transparency)</option>
          </select>
        </div>
      );

    case 'html-to-pdf':
      return (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Webpage URL or Raw HTML
          </label>
          <input
            type="text"
            value={settings.url || ''}
            onChange={(e) => update('url', e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card"
          />
          <textarea
            value={settings.htmlContent || ''}
            onChange={(e) => update('htmlContent', e.target.value)}
            placeholder="<h1>Or paste HTML code directly...</h1>"
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card font-mono"
          />
        </div>
      );

    case 'edit-pdf':
      return (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Overlay Annotation Text
          </label>
          <input
            type="text"
            value={settings.text || 'Approved'}
            onChange={(e) => update('text', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Stamp Color:</label>
            <input
              type="color"
              value={settings.colorHex || '#059669'}
              onChange={(e) => update('colorHex', e.target.value)}
              className="w-8 h-8 rounded border border-border p-0.5"
            />
          </div>
        </div>
      );

    case 'ai-summarizer':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Summary Length</label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {(['short', 'medium', 'detailed'] as const).map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => update('length', len)}
                  className={`py-1.5 px-2 text-xs rounded-lg font-medium border ${
                    settings.length === len
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-card border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {len.charAt(0).toUpperCase() + len.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format</label>
            <select
              value={settings.format || 'bullet-points'}
              onChange={(e) => update('format', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card mt-1"
            >
              <option value="bullet-points">Bullet Points (Action Items)</option>
              <option value="executive-summary">Executive Narrative Paragraph</option>
            </select>
          </div>
        </div>
      );

    case 'translate-pdf':
      return (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Language</label>
          <select
            value={settings.targetLanguage || 'Spanish'}
            onChange={(e) => update('targetLanguage', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card"
          >
            <option value="Spanish">Spanish (Español)</option>
            <option value="French">French (Français)</option>
            <option value="German">German (Deutsch)</option>
            <option value="Japanese">Japanese (日本語)</option>
            <option value="Arabic">Arabic (العربية)</option>
            <option value="Portuguese">Portuguese (Português)</option>
            <option value="Filipino">Filipino (Tagalog)</option>
            <option value="Hindi">Hindi (हिन्दी)</option>
          </select>
        </div>
      );

    case 'text-to-speech':
      return (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            Local browser Web Speech API plays document audio aloud with word highlighting.
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Reading Speed ({settings.rate || 1.0}x)</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.rate || 1.0}
              onChange={(e) => update('rate', parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
      );

    case 'bionic-reader':
      return (
        <div className="space-y-3">
          <div className="p-3 bg-card border border-border rounded-xl text-xs text-muted-foreground">
            Bionic reading bolds the beginning of each word (<strong className="text-foreground">Con</strong>verto <strong className="text-foreground">hel</strong>ps <strong className="text-foreground">you</strong> <strong className="text-foreground">re</strong>ad <strong className="text-foreground">fas</strong>ter).
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Fixation Strength</label>
            <select
              value={settings.fixationStrength || 'medium'}
              onChange={(e) => update('fixationStrength', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card mt-1"
            >
              <option value="low">Subtle (First letter only)</option>
              <option value="medium">Balanced (Standard bionic fixation)</option>
              <option value="high">Strong (Half of word anchor)</option>
            </select>
          </div>
        </div>
      );

    default:
      return null;
  }
}
