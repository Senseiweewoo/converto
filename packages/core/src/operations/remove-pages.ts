import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface RemovePagesOptions {
  pagesToRemove: number[]; // 1-indexed page numbers
}

export interface RemovePagesResult {
  data: Uint8Array;
  remainingPages: number;
  removedPagesCount: number;
}

export async function removePagesPdf(
  data: Uint8Array,
  options: RemovePagesOptions,
  ctx?: RunContext
): Promise<RemovePagesResult> {
  const doc = await safeLoadPdf(data);
  const total = doc.getPageCount();

  ctx?.onProgress?.(0.2, 'Analyzing document page tree...');

  // Sort descending so deletion doesn't shift earlier indices
  const zeroIndexed = options.pagesToRemove
    .filter((p) => p >= 1 && p <= total)
    .map((p) => p - 1)
    .sort((a, b) => b - a);

  const uniqueIndices = Array.from(new Set(zeroIndexed));

  if (uniqueIndices.length >= total) {
    throw new Error('Cannot remove all pages from a PDF. At least one page must remain.');
  }

  ctx?.onProgress?.(0.5, `Removing ${uniqueIndices.length} pages...`);

  for (const idx of uniqueIndices) {
    doc.removePage(idx);
  }

  ctx?.onProgress?.(0.8, 'Rebuilding document cross-reference table...');
  const resultBytes = await doc.save({ useObjectStreams: true });

  return {
    data: resultBytes,
    remainingPages: doc.getPageCount(),
    removedPagesCount: uniqueIndices.length,
  };
}
