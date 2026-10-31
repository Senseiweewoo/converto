import React from 'react';
import { AlertCircle, KeyRound, Wrench, RefreshCcw } from 'lucide-react';
import { ConvertoError } from '@converto/core';

interface ErrorPanelProps {
  error: Error | ConvertoError | string;
  onRetry?: () => void;
  onPasswordSubmit?: (password: string) => void;
}

export function ErrorPanel({ error, onRetry, onPasswordSubmit }: ErrorPanelProps) {
  const [passwordInput, setPasswordInput] = React.useState('');

  const isPassword =
    (error instanceof ConvertoError && error.code === 'PASSWORD_REQUIRED') ||
    (typeof error === 'string' && error.toLowerCase().includes('password')) ||
    (error instanceof Error && error.message.toLowerCase().includes('password'));

  const message = typeof error === 'string' ? error : error.message;
  const suggestion =
    error instanceof ConvertoError
      ? error.actionableSuggestion
      : 'Please verify the document format or try again.';

  return (
    <div className="w-full p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 shadow-md animate-shake">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
          {isPassword ? <KeyRound className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-rose-900 dark:text-rose-200">
            {isPassword ? 'Password Protected Document' : 'Unable to Process File'}
          </h4>
          <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
            {message}
          </p>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
            {suggestion}
          </p>

          {isPassword && onPasswordSubmit && (
            <div className="mt-4 flex gap-2 max-w-sm">
              <input
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-sm border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex-1 focus:ring-2 focus:ring-rose-500"
              />
              <button
                onClick={() => onPasswordSubmit(passwordInput)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                Unlock
              </button>
            </div>
          )}

          {onRetry && !isPassword && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
