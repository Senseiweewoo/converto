import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { unzipSync } from 'fflate';
import { RunContext } from '../types';

export interface PptxToPdfResult {
  data: Uint8Array;
  slideCount: number;
}

export function extractSlidesFromPptx(data: Uint8Array): { slideNumber: number; texts: string[] }[] {
  const slides: { slideNumber: number; texts: string[] }[] = [];

  try {
    const unzipped = unzipSync(data);

    // Look for all ppt/slides/slideX.xml files
    const slideKeys = Object.keys(unzipped)
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10);
        const numB = parseInt(b.replace(/\D/g, ''), 10);
        return numA - numB;
      });

    for (let i = 0; i < slideKeys.length; i++) {
      const key = slideKeys[i];
      const xmlBytes = unzipped[key];
      const xmlStr = new TextDecoder('utf-8').decode(xmlBytes);

      const texts: string[] = [];
      const tRegex = /<a:t(?:\s+[^>]*)?>([^<]*)<\/a:t>/g;
      let match: RegExpExecArray | null;

      while ((match = tRegex.exec(xmlStr)) !== null) {
        const str = match[1].trim();
        if (str) texts.push(str);
      }

      slides.push({
        slideNumber: i + 1,
        texts: texts.length > 0 ? texts : [`Slide ${i + 1}`],
      });
    }
  } catch {
    // Plain text / fallback
    const textStr = new TextDecoder('utf-8').decode(data);
    const cleaned = textStr.replace(/[^\x20-\x7E\n\r]/g, ' ');
    const chunks = cleaned.split(/\n{2,}/).filter((c) => c.trim().length > 5);

    for (let i = 0; i < chunks.length; i++) {
      slides.push({
        slideNumber: i + 1,
        texts: chunks[i].split('\n').map((l) => l.trim()).filter(Boolean),
      });
    }
  }

  if (slides.length === 0) {
    slides.push({
      slideNumber: 1,
      texts: ['Slide Presentation', 'Converted with Converto Local Engine'],
    });
  }

  return slides;
}

export async function convertPptxToPdf(
  data: Uint8Array,
  filename: string,
  ctx?: RunContext
): Promise<PptxToPdfResult> {
  ctx?.onProgress?.(0.2, 'Extracting presentation slide structure...');

  const slides = extractSlidesFromPptx(data);

  ctx?.onProgress?.(0.5, `Rendering ${slides.length} slides into 16:9 vector PDF pages...`);

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Standard 16:9 Widescreen slide format (960 x 540 points)
  const slideWidth = 960;
  const slideHeight = 540;
  const margin = 50;

  for (let i = 0; i < slides.length; i++) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');

    const slide = slides[i];
    const page = doc.addPage([slideWidth, slideHeight]);

    // Top decorative brand accent
    page.drawRectangle({
      x: 0,
      y: slideHeight - 8,
      width: slideWidth,
      height: 8,
      color: rgb(0.05, 0.58, 0.41), // Converto Emerald
    });

    let y = slideHeight - margin - 20;

    const titleText = slide.texts[0] || `Slide ${slide.slideNumber}`;
    page.drawText(titleText, {
      x: margin,
      y,
      size: 24,
      font: fontBold,
      color: rgb(0.1, 0.12, 0.16),
    });
    y -= 40;

    // Slide Body Items
    const bodyItems = slide.texts.slice(1);
    for (const item of bodyItems) {
      page.drawText(`•  ${item}`, {
        x: margin + 15,
        y,
        size: 14,
        font: fontRegular,
        color: rgb(0.2, 0.22, 0.26),
      });
      y -= 26;
      if (y < margin + 30) break;
    }

    // Slide number badge
    const badgeText = `${i + 1} / ${slides.length}`;
    page.drawText(badgeText, {
      x: slideWidth - margin - 40,
      y: margin / 2,
      size: 10,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  ctx?.onProgress?.(0.9, 'Finalizing slide deck PDF...');
  const pdfBytes = await doc.save({ useObjectStreams: true });

  return {
    data: pdfBytes,
    slideCount: slides.length,
  };
}
