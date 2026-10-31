import { describe, it, expect } from 'vitest';
import {
  mergePdf,
  splitPdf,
  rotatePdf,
  addPageNumbers,
  watermarkPdf,
  imagesToPdf,
  compressPdf,
  organizePdf,
  safeLoadPdf,
  CorruptPdfError,
  PasswordRequiredError,
} from '../index';
import { createSamplePdf, createSamplePng } from './helpers';

describe('Converto Core Engine Operations', () => {
  it('merges multiple PDF files in order', async () => {
    const pdf1 = await createSamplePdf(2, 'Doc A');
    const pdf2 = await createSamplePdf(3, 'Doc B');

    const result = await mergePdf([
      { name: 'doc1.pdf', data: pdf1 },
      { name: 'doc2.pdf', data: pdf2 },
    ]);

    expect(result.pageCount).toBe(5);
    expect(result.data.length).toBeGreaterThan(0);

    const verifiedDoc = await safeLoadPdf(result.data);
    expect(verifiedDoc.getPageCount()).toBe(5);
  });

  it('splits PDF by page ranges', async () => {
    const pdf = await createSamplePdf(6, 'Split Me');

    // Split ranges "1-2, 4-5"
    const result = await splitPdf(pdf, 'sample.pdf', {
      mode: 'ranges',
      ranges: '1-2, 4-5',
    });

    expect(result.files.length).toBe(2);
    expect(result.files[0].pageCount).toBe(2);
    expect(result.files[1].pageCount).toBe(2);

    const doc1 = await safeLoadPdf(result.files[0].data);
    expect(doc1.getPageCount()).toBe(2);
  });

  it('splits PDF every N pages', async () => {
    const pdf = await createSamplePdf(5, 'Every 2');

    const result = await splitPdf(pdf, 'document.pdf', {
      mode: 'every-n',
      everyN: 2,
    });

    // 5 pages split every 2 pages -> 3 files (2, 2, 1)
    expect(result.files.length).toBe(3);
    expect(result.files[0].pageCount).toBe(2);
    expect(result.files[1].pageCount).toBe(2);
    expect(result.files[2].pageCount).toBe(1);
  });

  it('rotates PDF pages correctly', async () => {
    const pdf = await createSamplePdf(4, 'Rotate Me');

    const result = await rotatePdf(pdf, {
      angle: 90,
      pages: 'all',
    });

    expect(result.rotatedCount).toBe(4);
    const doc = await safeLoadPdf(result.data);
    const pages = doc.getPages();
    expect(pages[0].getRotation().angle).toBe(90);
  });

  it('adds header/footer page numbers', async () => {
    const pdf = await createSamplePdf(3, 'Numbered Doc');

    const result = await addPageNumbers(pdf, {
      position: 'bottom-center',
      format: 'page-of-total',
      fontSize: 10,
    });

    expect(result.labeledPages).toBe(3);
    const doc = await safeLoadPdf(result.data);
    expect(doc.getPageCount()).toBe(3);
  });

  it('applies text watermark with specified rotation and opacity', async () => {
    const pdf = await createSamplePdf(2, 'Watermarked Doc');

    const result = await watermarkPdf(pdf, {
      type: 'text',
      text: 'STRICTLY CONFIDENTIAL',
      fontSize: 36,
      opacity: 0.3,
      rotation: 45,
    });

    expect(result.watermarkedPages).toBe(2);
    const doc = await safeLoadPdf(result.data);
    expect(doc.getPageCount()).toBe(2);
  });

  it('converts images to a PDF document', async () => {
    const png = createSamplePng();

    const result = await imagesToPdf(
      [
        { name: 'photo1.png', data: png, type: 'image/png' },
        { name: 'photo2.png', data: png, type: 'image/png' },
      ],
      { pageSize: 'A4', orientation: 'auto' }
    );

    expect(result.pageCount).toBe(2);
    const doc = await safeLoadPdf(result.data);
    expect(doc.getPageCount()).toBe(2);
  });

  it('compresses PDF and optimizes object streams', async () => {
    const pdf = await createSamplePdf(3, 'Compress Test');

    const result = await compressPdf(pdf, {
      preset: 'basic',
      removeMetadata: true,
    });

    expect(result.compressedSize).toBeGreaterThan(0);
    const doc = await safeLoadPdf(result.data);
    expect(doc.getPageCount()).toBe(3);
  });

  it('organizes pages: reorder, duplicate, insert blank', async () => {
    const pdf = await createSamplePdf(3, 'Organize Test');

    // Page 2, Page 0, Blank, Page 0 (duplicated)
    const result = await organizePdf(pdf, {
      pages: [
        { id: '1', sourcePageIndex: 2 },
        { id: '2', sourcePageIndex: 0 },
        { id: '3', isBlank: true },
        { id: '4', sourcePageIndex: 0, rotation: 180 },
      ],
    });

    expect(result.pageCount).toBe(4);
    const doc = await safeLoadPdf(result.data);
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getPages()[3].getRotation().angle).toBe(180);
  });

  it('throws CorruptPdfError on invalid data', async () => {
    const junkBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    await expect(safeLoadPdf(junkBytes)).rejects.toThrow(CorruptPdfError);
  });
});
