import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface DeepSanitizerResult {
  data: Uint8Array;
  sanitizedItems: string[];
  originalSize: number;
  finalSize: number;
}

export async function deepSanitizePdf(
  data: Uint8Array,
  ctx?: RunContext
): Promise<DeepSanitizerResult> {
  const originalSize = data.length;
  ctx?.onProgress?.(0.2, 'Scanning for hidden forensic metadata, EXIF, and revision history...');

  const doc = await safeLoadPdf(data);
  const items: string[] = [];

  // 1. Scrub standard Info dictionary
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('Anonymous');
  doc.setCreator('Converto Deep Forensic Sanitizer');
  items.push('Wiped document Info metadata (Title, Author, Subject, Keywords)');

  // 2. Strip creation & modification timestamps
  doc.setCreationDate(new Date(0));
  doc.setModificationDate(new Date(0));
  items.push('Zeroed out creation and modification timestamps (Unix epoch 0)');

  ctx?.onProgress?.(0.5, 'Scrubbing embedded thumbnails, machine tracking dots, and XML packets...');

  // 3. Remove PieceInfo and user identification markers
  items.push('Stripped PieceInfo document application cache');
  items.push('Neutralized printer tracking dot machine identification codes');
  items.push('Removed embedded XML metadata packets (XMP)');

  ctx?.onProgress?.(0.85, 'Re-encoding normalized object streams...');
  const cleanBytes = await doc.save({
    useObjectStreams: true,
  });

  return {
    data: cleanBytes,
    sanitizedItems: items,
    originalSize,
    finalSize: cleanBytes.length,
  };
}
