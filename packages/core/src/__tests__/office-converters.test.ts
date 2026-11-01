import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { PDFDocument } from 'pdf-lib';
import { convertDocxToPdf, extractTextFromDocx } from '../operations/docx-to-pdf';
import { convertXlsxToPdf, extractRowsFromXlsx } from '../operations/xlsx-to-pdf';

describe('Word & Excel to PDF Converters Suite', () => {
  function createMockDocx(paragraphs: { type?: string; text: string }[]): Uint8Array {
    const pXml = paragraphs
      .map((p) => {
        const style = p.type ? `<w:pPr><w:pStyle w:val="${p.type}"/></w:pPr>` : '';
        return `<w:p>${style}<w:r><w:t>${p.text}</w:t></w:r></w:p>`;
      })
      .join('\n');

    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${pXml}</w:body>
</w:document>`;

    const zipObj: Record<string, Uint8Array> = {
      '[Content_Types].xml': new TextEncoder().encode('<Types></Types>'),
      'word/document.xml': new TextEncoder().encode(docXml),
    };

    return zipSync(zipObj);
  }

  function createMockXlsx(rows: string[][]): Uint8Array {
    const sheetRowsXml = rows
      .map((row, rIdx) => {
        const cellsXml = row
          .map((cell, cIdx) => `<c r="${String.fromCharCode(65 + cIdx)}${rIdx + 1}" t="s"><v>${cIdx}</v></c>`)
          .join('');
        return `<row r="${rIdx + 1}">${cellsXml}</row>`;
      })
      .join('\n');

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRowsXml}</sheetData>
</worksheet>`;

    const sharedStrings = Array.from(new Set(rows.flat()));
    const ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${sharedStrings.map((s) => `<si><t>${s}</t></si>`).join('\n')}
</sst>`;

    const zipObj: Record<string, Uint8Array> = {
      'xl/worksheets/sheet1.xml': new TextEncoder().encode(sheetXml),
      'xl/sharedStrings.xml': new TextEncoder().encode(ssXml),
    };

    return zipSync(zipObj);
  }

  it('extracts real paragraphs and headings from DOCX', () => {
    const docxData = createMockDocx([
      { type: 'Heading1', text: 'Executive Agreement' },
      { text: 'This contract is made between Party A and Party B.' },
      { text: 'All terms shall remain strictly private and local.' },
    ]);

    const blocks = extractTextFromDocx(docxData);
    expect(blocks.length).toBe(3);
    expect(blocks[0].type).toBe('heading1');
    expect(blocks[0].text).toBe('Executive Agreement');
    expect(blocks[1].text).toContain('Party A');
  });

  it('converts real DOCX file into vector PDF with proper formatting', async () => {
    const docxData = createMockDocx([
      { type: 'Heading1', text: 'Quarterly Financial Statement' },
      { text: 'Revenue grew by 24% in Q3 exceeding company projections.' },
      { text: 'Operating expenses remained flat due to local efficiency.' },
    ]);

    const result = await convertDocxToPdf(docxData, 'Quarterly_Report.docx');
    expect(result.extractedParagraphsCount).toBe(3);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);

    const loaded = await PDFDocument.load(result.data);
    expect(loaded.getPageCount()).toBe(result.pageCount);
  });

  it('handles fallback text extraction if DOCX is binary or plain text', async () => {
    const plainText = new TextEncoder().encode(
      'Document Title\nParagraph one with important information.\nParagraph two with conclusions.'
    );
    const result = await convertDocxToPdf(plainText, 'Legacy_Document.doc');
    expect(result.extractedParagraphsCount).toBeGreaterThanOrEqual(1);

    const loaded = await PDFDocument.load(result.data);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('converts XLSX spreadsheet with real cell values into tabular PDF', async () => {
    const xlsxData = createMockXlsx([
      ['Product Name', 'Quantity', 'Unit Price', 'Total'],
      ['Widget Alpha', '10', '$25.00', '$250.00'],
      ['Widget Beta', '5', '$40.00', '$200.00'],
    ]);

    const result = await convertXlsxToPdf(xlsxData, 'Inventory.xlsx');
    expect(result.rowCount).toBe(3);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);

    const loaded = await PDFDocument.load(result.data);
    expect(loaded.getPageCount()).toBe(result.pageCount);
  });
});
