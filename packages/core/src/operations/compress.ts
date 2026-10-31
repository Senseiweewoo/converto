import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export type CompressionPreset = 'basic' | 'strong' | 'extreme';

export interface CompressOptions {
  preset: CompressionPreset;
  removeMetadata?: boolean;
}

export interface CompressResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export async function compressPdf(
  data: Uint8Array,
  options: CompressOptions = { preset: 'basic' },
  ctx?: RunContext
): Promise<CompressResult> {
  const originalSize = data.length;
  ctx?.onProgress?.(0.2, 'Analyzing document objects and structure...');

  const doc = await safeLoadPdf(data);

  if (options.removeMetadata) {
    ctx?.onProgress?.(0.4, 'Scrubbing document metadata...');
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('Converto Local Engine');
    doc.setCreator('Converto');
  }

  ctx?.onProgress?.(0.6, `Applying ${options.preset} stream compaction...`);

  if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');

  // Save with maximum object stream compression
  const compressedBytes = await doc.save({
    useObjectStreams: true,
  });

  const compressedSize = compressedBytes.length;
  const reductionPercentage = Math.max(
    0,
    Math.round(((originalSize - compressedSize) / originalSize) * 100)
  );

  ctx?.onProgress?.(1.0, 'Compression complete.');

  return {
    data: compressedBytes,
    originalSize,
    compressedSize,
    reductionPercentage,
  };
}
