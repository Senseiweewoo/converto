import React from 'react';
import { ShieldCheck, Server, Sparkles } from 'lucide-react';
import { ToolRuntime } from '@converto/tools';

interface PrivacyBadgeProps {
  runtime: ToolRuntime;
  className?: string;
}

export function PrivacyBadge({ runtime, className = '' }: PrivacyBadgeProps) {
  if (runtime === 'local') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}
        title="Your file stays 100% on this device. Zero bytes are uploaded to any server."
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Processed on your device</span>
      </span>
    );
  }

  if (runtime === 'ai') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 ${className}`}
        title="Uses AI models on our secure server. Auto-deleted after processing."
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        <span>Uses AI (Secure Server)</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${className}`}
      title="Requires server conversion engine. Automatically deleted within 1 hour."
    >
      <Server className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      <span>Uses secure server</span>
    </span>
  );
}
