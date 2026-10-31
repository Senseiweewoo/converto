import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface OrganizePageItem {
  id: string;
  sourcePageIndex?: number; // 0-indexed page in original document
  rotation?: number; // degrees: 0, 90, 180, 270
  isBlank?: boolean;
}

export interface OrganizeOptions {
  pages: OrganizePageItem[];
}

export async function organizePdf(
  data: Uint8Array,
  options: OrganizeOptions,
  ctx?: RunContext
): Promise<{ data: Uint8Array; pageCount: number }> {
  if (options.pages.length === 0) {
    throw new Error('At least one page must remain in the organized document.');
  }

  const sourceDoc = await safeLoadPdf(data);
  const newDoc = await PDFDocument.create();

  // Find all distinct source pages we need to copy
  const neededSourceIndices = options.pages
    .filter((p) => !p.isBlank && p.sourcePageIndex !== undefined)
    .map((p) => p.sourcePageIndex as number);

  // Group copy for performance
  const uniqueIndices = Array.from(new Set(neededSourceIndices));
  const copiedMap = new Map<number, any>();

  if (uniqueIndices.length > 0) {
    ctx?.onProgress?.(0.2, 'Copying page structures...');
    const copiedPages = await newDoc.copyPages(sourceDoc, uniqueIndices);
    uniqueIndices.forEach((idx, i) => {
      copiedMap.set(idx, copiedPages[i]);
    });
  }

  const totalSteps = options.pages.length;
  for (let i = 0; i < totalSteps; i++) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
    ctx?.onProgress?.(0.3 + (i / totalSteps) * 0.6, `Assembling page ${i + 1} of ${totalSteps}...`);

    const item = options.pages[i];

    if (item.isBlank) {
      const blankPage = newDoc.addPage(PageSizes.A4);
      if (item.rotation) {
        blankPage.setRotation(degrees(item.rotation % 360));
      }
    } else if (item.sourcePageIndex !== undefined) {
      // Need a fresh copy if duplicated, or copy page
      const [copiedPage] = await newDoc.copyPages(sourceDoc, [item.sourcePageIndex]);
      if (item.rotation) {
        const currentRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
      }
      newDoc.addPage(copiedPage);
    }
  }

  ctx?.onProgress?.(0.95, 'Saving organized PDF...');
  const resultBytes = await newDoc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: resultBytes,
    pageCount: options.pages.length,
  };
}
