import { PDFDocument, PageSizes } from 'pdf-lib';
import { RunContext } from '../types';

export interface ImageInput {
  name: string;
  data: Uint8Array;
  type: string; // 'image/jpeg', 'image/png', etc.
}

export interface ImagesToPdfOptions {
  pageSize?: 'A4' | 'LETTER' | 'FIT_IMAGE';
  orientation?: 'portrait' | 'landscape' | 'auto';
  margin?: number; // points (72 points = 1 inch)
}

export async function imagesToPdf(
  images: ImageInput[],
  options: ImagesToPdfOptions = {},
  ctx?: RunContext
): Promise<{ data: Uint8Array; pageCount: number }> {
  if (images.length === 0) {
    throw new Error('Please select at least one image to convert to PDF.');
  }

  const doc = await PDFDocument.create();
  const margin = options.margin !== undefined ? options.margin : 20;

  for (let i = 0; i < images.length; i++) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');
    const img = images[i];
    ctx?.onProgress?.((i / images.length) * 0.9, `Processing image ${i + 1} of ${images.length}...`);

    let embeddedImg;
    const isPng = img.type.includes('png') || img.name.toLowerCase().endsWith('.png');
    if (isPng) {
      embeddedImg = await doc.embedPng(img.data);
    } else {
      // JPEG, JPG, WEBP fallback
      embeddedImg = await doc.embedJpg(img.data);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let targetWidth: number;
    let targetHeight: number;

    if (options.pageSize === 'FIT_IMAGE') {
      targetWidth = imgWidth + margin * 2;
      targetHeight = imgHeight + margin * 2;
    } else if (options.pageSize === 'LETTER') {
      const isLandscape =
        options.orientation === 'landscape' ||
        (options.orientation === 'auto' && imgWidth > imgHeight);
      targetWidth = isLandscape ? PageSizes.Letter[1] : PageSizes.Letter[0];
      targetHeight = isLandscape ? PageSizes.Letter[0] : PageSizes.Letter[1];
    } else {
      // Default A4
      const isLandscape =
        options.orientation === 'landscape' ||
        (options.orientation === 'auto' && imgWidth > imgHeight);
      targetWidth = isLandscape ? PageSizes.A4[1] : PageSizes.A4[0];
      targetHeight = isLandscape ? PageSizes.A4[0] : PageSizes.A4[1];
    }

    const page = doc.addPage([targetWidth, targetHeight]);

    // Compute bounding box that preserves aspect ratio within margins
    const availableWidth = targetWidth - margin * 2;
    const availableHeight = targetHeight - margin * 2;

    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;

    const x = margin + (availableWidth - renderWidth) / 2;
    const y = margin + (availableHeight - renderHeight) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: renderWidth,
      height: renderHeight,
    });
  }

  ctx?.onProgress?.(0.95, 'Compiling PDF document...');
  const pdfBytes = await doc.save();
  ctx?.onProgress?.(1.0, 'Done');

  return {
    data: pdfBytes,
    pageCount: images.length,
  };
}
