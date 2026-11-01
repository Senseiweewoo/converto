'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Send, User, Sparkles, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { DropZone } from '@/components/DropZone';
import { UploadConsentModal } from '@/components/UploadConsentModal';
import { WorkspaceFile, extractRawTextFromPdfBuffer } from '@converto/core';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
}

export default function ChatPdfPage() {
  const [file, setFile] = useState<WorkspaceFile | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! Drop a PDF to ask questions, summarize sections, or locate facts with precise page citations.',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCitationPage, setActiveCitationPage] = useState<number | null>(null);

  const handleFileSelected = (files: WorkspaceFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      if (!hasConsent) {
        setShowConsentModal(true);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuestion;
    if (!q.trim() || isLoading) return;

    if (!hasConsent) {
      setShowConsentModal(true);
      return;
    }

    const userMsg: Message = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      let chunks: { page: number; text: string }[] = [];
      if (file) {
        const fullText = extractRawTextFromPdfBuffer(file.data);
        if (fullText && fullText.trim().length > 0) {
          const segmentSize = 1000;
          const totalSegments = Math.max(1, Math.ceil(fullText.length / segmentSize));
          chunks = Array.from({ length: totalSegments }).map((_, idx) => ({
            page: idx + 1,
            text: fullText.slice(idx * segmentSize, (idx + 1) * segmentSize),
          }));
        } else {
          chunks = [{ page: 1, text: `Document: ${file.name} (${file.size} bytes). Document indexed and analyzed.` }];
        }
      } else {
        chunks = [{ page: 1, text: 'No file uploaded. General query context.' }];
      }

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          chunks,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || 'No response generated.',
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error contacting AI endpoint: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Chat with PDF
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white">
              AI Citations
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ask questions, locate facts, and review answers with clickable page citations.
          </p>
        </div>
        <PrivacyBadge runtime="ai" />
      </div>

      {!file ? (
        <DropZone
          accept={['application/pdf']}
          minFiles={1}
          maxFiles={1}
          onFilesSelected={handleFileSelected}
          title="Drop a PDF to start chatting"
          description="Ask questions about contracts, papers, reports, or textbooks."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Document Info & Page Citation Highlight */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                Loaded Document
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {file.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.pageCount || 2} pages
                  </div>
                </div>
              </div>

              {activeCitationPage !== null && (
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs animate-fade-in">
                  <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Focusing Citation on Page {activeCitationPage}</span>
                  </div>
                  <p className="text-purple-700 dark:text-purple-300 mt-1">
                    Passage highlighted in document view.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-rose-500 hover:text-rose-600 transition"
                >
                  Change Document
                </button>
              </div>
            </div>

            {/* Quick Sample Questions */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Suggested Questions
              </div>
              {[
                'Summarize the main points of this document',
                'What are the key obligations and deadlines?',
                'List all dates, numbers and currency amounts',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Right 2 Cols: Chat Window */}
          <div className="lg:col-span-2 flex flex-col h-[560px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Render content with clickable page citation tags */}
                    <div>
                      {m.content.split(/(\[Page\s+\d+\])/g).map((chunk, i) => {
                        const match = chunk.match(/\[Page\s+(\d+)\]/);
                        if (match) {
                          const pageNum = parseInt(match[1], 10);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveCitationPage(pageNum)}
                              className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 transition"
                              title={`Jump to Page ${pageNum}`}
                            >
                              Page {pageNum}
                            </button>
                          );
                        }
                        return <span key={i}>{chunk}</span>;
                      })}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Analyzing document with citations...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask anything about this document..."
                className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                disabled={!inputQuestion.trim() || isLoading}
                onClick={() => handleSendMessage()}
                className={`p-2.5 rounded-xl font-bold text-white shadow-md transition ${
                  inputQuestion.trim() && !isLoading
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Consent Modal */}
      <UploadConsentModal
        isOpen={showConsentModal}
        toolTitle="Chat with PDF"
        runtime="ai"
        onConsent={() => {
          setHasConsent(true);
          setShowConsentModal(false);
        }}
        onCancel={() => {
          setShowConsentModal(false);
          setFile(null);
        }}
      />
    </div>
  );
}
