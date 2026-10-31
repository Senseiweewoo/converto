import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface MergeInputFile {
  name: string;
  data: Uint8Array;
}

export interface MergeResult {
  data: Uint8Array;
  pageCount: number;
  warnings: string[];
}

export async function mergePdf(
  files: MergeInputFile[],
  ctx?: RunContext
): Promise<MergeResult> {
  if (files.length === 0) {
    throw new Error('At least one PDF file is required to merge.');
  }

  const mergedDoc = await PDFDocument.create();
  const warnings: string[] = [];
  let totalPages = 0;

  for (let i = 0; i < files.length; i++) {
    if (ctx?.signal?.aborted) {
      throw new Error('Operation was cancelled.');
    }

    const file = files[i];
    ctx?.onProgress?.((i / files.length) * 0.9, `Merging ${file.name}...`);

    const sourceDoc = await safeLoadPdf(file.data);
    const pageIndices = sourceDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(sourceDoc, pageIndices);

    for (const page of copiedPages) {
      mergedDoc.addPage(page);
      totalPages++;
    }
  }

  ctx?.onProgress?.(0.95, 'Finalizing merged document...');
  const mergedBytes = await mergedDoc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: mergedBytes,
    pageCount: totalPages,
    warnings,
  };
}
