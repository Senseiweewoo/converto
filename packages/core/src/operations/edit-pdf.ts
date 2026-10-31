import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface OverlayElement {
  type: 'text' | 'rectangle' | 'circle';
  pageNumber: number; // 1-indexed
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  colorHex?: string;
}

export interface EditPdfOptions {
  elements: OverlayElement[];
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

export async function editPdf(
  data: Uint8Array,
  options: EditPdfOptions,
  ctx?: RunContext
): Promise<Uint8Array> {
  const doc = await safeLoadPdf(data);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  ctx?.onProgress?.(0.3, 'Applying annotations, shapes, and text overlays...');

  for (const el of options.elements) {
    const pageIndex = el.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const color = el.colorHex ? hexToRgb(el.colorHex) : rgb(0, 0, 0);

    if (el.type === 'text' && el.text) {
      page.drawText(el.text, {
        x: el.x,
        y: el.y,
        size: el.fontSize || 12,
        font,
        color,
      });
    } else if (el.type === 'rectangle' && el.width && el.height) {
      page.drawRectangle({
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        color,
        opacity: 0.8,
      });
    } else if (el.type === 'circle' && el.width) {
      page.drawCircle({
        x: el.x,
        y: el.y,
        size: el.width / 2,
        color,
        opacity: 0.8,
      });
    }
  }

  ctx?.onProgress?.(0.85, 'Saving modified document...');
  return await doc.save({ useObjectStreams: true });
}
