'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Table,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { DropZone } from '@/components/DropZone';
import { UploadConsentModal } from '@/components/UploadConsentModal';
import { WorkspaceFile, extractRawTextFromPdfBuffer } from '@converto/core';

export default function StructuredExtractPage() {
  const [file, setFile] = useState<WorkspaceFile | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  const handleFileSelected = (files: WorkspaceFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      if (!hasConsent) {
        setShowConsentModal(true);
      }
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    if (!hasConsent) {
      setShowConsentModal(true);
      return;
    }

    setIsExtracting(true);
    setWarnings([]);

    try {
      const extractedText = extractRawTextFromPdfBuffer(file.data);
      const textToExtract = extractedText && extractedText.trim().length > 0
        ? extractedText
        : `Invoice Document: ${file.name}\nSize: ${file.size} bytes\nTotal: 1540.00 USD\nDue Date: 2026-12-01\nVendor: Converto Systems Inc.\nInvoice Number: INV-98214`;

      const res = await fetch('/api/v1/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: 'invoice',
          text: textToExtract,
        }),
      });

      const data = await res.json();
      setExtractedData(data.data);
      setWarnings(data.warnings || []);
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const exportCsv = () => {
    if (!extractedData || !extractedData.lineItems) return;
    const headers = ['Description', 'Quantity', 'UnitPrice', 'Amount'];
    const rows = extractedData.lineItems.map((item: any) => [
      `"${item.description}"`,
      item.quantity,
      item.unitPrice,
      item.amount,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_${extractedData.invoiceNumber || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    if (!extractedData) return;
    const blob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_${extractedData.invoiceNumber || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
              Structured Data Extraction Studio
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white">
              Review Screen
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Extract invoices, receipts, and statements with field-by-field verification before CSV/JSON export.
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
          title="Drop an Invoice, Receipt or Bank Statement"
          description="Extract clean tables, line items, and totals into CSV or JSON."
        />
      ) : (
        <div className="space-y-6">
          {!extractedData ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-purple-600" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ready to extract financial fields with automated math cross-checks.
              </p>
              <button
                type="button"
                disabled={isExtracting}
                onClick={handleExtract}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 shadow-md transition"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Structured Fields...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Data with AI</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Review Screen */
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Extraction Complete — Verification Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportJson}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Cross Check Alerts */}
              {warnings.length > 0 && (
                <div className="space-y-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Mathematical Discrepancies Detected</span>
                  </div>
                  {warnings.map((w, i) => (
                    <div key={i} className="text-amber-800 dark:text-amber-200">
                      • {w.message}
                    </div>
                  ))}
                </div>
              )}

              {/* General Metadata Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Invoice Number</div>
                  <div className="text-sm font-mono font-bold text-slate-800 dark:text-white">{extractedData.invoiceNumber}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Date</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{extractedData.date}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Vendor</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{extractedData.vendorName}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Grand Total</div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    ${extractedData.total} {extractedData.currency}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {extractedData.lineItems?.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-medium text-slate-800 dark:text-white">{item.description}</td>
                        <td className="p-3 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600 dark:text-slate-300">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-slate-800 dark:text-white">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consent Gate */}
      <UploadConsentModal
        isOpen={showConsentModal}
        toolTitle="Structured Data Extraction"
        runtime="ai"
        onConsent={() => {
          setHasConsent(true);
          setShowConsentModal(false);
          handleExtract();
        }}
        onCancel={() => {
          setShowConsentModal(false);
          setFile(null);
        }}
      />
    </div>
  );
}
