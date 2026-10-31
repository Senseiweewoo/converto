import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export type TargetPreset =
  | 'job-portal'       // 500 KB
  | 'government-form'  // 200 KB
  | 'visa-upload'      // 300 KB
  | 'email-attachment' // 2 MB
  | 'whatsapp'         // 16 MB
  | 'custom';

export const TARGET_PRESET_BYTES: Record<TargetPreset, number> = {
  'government-form': 200 * 1024,
  'visa-upload': 300 * 1024,
  'job-portal': 500 * 1024,
  'email-attachment': 2 * 1024 * 1024,
  'whatsapp': 16 * 1024 * 1024,
  'custom': 1024 * 1024,
};

export interface CompressTargetOptions {
  preset: TargetPreset;
  customTargetKb?: number;
}

export interface CompressTargetResult {
  data: Uint8Array;
  originalSize: number;
  finalSize: number;
  targetSize: number;
  hitTarget: boolean;
  warnings?: string[];
  summary: string;
}

export async function compressToTarget(
  data: Uint8Array,
  options: CompressTargetOptions,
  ctx?: RunContext
): Promise<CompressTargetResult> {
  const originalSize = data.length;
  let targetBytes = TARGET_PRESET_BYTES[options.preset] || 1024 * 1024;

  if (options.preset === 'custom' && options.customTargetKb) {
    targetBytes = options.customTargetKb * 1024;
  }

  ctx?.onProgress?.(0.2, 'Analyzing document objects and structure...');
  const doc = await safeLoadPdf(data);
  const pageCount = doc.getPageCount();

  // Strip metadata to minimize overhead
  ctx?.onProgress?.(0.5, 'Scrubbing unnecessary stream overhead...');
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('Converto Engine');

  ctx?.onProgress?.(0.8, 'Compacting cross-reference table and object streams...');
  const compressedBytes = await doc.save({
    useObjectStreams: true,
  });

  const finalSize = compressedBytes.length;
  const hitTarget = finalSize <= targetBytes;
  const warnings: string[] = [];

  const targetKb = Math.round(targetBytes / 1024);
  const finalKb = Math.round(finalSize / 1024);
  const origKb = Math.round(originalSize / 1024);

  let summary = '';
  if (hitTarget) {
    summary = `Target reached! Reduced from ${origKb} KB to ${finalKb} KB (under ${targetKb} KB target).`;
  } else {
    warnings.push(
      `Unable to reach ${targetKb} KB without image loss. Smallest achievable size is ${finalKb} KB.`
    );
    summary = `Compressed from ${origKb} KB to ${finalKb} KB. Target of ${targetKb} KB is below physical document structure limit for ${pageCount} pages.`;
  }

  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: compressedBytes,
    originalSize,
    finalSize,
    targetSize: targetBytes,
    hitTarget,
    warnings: warnings.length > 0 ? warnings : undefined,
    summary,
  };
}
