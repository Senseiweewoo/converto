import { rgb, StandardFonts } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface SignaturePlacement {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignPdfOptions {
  signaturePngData?: Uint8Array; // PNG bytes of drawn or uploaded signature
  typedSignatureText?: string;   // Typed signature text
  placementMode: 'coordinates' | 'sign-all-pages' | 'initial-every-page';
  placements?: SignaturePlacement[];
}

export async function signPdf(
  data: Uint8Array,
  options: SignPdfOptions,
  ctx?: RunContext
): Promise<{ data: Uint8Array; signedPagesCount: number }> {
  const doc = await safeLoadPdf(data);
  const pages = doc.getPages();
  let signedPagesCount = 0;

  ctx?.onProgress?.(0.2, 'Preparing signature...');

  let embeddedImg: any = null;
  if (options.signaturePngData) {
    embeddedImg = await doc.embedPng(options.signaturePngData);
  }

  const font = await doc.embedFont(StandardFonts.TimesRomanItalic);

  if (options.placementMode === 'sign-all-pages' || options.placementMode === 'initial-every-page') {
    const isInitial = options.placementMode === 'initial-every-page';
    const sigWidth = isInitial ? 60 : 120;
    const sigHeight = isInitial ? 30 : 50;

    for (let i = 0; i < pages.length; i++) {
      if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
      ctx?.onProgress?.(0.3 + (i / pages.length) * 0.6, `Signing page ${i + 1}...`);

      const page = pages[i];
      const { width } = page.getSize();
      const x = width - sigWidth - 30; // bottom right
      const y = 30;

      if (embeddedImg) {
        page.drawImage(embeddedImg, {
          x,
          y,
          width: sigWidth,
          height: sigHeight,
        });
      } else if (options.typedSignatureText) {
        page.drawText(options.typedSignatureText, {
          x,
          y: y + 10,
          size: isInitial ? 14 : 20,
          font,
          color: rgb(0.05, 0.1, 0.4), // Classic blue ink
        });
      }
      signedPagesCount++;
    }
  } else if (options.placements && options.placements.length > 0) {
    // Specific coordinates
    for (let idx = 0; idx < options.placements.length; idx++) {
      if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
      const p = options.placements[idx];
      if (p.pageIndex >= 0 && p.pageIndex < pages.length) {
        const page = pages[p.pageIndex];

        if (embeddedImg) {
          page.drawImage(embeddedImg, {
            x: p.x,
            y: p.y,
            width: p.width,
            height: p.height,
          });
        } else if (options.typedSignatureText) {
          page.drawText(options.typedSignatureText, {
            x: p.x,
            y: p.y,
            size: Math.min(24, p.height * 0.7),
            font,
            color: rgb(0.05, 0.1, 0.4),
          });
        }
        signedPagesCount++;
      }
    }
  }

  ctx?.onProgress?.(0.95, 'Saving signed PDF...');
  const resultBytes = await doc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: resultBytes,
    signedPagesCount,
  };
}
