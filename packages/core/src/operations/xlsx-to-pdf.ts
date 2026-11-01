import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { unzipSync } from 'fflate';
import { RunContext } from '../types';

export interface XlsxToPdfResult {
  data: Uint8Array;
  pageCount: number;
  rowCount: number;
}

export function extractRowsFromXlsx(data: Uint8Array): string[][] {
  const rows: string[][] = [];

  try {
    const unzipped = unzipSync(data);

    // 1. Parse shared strings table if present
    const sharedStrings: string[] = [];
    const ssBytes = unzipped['xl/sharedStrings.xml'];
    if (ssBytes) {
      const ssXml = new TextDecoder('utf-8').decode(ssBytes);
      const siRegex = /<si>([\s\S]*?)<\/si>/g;
      let siMatch: RegExpExecArray | null;
      while ((siMatch = siRegex.exec(ssXml)) !== null) {
        const textMatch = /<t(?:\s+[^>]*)?>([^<]*)<\/t>/g;
        const textParts: string[] = [];
        let t: RegExpExecArray | null;
        while ((t = textMatch.exec(siMatch[1])) !== null) {
          textParts.push(t[1]);
        }
        sharedStrings.push(textParts.join(''));
      }
    }

    // 2. Parse sheet1.xml
    const sheetBytes = unzipped['xl/worksheets/sheet1.xml'];
    if (sheetBytes) {
      const sheetXml = new TextDecoder('utf-8').decode(sheetBytes);
      const rowRegex = /<row(?:\s+[^>]*)?>([\s\S]*?)<\/row>/g;
      let rowMatch: RegExpExecArray | null;

      while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
        const rowContent = rowMatch[1];
        const cellRegex = /<c\s+([^>]*)>(?:[\s\S]*?<v>([^<]*)<\/v>)?[\s\S]*?<\/c>/g;
        let cMatch: RegExpExecArray | null;
        const rowCells: string[] = [];

        while ((cMatch = cellRegex.exec(rowContent)) !== null) {
          const attributes = cMatch[1];
          const val = cMatch[2] || '';
          const isSharedString = /t="s"/i.test(attributes);

          if (isSharedString) {
            const index = parseInt(val, 10);
            rowCells.push(sharedStrings[index] || val);
          } else {
            rowCells.push(val);
          }
        }

        if (rowCells.some((c) => c.trim().length > 0)) {
          rows.push(rowCells);
        }
      }
    }
  } catch {
    // Fallback: parse CSV or plain text
    const textStr = new TextDecoder('utf-8').decode(data);
    const lines = textStr.split(/\r?\n/).filter(Boolean);
    for (const l of lines) {
      rows.push(l.split(/[,;\t]/).map((c) => c.trim()));
    }
  }

  if (rows.length === 0) {
    rows.push(['No readable spreadsheet data found']);
  }

  return rows;
}

export async function convertXlsxToPdf(
  data: Uint8Array,
  filename: string,
  ctx?: RunContext
): Promise<XlsxToPdfResult> {
  ctx?.onProgress?.(0.2, 'Extracting spreadsheet cells, columns, and rows...');

  const rows = extractRowsFromXlsx(data);

  ctx?.onProgress?.(0.5, `Rendering ${rows.length} tabular rows into vector PDF...`);

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for wide spreadsheets
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const docTitle = filename.replace(/\.(xlsx|xls|csv)$/i, '');

  // Document Title
  page.drawText(docTitle, {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.05, 0.58, 0.41),
  });
  y -= 26;

  // Determine column count and widths
  const maxCols = Math.max(1, ...rows.map((r) => r.length));
  const colWidth = Math.min(180, contentWidth / maxCols);
  const rowHeight = 22;

  // Draw rows
  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');

    if (y < margin + rowHeight) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    const row = rows[rIdx];
    const isHeader = rIdx === 0;

    // Background fill for header or alternating rows
    if (isHeader) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 6,
        width: colWidth * row.length,
        height: rowHeight,
        color: rgb(0.92, 0.96, 0.94),
      });
    } else if (rIdx % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 6,
        width: colWidth * row.length,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    // Draw cells
    for (let cIdx = 0; cIdx < row.length; cIdx++) {
      const cellText = String(row[cIdx] || '').substring(0, 35);
      const font = isHeader ? fontBold : fontRegular;
      const color = isHeader ? rgb(0.05, 0.35, 0.25) : rgb(0.15, 0.15, 0.15);

      page.drawText(cellText, {
        x: margin + cIdx * colWidth + 4,
        y: y - 10,
        size: isHeader ? 9 : 8.5,
        font,
        color,
      });
    }

    // Row bottom border
    page.drawLine({
      start: { x: margin, y: y - rowHeight + 6 },
      end: { x: margin + colWidth * row.length, y: y - rowHeight + 6 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    y -= rowHeight;
  }

  // Draw Page numbers
  const totalPages = doc.getPageCount();
  const allPages = doc.getPages();
  for (let i = 0; i < totalPages; i++) {
    const p = allPages[i];
    const pageNumStr = `Page ${i + 1} of ${totalPages}`;
    p.drawText(pageNumStr, {
      x: (pageWidth - fontRegular.widthOfTextAtSize(pageNumStr, 9)) / 2,
      y: margin / 2,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  ctx?.onProgress?.(0.9, 'Finalizing vector PDF file...');
  const pdfBytes = await doc.save({ useObjectStreams: true });

  return {
    data: pdfBytes,
    pageCount: totalPages,
    rowCount: rows.length,
  };
}
