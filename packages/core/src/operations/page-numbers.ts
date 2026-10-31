import { rgb, StandardFonts } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';
import { parsePageRanges } from './split';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat = 'page-only' | 'page-of-total' | 'slash';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize?: number;
  margin?: number;
  startFrom?: number;
  pages?: 'all' | 'exclude-first' | string;
}

export async function addPageNumbers(
  data: Uint8Array,
  options: PageNumberOptions,
  ctx?: RunContext
): Promise<{ data: Uint8Array; labeledPages: number }> {
  const doc = await safeLoadPdf(data);
  const totalPages = doc.getPageCount();
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  
  const fontSize = options.fontSize || 10;
  const margin = options.margin || 25;
  const startFrom = options.startFrom !== undefined ? options.startFrom : 1;

  let targetIndices = new Set<number>();
  if (!options.pages || options.pages === 'all') {
    for (let i = 0; i < totalPages; i++) targetIndices.add(i);
  } else if (options.pages === 'exclude-first') {
    for (let i = 1; i < totalPages; i++) targetIndices.add(i);
  } else {
    const ranges = parsePageRanges(options.pages, totalPages);
    for (const group of ranges) {
      for (const idx of group) targetIndices.add(idx);
    }
  }

  let labeledPages = 0;

  for (let i = 0; i < pages.length; i++) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
    ctx?.onProgress?.((i / pages.length) * 0.9, `Numbering page ${i + 1}...`);

    if (targetIndices.has(i)) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const currentNumber = startFrom + labeledPages;

      let text = `${currentNumber}`;
      if (options.format === 'page-of-total') {
        text = `Page ${currentNumber} of ${startFrom + targetIndices.size - 1}`;
      } else if (options.format === 'slash') {
        text = `${currentNumber} / ${startFrom + targetIndices.size - 1}`;
      }

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = margin;
      let y = margin;

      // Position calculations
      if (options.position.includes('center')) {
        x = (width - textWidth) / 2;
      } else if (options.position.includes('right')) {
        x = width - margin - textWidth;
      } else {
        x = margin;
      }

      if (options.position.startsWith('top')) {
        y = height - margin - textHeight;
      } else {
        y = margin;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      labeledPages++;
    }
  }

  ctx?.onProgress?.(0.95, 'Saving document...');
  const resultBytes = await doc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: resultBytes,
    labeledPages,
  };
}
