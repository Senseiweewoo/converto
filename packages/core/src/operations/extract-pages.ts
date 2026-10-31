import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface ExtractPagesOptions {
  pagesToExtract: number[]; // 1-indexed page numbers
  separateFiles?: boolean; // if true, each page becomes its own PDF
}

export interface ExtractPagesResult {
  data: Uint8Array;
  extractedCount: number;
  files?: { name: string; data: Uint8Array }[];
}

export async function extractPagesPdf(
  data: Uint8Array,
  baseFilename: string,
  options: ExtractPagesOptions,
  ctx?: RunContext
): Promise<ExtractPagesResult> {
  const sourceDoc = await safeLoadPdf(data);
  const total = sourceDoc.getPageCount();

  ctx?.onProgress?.(0.2, 'Locating requested pages...');

  const zeroIndexed = options.pagesToExtract
    .filter((p) => p >= 1 && p <= total)
    .map((p) => p - 1);

  const uniqueIndices = Array.from(new Set(zeroIndexed)).sort((a, b) => a - b);

  if (uniqueIndices.length === 0) {
    throw new Error('No valid pages specified for extraction.');
  }

  const baseName = baseFilename.replace(/\.pdf$/i, '');

  if (options.separateFiles) {
    const files: { name: string; data: Uint8Array }[] = [];
    for (let i = 0; i < uniqueIndices.length; i++) {
      const idx = uniqueIndices[i];
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(sourceDoc, [idx]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save({ useObjectStreams: true });
      files.push({
        name: `${baseName}_page_${idx + 1}.pdf`,
        data: bytes,
      });
      ctx?.onProgress?.((i / uniqueIndices.length) * 0.9, `Extracted page ${idx + 1}...`);
    }

    return {
      data: files[0].data,
      extractedCount: files.length,
      files,
    };
  }

  // Consolidated document
  const consolidatedDoc = await PDFDocument.create();
  const copiedPages = await consolidatedDoc.copyPages(sourceDoc, uniqueIndices);
  for (const page of copiedPages) {
    consolidatedDoc.addPage(page);
  }

  const resultBytes = await consolidatedDoc.save({ useObjectStreams: true });
  return {
    data: resultBytes,
    extractedCount: uniqueIndices.length,
  };
}
