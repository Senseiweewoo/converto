import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createSamplePdf(pageCount = 1, title = 'Sample PDF'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    page.drawText(`${title} - Page ${i + 1}`, {
      x: 50,
      y: 750,
      size: 20,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('This is a test paragraph verifying text retention and geometry.', {
      x: 50,
      y: 700,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await doc.save();
}

export function createSamplePng(): Uint8Array {
  // Minimal 1x1 transparent PNG bytes
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
    0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84,
    120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78,
    68, 174, 66, 96, 130,
  ]);
}
