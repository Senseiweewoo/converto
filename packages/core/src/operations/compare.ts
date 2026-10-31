import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface PageDiff {
  pageIndex: number;
  hasSizeDiff: boolean;
  hasRotationDiff: boolean;
  docASize: { width: number; height: number };
  docBSize?: { width: number; height: number };
  docARotation: number;
  docBRotation?: number;
}

export interface CompareResult {
  docAPageCount: number;
  docBPageCount: number;
  pageCountMatches: boolean;
  differences: PageDiff[];
  summary: string;
}

export async function comparePdfs(
  dataA: Uint8Array,
  dataB: Uint8Array,
  ctx?: RunContext
): Promise<CompareResult> {
  ctx?.onProgress?.(0.2, 'Loading Document A...');
  const docA = await safeLoadPdf(dataA);
  ctx?.onProgress?.(0.4, 'Loading Document B...');
  const docB = await safeLoadPdf(dataB);

  const countA = docA.getPageCount();
  const countB = docB.getPageCount();
  const maxPages = Math.max(countA, countB);
  const diffs: PageDiff[] = [];

  const pagesA = docA.getPages();
  const pagesB = docB.getPages();

  for (let i = 0; i < maxPages; i++) {
    const pA = i < countA ? pagesA[i] : null;
    const pB = i < countB ? pagesB[i] : null;

    if (!pA || !pB) {
      diffs.push({
        pageIndex: i,
        hasSizeDiff: true,
        hasRotationDiff: true,
        docASize: pA ? pA.getSize() : { width: 0, height: 0 },
        docBSize: pB ? pB.getSize() : undefined,
        docARotation: pA ? pA.getRotation().angle : 0,
        docBRotation: pB ? pB.getRotation().angle : undefined,
      });
      continue;
    }

    const sizeA = pA.getSize();
    const sizeB = pB.getSize();
    const rotA = pA.getRotation().angle;
    const rotB = pB.getRotation().angle;

    const hasSize = Math.abs(sizeA.width - sizeB.width) > 1 || Math.abs(sizeA.height - sizeB.height) > 1;
    const hasRot = rotA !== rotB;

    if (hasSize || hasRot) {
      diffs.push({
        pageIndex: i,
        hasSizeDiff: hasSize,
        hasRotationDiff: hasRot,
        docASize: sizeA,
        docBSize: sizeB,
        docARotation: rotA,
        docBRotation: rotB,
      });
    }
  }

  const pageCountMatches = countA === countB;
  let summary = '';
  if (pageCountMatches && diffs.length === 0) {
    summary = `Documents are structurally identical across all ${countA} pages.`;
  } else {
    summary = `Detected differences across ${diffs.length} page(s). (Doc A: ${countA} pages, Doc B: ${countB} pages).`;
  }

  ctx?.onProgress?.(1.0, 'Comparison complete.');

  return {
    docAPageCount: countA,
    docBPageCount: countB,
    pageCountMatches,
    differences: diffs,
    summary,
  };
}
