import { safeLoadPdf } from '../utils/pdf-loader';
import { extractRawTextFromPdfBuffer } from './ocr-pdf';
import { zipSync } from 'fflate';
import { RunContext } from '../types';

export interface OfficeConversionResult {
  data: Uint8Array;
  mimeType: string;
  extension: string;
  summary: string;
}

/**
 * Builds a valid Microsoft Word (.docx) ZIP package from extracted paragraph lines.
 */
function createDocxPackage(paragraphs: string[]): Uint8Array {
  const pXml = paragraphs
    .map((line) => {
      const sanitized = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      return `<w:p><w:r><w:t xml:space="preserve">${sanitized}</w:t></w:r></w:p>`;
    })
    .join('\n');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const zipFiles: Record<string, Uint8Array> = {
    '[Content_Types].xml': new TextEncoder().encode(contentTypesXml),
    '_rels/.rels': new TextEncoder().encode(relsXml),
    'word/document.xml': new TextEncoder().encode(docXml),
  };

  return zipSync(zipFiles);
}

export async function convertPdfToWord(
  data: Uint8Array,
  filename: string,
  rawText?: string,
  ctx?: RunContext
): Promise<OfficeConversionResult> {
  const doc = await safeLoadPdf(data);
  const total = doc.getPageCount();
  ctx?.onProgress?.(0.3, 'Extracting document text flow and paragraphs...');

  let content = rawText;
  if (!content || !content.trim()) {
    content = extractRawTextFromPdfBuffer(data);
  }

  const rawLines = content ? content.split(/\r?\n/) : [];
  const paragraphs = rawLines
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  ctx?.onProgress?.(0.7, 'Packaging into valid Microsoft Word (.docx) document...');

  const docxBytes = createDocxPackage(paragraphs);

  return {
    data: docxBytes,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'docx',
    summary: `Converted ${total} pages into editable Microsoft Word (.docx) document.`,
  };
}

export async function convertPdfToExcel(
  data: Uint8Array,
  filename: string,
  rawText?: string,
  ctx?: RunContext
): Promise<OfficeConversionResult> {
  const doc = await safeLoadPdf(data);
  const total = doc.getPageCount();
  ctx?.onProgress?.(0.3, 'Extracting tabular data from document streams...');

  let content = rawText;
  if (!content || !content.trim()) {
    content = extractRawTextFromPdfBuffer(data);
  }

  const lines = content ? content.split(/\r?\n/) : [];
  const csvRows: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Split by tabs or multiple spaces into table columns
    const cells = trimmed.split(/\t+|\s{2,}/).map((c) => `"${c.replace(/"/g, '""')}"`);
    csvRows.push(cells.join(','));
  }

  ctx?.onProgress?.(0.8, 'Encoding spreadsheet rows...');
  const csvContent = csvRows.join('\r\n');
  const bytes = new TextEncoder().encode(csvContent);

  return {
    data: bytes,
    mimeType: 'text/csv',
    extension: 'csv',
    summary: `Extracted ${csvRows.length} tabular rows into spreadsheet from ${total} pages.`,
  };
}

export async function convertPdfToPowerpoint(
  data: Uint8Array,
  filename: string,
  rawText?: string,
  ctx?: RunContext
): Promise<OfficeConversionResult> {
  const doc = await safeLoadPdf(data);
  const total = doc.getPageCount();
  ctx?.onProgress?.(0.4, 'Creating PowerPoint presentation deck...');

  let content = rawText;
  if (!content || !content.trim()) {
    content = extractRawTextFromPdfBuffer(data);
  }

  const lines = content ? content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];

  const slideXmls = Array.from({ length: total }, (_, i) => {
    const slideText = lines[i] || `Page ${i + 1}`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>${slideText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
  });

  const zipFiles: Record<string, Uint8Array> = {
    '[Content_Types].xml': new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`),
    '_rels/.rels': new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`),
    'ppt/presentation.xml': new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${Array.from({ length: total }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join('\n')}
  </p:sldIdLst>
</p:presentation>`),
  };

  slideXmls.forEach((sXml, i) => {
    zipFiles[`ppt/slides/slide${i + 1}.xml`] = new TextEncoder().encode(sXml);
  });

  const pptxBytes = zipSync(zipFiles);

  return {
    data: pptxBytes,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: 'pptx',
    summary: `Converted ${total} PDF pages into Microsoft PowerPoint (.pptx) slides.`,
  };
}
