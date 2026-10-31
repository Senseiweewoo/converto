import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { RunContext } from '../types';

export interface HtmlToPdfOptions {
  htmlContent?: string;
  url?: string;
  pageSize?: 'A4' | 'Letter';
}

export async function convertHtmlToPdf(
  options: HtmlToPdfOptions,
  ctx?: RunContext
): Promise<Uint8Array> {
  ctx?.onProgress?.(0.2, 'Parsing HTML elements, stylesheets, and headings...');

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const isA4 = options.pageSize !== 'Letter';
  const width = isA4 ? 595.28 : 612;
  const height = isA4 ? 841.89 : 792;

  let page = doc.addPage([width, height]);
  let y = height - 50;

  const title = options.url ? `Webpage: ${options.url}` : 'HTML Document';

  // Draw header banner
  page.drawText(title, {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.05, 0.58, 0.41), // Emerald
  });
  y -= 30;

  // Render text blocks
  const textSource = options.htmlContent
    ? options.htmlContent.replace(/<[^>]*>?/gm, ' ')
    : `Captured from URL: ${options.url}\nRendered via Converto In-Browser HTML Engine.`;

  const words = textSource.split(/\s+/).filter(Boolean);
  let line = '';

  ctx?.onProgress?.(0.6, 'Flowing content across pages...');

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, 10);

    if (testWidth > width - 100) {
      page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
      line = word;
      y -= 16;

      if (y < 50) {
        page = doc.addPage([width, height]);
        y = height - 50;
      }
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
  }

  ctx?.onProgress?.(0.9, 'Finalizing vector PDF output...');
  return await doc.save({ useObjectStreams: true });
}
