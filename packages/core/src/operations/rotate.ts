import { degrees } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';
import { parsePageRanges } from './split';

export type RotateAngle = 90 | 180 | 270;
export type RotateTarget = 'all' | 'odd' | 'even' | string;

export interface RotateOptions {
  angle: RotateAngle;
  pages: RotateTarget;
}

export interface RotateResult {
  data: Uint8Array;
  rotatedCount: number;
  totalPages: number;
}

export async function rotatePdf(
  data: Uint8Array,
  options: RotateOptions,
  ctx?: RunContext
): Promise<RotateResult> {
  const doc = await safeLoadPdf(data);
  const totalPages = doc.getPageCount();
  const pages = doc.getPages();
  let rotatedCount = 0;

  let targetIndices = new Set<number>();
  if (options.pages === 'all') {
    for (let i = 0; i < totalPages; i++) targetIndices.add(i);
  } else if (options.pages === 'odd') {
    for (let i = 0; i < totalPages; i += 2) targetIndices.add(i);
  } else if (options.pages === 'even') {
    for (let i = 1; i < totalPages; i += 2) targetIndices.add(i);
  } else {
    // Custom range
    const ranges = parsePageRanges(options.pages, totalPages);
    for (const group of ranges) {
      for (const idx of group) targetIndices.add(idx);
    }
  }

  for (let i = 0; i < pages.length; i++) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
    ctx?.onProgress?.((i / pages.length) * 0.9, `Rotating page ${i + 1}...`);

    if (targetIndices.has(i)) {
      const page = pages[i];
      const currentAngle = page.getRotation().angle;
      const newAngle = (currentAngle + options.angle) % 360;
      page.setRotation(degrees(newAngle));
      rotatedCount++;
    }
  }

  ctx?.onProgress?.(0.95, 'Saving rotated document...');
  const rotatedBytes = await doc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: rotatedBytes,
    rotatedCount,
    totalPages,
  };
}
