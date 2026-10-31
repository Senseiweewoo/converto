'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Moon, Sun, Layers, HelpCircle } from 'lucide-react';
import { PrivacyProofModal } from './PrivacyProofModal';

export function Navbar() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  Converto
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Privacy-First
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Convert, edit and fix any PDF, privately.
              </p>
            </div>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Privacy Proof Button */}
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-sm"
              title="View live network proof of zero file uploads"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Privacy Proof</span>
              <span className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-800 px-1 py-0.2 rounded">
                0 uploads
              </span>
            </button>

            {/* Batch Studio Link */}
            <Link
              href="/batch"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
            >
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Batch Studio</span>
            </Link>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <PrivacyProofModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </>
  );
}
