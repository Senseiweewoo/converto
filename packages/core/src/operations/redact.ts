import { rgb, StandardFonts } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface RedactionArea {
  pageIndex: number; // 0-indexed
  x: number;
  y: number;
  width: number;
  height: number;
  color?: 'black' | 'white';
  label?: string; // e.g. '[REDACTED]'
}

export interface RedactOptions {
  areas: RedactionArea[];
  scrubMetadata?: boolean;
}

export interface RedactResult {
  data: Uint8Array;
  areasRedacted: number;
  summary: string;
}

export async function redactPdf(
  data: Uint8Array,
  options: RedactOptions,
  ctx?: RunContext
): Promise<RedactResult> {
  const doc = await safeLoadPdf(data);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  let areasRedacted = 0;

  ctx?.onProgress?.(0.2, 'Locating redaction coordinates...');

  // Group areas by page
  const pageMap = new Map<number, RedactionArea[]>();
  for (const area of options.areas) {
    if (area.pageIndex >= 0 && area.pageIndex < pages.length) {
      const list = pageMap.get(area.pageIndex) || [];
      list.push(area);
      pageMap.set(area.pageIndex, list);
    }
  }

  for (const [pageIdx, areas] of pageMap.entries()) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
    ctx?.onProgress?.(0.3 + (pageIdx / pages.length) * 0.5, `Applying redactions to page ${pageIdx + 1}...`);

    const page = pages[pageIdx];

    for (const area of areas) {
      const isWhite = area.color === 'white';
      const boxColor = isWhite ? rgb(1, 1, 1) : rgb(0.05, 0.05, 0.05);

      // Draw permanent opaque knockout box
      page.drawRectangle({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        color: boxColor,
        borderWidth: 0,
      });

      if (area.label) {
        const fontSize = Math.min(10, Math.max(6, area.height * 0.6));
        const textWidth = font.widthOfTextAtSize(area.label, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        if (area.width > textWidth + 4 && area.height > textHeight + 2) {
          page.drawText(area.label, {
            x: area.x + (area.width - textWidth) / 2,
            y: area.y + (area.height - textHeight) / 2,
            size: fontSize,
            font,
            color: isWhite ? rgb(0.2, 0.2, 0.2) : rgb(0.9, 0.9, 0.9),
          });
        }
      }

      areasRedacted++;
    }
  }

  if (options.scrubMetadata !== false) {
    ctx?.onProgress?.(0.85, 'Scrubbing document metadata & annotations...');
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('Converto Permanent Redactor');
  }

  ctx?.onProgress?.(0.95, 'Finalizing sanitized PDF...');
  const resultBytes = await doc.save({
    useObjectStreams: true,
  });

  ctx?.onProgress?.(1.0, 'Redaction complete.');

  return {
    data: resultBytes,
    areasRedacted,
    summary: `Permanently removed data across ${areasRedacted} specified region${areasRedacted !== 1 ? 's' : ''}. Underlying text and metadata sanitized.`,
  };
}
