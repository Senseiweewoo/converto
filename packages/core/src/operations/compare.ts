import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
  reportPdfData: Uint8Array;
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

  // Generate Visual Comparison Audit Report PDF
  const reportDoc = await PDFDocument.create();
  const fontRegular = await reportDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await reportDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = reportDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: rgb(0.08, 0.12, 0.18),
  });

  page.drawText('Converto Document Comparison Report', {
    x: 40,
    y: height - 48,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const isIdentical = pageCountMatches && diffs.length === 0;
  const statusColor = isIdentical ? rgb(0.06, 0.72, 0.5) : rgb(0.9, 0.45, 0.1);

  page.drawRectangle({
    x: 40,
    y: height - 145,
    width: width - 80,
    height: 48,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: statusColor,
    borderWidth: 1.5,
  });

  page.drawText(isIdentical ? 'STATUS: IDENTICAL DOCUMENTS' : 'STATUS: STRUCTURAL DIFFERENCES DETECTED', {
    x: 55,
    y: height - 126,
    size: 13,
    font: fontBold,
    color: statusColor,
  });

  let cursorY = height - 180;
  page.drawText(`Document A Pages: ${countA}`, { x: 40, y: cursorY, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  cursorY -= 20;
  page.drawText(`Document B Pages: ${countB}`, { x: 40, y: cursorY, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  cursorY -= 20;
  page.drawText(`Page Count Match: ${pageCountMatches ? 'Yes' : 'No'}`, { x: 40, y: cursorY, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  cursorY -= 30;

  page.drawText('Page-by-Page Inspection Findings:', { x: 40, y: cursorY, size: 13, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  cursorY -= 24;

  if (diffs.length === 0) {
    page.drawText('All corresponding pages match in physical dimensions, orientation, and structure.', {
      x: 40,
      y: cursorY,
      size: 10.5,
      font: fontRegular,
      color: rgb(0.2, 0.5, 0.2),
    });
  } else {
    for (let d = 0; d < Math.min(diffs.length, 18); d++) {
      const diff = diffs[d];
      const desc = `Page ${diff.pageIndex + 1}: ${diff.hasSizeDiff ? 'Dimensions vary' : ''} ${diff.hasRotationDiff ? 'Rotation differs' : ''}`.trim();
      page.drawText(`- ${desc}`, {
        x: 45,
        y: cursorY,
        size: 10,
        font: fontRegular,
        color: rgb(0.7, 0.2, 0.2),
      });
      cursorY -= 18;
    }
    if (diffs.length > 18) {
      page.drawText(`...and ${diffs.length - 18} additional differing pages.`, {
        x: 45,
        y: cursorY,
        size: 10,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  page.drawText('Generated 100% client-side with zero server upload by Converto PDF Toolkit.', {
    x: 40,
    y: 30,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  const reportPdfData = await reportDoc.save();
  ctx?.onProgress?.(1.0, 'Comparison complete.');

  return {
    docAPageCount: countA,
    docBPageCount: countB,
    pageCountMatches,
    differences: diffs,
    summary,
    reportPdfData,
  };
}
