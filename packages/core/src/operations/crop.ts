import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface CropOptions {
  topMargin: number; // in points
  bottomMargin: number;
  leftMargin: number;
  rightMargin: number;
  pages?: 'all' | number[];
}

export interface CropResult {
  data: Uint8Array;
  croppedPages: number;
}

export async function cropPdf(
  data: Uint8Array,
  options: CropOptions,
  ctx?: RunContext
): Promise<CropResult> {
  const doc = await safeLoadPdf(data);
  const total = doc.getPageCount();
  const pages = doc.getPages();

  ctx?.onProgress?.(0.2, 'Calculating crop boundaries...');

  const targetIndices = options.pages === 'all' || !options.pages
    ? Array.from({ length: total }, (_, i) => i)
    : options.pages.map((p) => p - 1).filter((p) => p >= 0 && p < total);

  let croppedCount = 0;

  for (const idx of targetIndices) {
    const page = pages[idx];
    const { x, y, width, height } = page.getMediaBox();

    const newX = x + (options.leftMargin || 0);
    const newY = y + (options.bottomMargin || 0);
    const newWidth = Math.max(50, width - (options.leftMargin || 0) - (options.rightMargin || 0));
    const newHeight = Math.max(50, height - (options.topMargin || 0) - (options.bottomMargin || 0));

    // Update MediaBox and CropBox
    page.setMediaBox(newX, newY, newWidth, newHeight);
    page.setCropBox(newX, newY, newWidth, newHeight);
    croppedCount++;
  }

  ctx?.onProgress?.(0.8, 'Applying crop transformations...');
  const resultBytes = await doc.save({ useObjectStreams: true });

  return {
    data: resultBytes,
    croppedPages: croppedCount,
  };
}
