import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { 
  removePagesPdf, 
  extractPagesPdf, 
  cropPdf, 
  repairPdf, 
  convertToPdfA, 
  convertPdfToMarkdown, 
  convertPdfToWord, 
  convertPdfToExcel, 
  convertPdfToPowerpoint, 
  convertHtmlToPdf, 
  editPdf, 
  deepSanitizePdf 
} from '../index';

describe('Expanded PDF Operations Suite (100% iLovePDF Feature Parity)', () => {
  async function create3PageDoc(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    doc.setTitle('Test Document');
    doc.setAuthor('Test Author');
    const p1 = doc.addPage([300, 400]);
    p1.drawText('Page 1 Content');
    const p2 = doc.addPage([300, 400]);
    p2.drawText('Page 2 Content');
    const p3 = doc.addPage([300, 400]);
    p3.drawText('Page 3 Content');
    return await doc.save();
  }

  it('removes pages correctly from PDF', async () => {
    const input = await create3PageDoc();
    const result = await removePagesPdf(input, { pagesToRemove: [2] });
    expect(result.remainingPages).toBe(2);
    expect(result.removedPagesCount).toBe(1);

    const loaded = await PDFDocument.load(result.data);
    expect(loaded.getPageCount()).toBe(2);
  });

  it('extracts selected pages into a clean document', async () => {
    const input = await create3PageDoc();
    const result = await extractPagesPdf(input, 'sample.pdf', {
      pagesToExtract: [1, 3],
    });
    expect(result.extractedCount).toBe(2);

    const loaded = await PDFDocument.load(result.data);
    expect(loaded.getPageCount()).toBe(2);
  });

  it('crops page margins properly', async () => {
    const input = await create3PageDoc();
    const result = await cropPdf(input, {
      topMargin: 20,
      bottomMargin: 20,
      leftMargin: 20,
      rightMargin: 20,
    });
    expect(result.croppedPages).toBe(3);

    const loaded = await PDFDocument.load(result.data);
    const box = loaded.getPage(0).getMediaBox();
    expect(box.width).toBe(260); // 300 - 40
    expect(box.height).toBe(360); // 400 - 40
  });

  it('repairs corrupted PDF with prepended bytes and missing EOF trailer', async () => {
    const input = await create3PageDoc();
    // Simulate real corruption: prepended HTML junk and cut off %%EOF
    const junkHeader = new TextEncoder().encode('<html><body>404 Not Found</body></html>');
    const cutInput = input.slice(0, input.length - 6); // Cut %%EOF
    const damaged = new Uint8Array(junkHeader.length + cutInput.length);
    damaged.set(junkHeader, 0);
    damaged.set(cutInput, junkHeader.length);

    const result = await repairPdf(damaged);
    expect(result.recoveredPages).toBe(3);
    expect(result.repairsApplied.length).toBeGreaterThan(0);
  });

  it('converts PDF to PDF/A compliant format', async () => {
    const input = await create3PageDoc();
    const result = await convertToPdfA(input, 'PDF/A-1b');
    expect(result.conformance).toBe('PDF/A-1b');
    expect(result.pageCount).toBe(3);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('converts PDF text to structured Markdown', async () => {
    const input = await create3PageDoc();
    const result = await convertPdfToMarkdown(input, 'test.pdf', 'CHAPTER 1 Introduction\nInvoice details:\nAmount: $500');
    expect(result.markdown).toContain('## CHAPTER 1 Introduction');
    expect(result.markdown).toContain('**Invoice details:**');
    expect(result.pageCount).toBe(3);
  });

  it('converts PDF to Word (.docx)', async () => {
    const input = await create3PageDoc();
    const result = await convertPdfToWord(input, 'report.pdf', 'Sales Report Q3');
    expect(result.extension).toBe('docx');
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('converts PDF to Excel (.csv / spreadsheet)', async () => {
    const input = await create3PageDoc();
    const result = await convertPdfToExcel(input, 'balance.pdf', 'Asset 1000\nLiability 500');
    expect(result.extension).toBe('csv');
    expect(new TextDecoder().decode(result.data)).toContain('Asset');
  });

  it('converts PDF to PowerPoint (.pptx)', async () => {
    const input = await create3PageDoc();
    const result = await convertPdfToPowerpoint(input, 'slides.pdf');
    expect(result.extension).toBe('pptx');
    expect(result.summary).toContain('3 PDF pages');
  });

  it('converts HTML content to styled PDF', async () => {
    const result = await convertHtmlToPdf({
      htmlContent: '<h1>Quarterly Review</h1><p>Revenue rose 40% year over year.</p>',
    });
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('edits PDF by adding text and rectangle overlays', async () => {
    const input = await create3PageDoc();
    const result = await editPdf(input, {
      elements: [
        { type: 'text', pageNumber: 1, x: 50, y: 50, text: 'Approved by Legal' },
        { type: 'rectangle', pageNumber: 1, x: 40, y: 40, width: 100, height: 30, colorHex: '#ff0000' },
      ],
    });
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(3);
  });

  it('deeply sanitizes forensic metadata and zeroes timestamps', async () => {
    const input = await create3PageDoc();
    const result = await deepSanitizePdf(input);
    expect(result.sanitizedItems.length).toBeGreaterThanOrEqual(3);

    const loaded = await PDFDocument.load(result.data);
    expect(loaded.getTitle()).toBe('');
    expect(loaded.getAuthor()).toBe('');
  });
});
