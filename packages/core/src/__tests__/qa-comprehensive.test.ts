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
  InvalidPasswordError,
} from '../index';
import { createSamplePdf, createSamplePng } from './helpers';

describe('Converto QA & Edge Case Validation Suite', () => {
  /* -------------------------------------------------------------
   * 1. BOUNDARY & RANGE EDGE CASES
   * ------------------------------------------------------------- */
  describe('Boundary Conditions & Range Parsing', () => {
    it('handles single-page PDF document across all operations', async () => {
      const singlePage = await createSamplePdf(1, 'Single Page Doc');

      // Rotate 1 page
      const rot = await rotatePdf(singlePage, { angle: 180, pages: 'all' });
      expect(rot.rotatedCount).toBe(1);
      const rotDoc = await safeLoadPdf(rot.data);
      expect(rotDoc.getPageCount()).toBe(1);
      expect(rotDoc.getPages()[0].getRotation().angle).toBe(180);

      // Split 1 page
      const split = await splitPdf(singlePage, 'single.pdf', {
        mode: 'ranges',
        ranges: '1',
      });
      expect(split.files.length).toBe(1);
      expect(split.files[0].pageCount).toBe(1);

      // Number 1 page
      const num = await addPageNumbers(singlePage, {
        position: 'bottom-center',
        format: 'page-of-total',
      });
      expect(num.labeledPages).toBe(1);

      // Watermark 1 page
      const wm = await watermarkPdf(singlePage, {
        type: 'text',
        text: 'TEST',
      });
      expect(wm.watermarkedPages).toBe(1);

      // Compress 1 page
      const comp = await compressPdf(singlePage);
      expect(comp.compressedSize).toBeGreaterThan(0);
    });

    it('gracefully clamps reversed and out-of-bounds page ranges in split', async () => {
      const pdf = await createSamplePdf(5, 'Range Clamping');

      // "5-2" (reversed) should be clamped to pages 2 through 5
      const splitReversed = await splitPdf(pdf, 'clamp.pdf', {
        mode: 'ranges',
        ranges: '5-2',
      });
      expect(splitReversed.files.length).toBe(1);
      expect(splitReversed.files[0].pageCount).toBe(4);

      // "1-100" on a 5-page PDF should clamp to pages 1 through 5
      const splitOOB = await splitPdf(pdf, 'oob.pdf', {
        mode: 'ranges',
        ranges: '1-100',
      });
      expect(splitOOB.files.length).toBe(1);
      expect(splitOOB.files[0].pageCount).toBe(5);
    });

    it('rejects completely invalid page ranges with clear error message', async () => {
      const pdf = await createSamplePdf(3, 'Invalid Range');

      await expect(
        splitPdf(pdf, 'test.pdf', {
          mode: 'ranges',
          ranges: '50-100',
        })
      ).rejects.toThrow('Invalid page range');
    });

    it('correctly filters odd vs even pages in rotation', async () => {
      const pdf = await createSamplePdf(4, 'Odd Even');

      // Rotate odd pages (1st and 3rd, 0-indexed 0 and 2)
      const oddRot = await rotatePdf(pdf, { angle: 90, pages: 'odd' });
      expect(oddRot.rotatedCount).toBe(2);

      const doc = await safeLoadPdf(oddRot.data);
      const pages = doc.getPages();
      expect(pages[0].getRotation().angle).toBe(90); // page 1
      expect(pages[1].getRotation().angle).toBe(0);  // page 2
      expect(pages[2].getRotation().angle).toBe(90); // page 3
      expect(pages[3].getRotation().angle).toBe(0);  // page 4
    });

    it('correctly respects "exclude-first" in page numbers', async () => {
      const pdf = await createSamplePdf(3, 'Exclude First Page');

      const numResult = await addPageNumbers(pdf, {
        position: 'bottom-right',
        format: 'slash',
        pages: 'exclude-first',
      });

      // Should label pages 2 and 3, skipping page 1 (cover sheet pattern)
      expect(numResult.labeledPages).toBe(2);
      const doc = await safeLoadPdf(numResult.data);
      expect(doc.getPageCount()).toBe(3);
    });
  });

  /* -------------------------------------------------------------
   * 2. CORRUPT & INVALID FILE DEFENSE
   * ------------------------------------------------------------- */
  describe('Corrupt & Malformed Data Defense', () => {
    it('throws CorruptPdfError with actionable recovery advice on 0 bytes', async () => {
      const empty = new Uint8Array(0);
      try {
        await safeLoadPdf(empty);
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(CorruptPdfError);
        expect(err.code).toBe('CORRUPT_PDF');
        expect(err.actionableSuggestion).toContain('Repair');
      }
    });

    it('throws CorruptPdfError when magic header is missing', async () => {
      const htmlBytes = new TextEncoder().encode('<!DOCTYPE html><html><body>Not a PDF</body></html>');
      try {
        await safeLoadPdf(htmlBytes);
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(CorruptPdfError);
        expect(err.message).toContain('%PDF-');
      }
    });

    it('throws CorruptPdfError when PDF trailer/structure is truncated', async () => {
      // Starts with %PDF- but terminates abruptly mid-stream
      const truncated = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\n');
      try {
        await safeLoadPdf(truncated);
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(CorruptPdfError);
      }
    });
  });

  /* -------------------------------------------------------------
   * 3. ABORT / CANCELLATION INTEGRITY
   * ------------------------------------------------------------- */
  describe('Cancellation (AbortSignal) Integrity', () => {
    it('halts merge immediately when cancelled mid-run without completing', async () => {
      const pdf1 = await createSamplePdf(3, 'Cancel A');
      const pdf2 = await createSamplePdf(3, 'Cancel B');

      const controller = new AbortController();
      controller.abort(); // already aborted

      await expect(
        mergePdf(
          [
            { name: '1.pdf', data: pdf1 },
            { name: '2.pdf', data: pdf2 },
          ],
          { signal: controller.signal }
        )
      ).rejects.toThrow('Operation was cancelled.');
    });

    it('halts split immediately when signal triggers', async () => {
      const pdf = await createSamplePdf(10, 'Split Cancel');
      const controller = new AbortController();
      controller.abort();

      await expect(
        splitPdf(
          pdf,
          'cancel.pdf',
          { mode: 'extract-all' },
          { signal: controller.signal }
        )
      ).rejects.toThrow('Operation was cancelled.');
    });
  });

  /* -------------------------------------------------------------
   * 4. STRESS & COMPLEX COMPOSITION
   * ------------------------------------------------------------- */
  describe('Complex Composition & Quality Preservation', () => {
    it('assembles a complex organize sequence with multiple duplicates and rotations', async () => {
      const source = await createSamplePdf(4, 'Organize Source');

      const result = await organizePdf(source, {
        pages: [
          { id: 'p1', sourcePageIndex: 3, rotation: 90 },
          { id: 'p2', isBlank: true, rotation: 0 },
          { id: 'p3', sourcePageIndex: 0, rotation: 180 },
          { id: 'p4', sourcePageIndex: 0, rotation: 270 }, // duplicate of page 0 with different rotation
          { id: 'p5', sourcePageIndex: 1, rotation: 0 },
        ],
      });

      expect(result.pageCount).toBe(5);

      const verified = await safeLoadPdf(result.data);
      expect(verified.getPageCount()).toBe(5);
      const verifiedPages = verified.getPages();
      expect(verifiedPages[0].getRotation().angle).toBe(90);
      expect(verifiedPages[2].getRotation().angle).toBe(180);
      expect(verifiedPages[3].getRotation().angle).toBe(270);
    });

    it('imageToPdf respects orientation and margin bounds', async () => {
      const png = createSamplePng();

      const result = await imagesToPdf(
        [{ name: 'test.png', data: png, type: 'image/png' }],
        { pageSize: 'LETTER', orientation: 'landscape', margin: 15 }
      );

      expect(result.pageCount).toBe(1);
      const doc = await safeLoadPdf(result.data);
      const page = doc.getPages()[0];
      const { width, height } = page.getSize();
      // Landscape Letter: width > height (792 x 612)
      expect(width).toBeGreaterThan(height);
    });

    it('compression scrubs metadata fields when removeMetadata is enabled', async () => {
      const sourceDoc = await safeLoadPdf(await createSamplePdf(1, 'Meta Test'));
      sourceDoc.setTitle('Confidential Title');
      sourceDoc.setAuthor('Secret Author');
      const rawWithMeta = await sourceDoc.save();

      const comp = await compressPdf(rawWithMeta, {
        preset: 'strong',
        removeMetadata: true,
      });

      const scrubbedDoc = await safeLoadPdf(comp.data);
      expect(scrubbedDoc.getTitle()).toBe('');
      expect(scrubbedDoc.getAuthor()).toBe('');
      expect(scrubbedDoc.getKeywords()).toBe('');
    });
  });
});
