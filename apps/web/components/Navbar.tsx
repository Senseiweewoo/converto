'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  Layers, 
  Workflow, 
  CreditCard, 
  Code2, 
  Globe, 
  ChevronDown 
} from 'lucide-react';
import { PrivacyProofModal } from './PrivacyProofModal';
import { useI18n, SUPPORTED_LANGUAGES, SupportedLanguage, initializeI18n } from '@/lib/i18n';

export function Navbar() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const { currentLang, setLanguage, t } = useI18n();

  useEffect(() => {
    initializeI18n();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

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
                  {t('privacyBadge')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('tagline')}
              </p>
            </div>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Live Privacy Proof Button */}
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-sm"
              title="View live network proof of zero file uploads"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden lg:inline">{t('privacyProof')}</span>
              <span className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-800 px-1 py-0.2 rounded">
                {t('zeroUploads')}
              </span>
            </button>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/batch"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('batchStudio')}</span>
              </Link>

              <Link
                href="/workflows"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Workflow className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('workflows')}</span>
              </Link>

              <Link
                href="/pricing"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('pricing')}</span>
              </Link>

              <Link
                href="/api-docs"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('apiDocs')}</span>
              </Link>
            </nav>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-border bg-card hover:bg-muted transition"
                aria-label="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline font-medium">{currentLangObj.nativeName}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-muted transition ${
                        currentLang === lang.code ? 'font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20' : 'text-foreground'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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

      {/* Live Privacy Auditor Modal */}
      <PrivacyProofModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </>
  );
}
