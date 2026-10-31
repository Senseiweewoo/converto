import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export type SplitMode = 'ranges' | 'every-n' | 'extract-all';

export interface SplitOptions {
  mode: SplitMode;
  ranges?: string; // e.g. "1-3, 5, 7-10"
  everyN?: number; // e.g. 2
  mergeRangesIntoOne?: boolean; // If true, all parsed ranges are combined into a single file
}

export interface SplitResultFile {
  name: string;
  data: Uint8Array;
  pageCount: number;
}

export interface SplitResult {
  files: SplitResultFile[];
  summary: string;
}

export function parsePageRanges(rangesStr: string, totalPages: number): number[][] {
  const parts = rangesStr.split(',').map((p) => p.trim()).filter(Boolean);
  const result: number[][] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) continue;
      
      const realStart = Math.max(1, Math.min(start, end));
      const realEnd = Math.min(totalPages, Math.max(start, end));

      const range: number[] = [];
      for (let p = realStart; p <= realEnd; p++) {
        range.push(p - 1); // 0-indexed for pdf-lib
      }
      if (range.length > 0) result.push(range);
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        result.push([page - 1]);
      }
    }
  }

  return result;
}

export async function splitPdf(
  data: Uint8Array,
  baseFilename: string,
  options: SplitOptions,
  ctx?: RunContext
): Promise<SplitResult> {
  const sourceDoc = await safeLoadPdf(data);
  const totalPages = sourceDoc.getPageCount();
  const nameWithoutExt = baseFilename.replace(/\.pdf$/i, '');
  const outputFiles: SplitResultFile[] = [];

  if (options.mode === 'extract-all') {
    for (let i = 0; i < totalPages; i++) {
      if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
      ctx?.onProgress?.((i / totalPages) * 0.9, `Extracting page ${i + 1} of ${totalPages}...`);

      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(sourceDoc, [i]);
      singleDoc.addPage(copiedPage);
      const pdfBytes = await singleDoc.save();

      outputFiles.push({
        name: `${nameWithoutExt}_page_${i + 1}.pdf`,
        data: pdfBytes,
        pageCount: 1,
      });
    }
  } else if (options.mode === 'every-n') {
    const step = Math.max(1, options.everyN || 1);
    let chunkIndex = 1;

    for (let i = 0; i < totalPages; i += step) {
      if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
      ctx?.onProgress?.((i / totalPages) * 0.9, `Splitting section ${chunkIndex}...`);

      const end = Math.min(i + step, totalPages);
      const indices: number[] = [];
      for (let idx = i; idx < end; idx++) indices.push(idx);

      const chunkDoc = await PDFDocument.create();
      const copied = await chunkDoc.copyPages(sourceDoc, indices);
      copied.forEach((p) => chunkDoc.addPage(p));
      const pdfBytes = await chunkDoc.save();

      outputFiles.push({
        name: `${nameWithoutExt}_part_${chunkIndex}.pdf`,
        data: pdfBytes,
        pageCount: indices.length,
      });
      chunkIndex++;
    }
  } else {
    // Mode: ranges
    const rangeGroups = parsePageRanges(options.ranges || '1', totalPages);
    if (rangeGroups.length === 0) {
      throw new Error(`Invalid page range "${options.ranges}". Document has ${totalPages} pages.`);
    }

    if (options.mergeRangesIntoOne) {
      const targetDoc = await PDFDocument.create();
      let count = 0;
      for (const group of rangeGroups) {
        if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
        const copied = await targetDoc.copyPages(sourceDoc, group);
        copied.forEach((p) => {
          targetDoc.addPage(p);
          count++;
        });
      }
      const pdfBytes = await targetDoc.save();
      outputFiles.push({
        name: `${nameWithoutExt}_extracted.pdf`,
        data: pdfBytes,
        pageCount: count,
      });
    } else {
      for (let r = 0; r < rangeGroups.length; r++) {
        if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
        const group = rangeGroups[r];
        const rangeDoc = await PDFDocument.create();
        const copied = await rangeDoc.copyPages(sourceDoc, group);
        copied.forEach((p) => rangeDoc.addPage(p));
        const pdfBytes = await rangeDoc.save();

        outputFiles.push({
          name: `${nameWithoutExt}_range_${r + 1}.pdf`,
          data: pdfBytes,
          pageCount: group.length,
        });
      }
    }
  }

  ctx?.onProgress?.(1.0, 'Done');
  return {
    files: outputFiles,
    summary: `Successfully split into ${outputFiles.length} file${outputFiles.length > 1 ? 's' : ''}.`,
  };
}
