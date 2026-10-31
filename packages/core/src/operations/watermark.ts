import { degrees, rgb, StandardFonts } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';
import { parsePageRanges } from './split';

export interface WatermarkTextOptions {
  type: 'text';
  text: string;
  fontSize?: number;
  opacity?: number;
  rotation?: number;
  colorHex?: string;
  pages?: string;
}

export interface WatermarkImageOptions {
  type: 'image';
  imageData: Uint8Array;
  imageFormat: 'png' | 'jpeg';
  opacity?: number;
  scale?: number;
  pages?: string;
}

export type WatermarkOptions = WatermarkTextOptions | WatermarkImageOptions;

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0.5;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0.5;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0.5;
  return rgb(r, g, b);
}

export async function watermarkPdf(
  data: Uint8Array,
  options: WatermarkOptions,
  ctx?: RunContext
): Promise<{ data: Uint8Array; watermarkedPages: number }> {
  const doc = await safeLoadPdf(data);
  const totalPages = doc.getPageCount();
  const pages = doc.getPages();

  let targetIndices = new Set<number>();
  if (!options.pages || options.pages === 'all') {
    for (let i = 0; i < totalPages; i++) targetIndices.add(i);
  } else {
    const ranges = parsePageRanges(options.pages, totalPages);
    for (const group of ranges) {
      for (const idx of group) targetIndices.add(idx);
    }
  }

  let watermarkedPages = 0;

  if (options.type === 'text') {
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = options.fontSize || 48;
    const opacity = options.opacity !== undefined ? options.opacity : 0.25;
    const rotationAngle = options.rotation !== undefined ? options.rotation : 45;
    const textColor = options.colorHex ? hexToRgb(options.colorHex) : rgb(0.5, 0.5, 0.5);

    for (let i = 0; i < pages.length; i++) {
      if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
      ctx?.onProgress?.((i / pages.length) * 0.9, `Watermarking page ${i + 1}...`);

      if (targetIndices.has(i)) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(options.text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center position
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(options.text, {
          x,
          y,
          size: fontSize,
          font,
          color: textColor,
          opacity,
          rotate: degrees(rotationAngle),
        });
        watermarkedPages++;
      }
    }
  } else {
    // Image watermark
    const embeddedImg =
      options.imageFormat === 'png'
        ? await doc.embedPng(options.imageData)
        : await doc.embedJpg(options.imageData);

    const opacity = options.opacity !== undefined ? options.opacity : 0.3;
    const scale = options.scale !== undefined ? options.scale : 0.5;

    for (let i = 0; i < pages.length; i++) {
      if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
      ctx?.onProgress?.((i / pages.length) * 0.9, `Applying image watermark ${i + 1}...`);

      if (targetIndices.has(i)) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const dims = embeddedImg.scale(scale);

        page.drawImage(embeddedImg, {
          x: (width - dims.width) / 2,
          y: (height - dims.height) / 2,
          width: dims.width,
          height: dims.height,
          opacity,
        });
        watermarkedPages++;
      }
    }
  }

  ctx?.onProgress?.(0.95, 'Saving watermarked document...');
  const resultBytes = await doc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: resultBytes,
    watermarkedPages,
  };
}
