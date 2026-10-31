import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base">
                C
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                Converto
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Convert, edit and fix any PDF, privately. 100% free, no signups, no watermarks, and files stay on your device by default.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-knowledge client-side encryption & processing</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Popular Tools
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/tools/merge-pdf" className="hover:text-emerald-600 transition">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/split-pdf" className="hover:text-emerald-600 transition">
                  Split PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/compress-pdf" className="hover:text-emerald-600 transition">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/jpg-to-pdf" className="hover:text-emerald-600 transition">
                  JPG to PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/organize-pdf" className="hover:text-emerald-600 transition">
                  Organize Pages
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Open Source */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Privacy & Legal
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/#privacy" className="hover:text-emerald-600 transition">
                  Privacy Promise
                </Link>
              </li>
              <li>
                <Link href="/#workflows" className="hover:text-emerald-600 transition">
                  Workflow Builder
                </Link>
              </li>
              <li>
                <Link href="/#api" className="hover:text-emerald-600 transition">
                  Developer API
                </Link>
              </li>
              <li>
                <Link href="/#pro" className="hover:text-emerald-600 transition">
                  Pro Plan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} Converto. Built with privacy and local execution by default.
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for privacy-conscious creators worldwide.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
