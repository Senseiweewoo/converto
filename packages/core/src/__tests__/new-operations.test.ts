import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { PDFDocument, rgb } from 'pdf-lib';
import { convertPptxToPdf, extractSlidesFromPptx } from '../operations/pptx-to-pdf';
import { convertPdfToImages } from '../operations/pdf-to-images';
import { ocrPdf, extractRawTextFromPdfBuffer } from '../operations/ocr-pdf';

describe('New Operations: PPTX to PDF, PDF to Images, OCR & Text Extraction', () => {
  function createMockPptx(slides: { title: string; bullets: string[] }[]): Uint8Array {
    const zipObj: Record<string, Uint8Array> = {
      '[Content_Types].xml': new TextEncoder().encode('<Types></Types>'),
    };

    slides.forEach((slide, idx) => {
      const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>${slide.title}</a:t></a:r></a:p>
          ${slide.bullets.map((b) => `<a:p><a:r><a:t>${b}</a:t></a:r></a:p>`).join('\n')}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
      zipObj[`ppt/slides/slide${idx + 1}.xml`] = new TextEncoder().encode(slideXml);
    });

    return zipSync(zipObj);
  }

  async function createSamplePdf(text: string): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 400]);
    page.drawText(text, { x: 50, y: 350, size: 14 });
    return doc.save();
  }

  it('converts PPTX slides into 16:9 vector PDF pages', async () => {
    const pptxBytes = createMockPptx([
      { title: 'Project Kickoff', bullets: ['Scope Definition', 'Timeline & Milestones'] },
      { title: 'System Architecture', bullets: ['Client-side Workers', 'Zero-knowledge Storage'] },
    ]);

    const extracted = extractSlidesFromPptx(pptxBytes);
    expect(extracted).toHaveLength(2);
    expect(extracted[0].texts[0]).toBe('Project Kickoff');
    expect(extracted[0].texts[1]).toBe('Scope Definition');

    const result = await convertPptxToPdf(pptxBytes, 'presentation.pptx');
    expect(result.slideCount).toBe(2);
    expect(result.data.length).toBeGreaterThan(100);

    const doc = await PDFDocument.load(result.data);
    expect(doc.getPageCount()).toBe(2);
    const firstPage = doc.getPage(0);
    expect(firstPage.getWidth()).toBe(960);
    expect(firstPage.getHeight()).toBe(540);
  });

  it('extracts images or page representations from PDF via convertPdfToImages', async () => {
    const samplePdf = await createSamplePdf('Sample visual document');
    const result = await convertPdfToImages(samplePdf, 'sample.pdf', { format: 'png' });

    expect(result.images.length).toBeGreaterThanOrEqual(1);
    expect(result.images[0].mimeType).toBe('image/png');
    expect(result.images[0].data.length).toBeGreaterThan(0);
  });

  it('extracts raw text literals and runs OCR on PDF', async () => {
    const samplePdf = await createSamplePdf('Confidential Quarterly Earnings');
    const rawText = extractRawTextFromPdfBuffer(samplePdf);
    expect(rawText).toContain('Confidential Quarterly Earnings');

    const ocrResult = await ocrPdf(samplePdf, 'earnings.pdf');
    expect(ocrResult.wordCount).toBeGreaterThanOrEqual(3);
    expect(ocrResult.text).toContain('Confidential Quarterly Earnings');
    expect(ocrResult.pageCount).toBe(1);

    const doc = await PDFDocument.load(ocrResult.data);
    expect(doc.getPageCount()).toBe(1);
  });
});
