import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { unzipSync } from 'fflate';
import { RunContext } from '../types';

export interface DocxToPdfResult {
  data: Uint8Array;
  pageCount: number;
  extractedParagraphsCount: number;
}

export interface DocxSectionGeometry {
  widthPt: number;
  heightPt: number;
  marginTopPt: number;
  marginBottomPt: number;
  marginLeftPt: number;
  marginRightPt: number;
  orientation: 'portrait' | 'landscape';
}

interface ParsedBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullet' | 'table-row';
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  tableCells?: string[];
  align?: 'left' | 'center' | 'right';
}

export function extractSectionGeometry(xmlStr: string): DocxSectionGeometry {
  // Default A4 in points (595.28 x 841.89)
  let widthPt = 595.28;
  let heightPt = 841.89;
  let marginTopPt = 54;
  let marginBottomPt = 54;
  let marginLeftPt = 54;
  let marginRightPt = 54;
  let orientation: 'portrait' | 'landscape' = 'portrait';

  const sectPrMatch = xmlStr.match(/<w:sectPr(?:\s+[^>]*)?>([\s\S]*?)<\/w:sectPr>/i);
  if (sectPrMatch) {
    const sectContent = sectPrMatch[1];

    // Page size <w:pgSz w:w="12240" w:h="15840" w:orient="landscape"/>
    const pgSzMatch = sectContent.match(/<w:pgSz\s+([^>]*)\/>/i);
    if (pgSzMatch) {
      const attrs = pgSzMatch[1];
      const wMatch = attrs.match(/w:w="(\d+)"/i);
      const hMatch = attrs.match(/w:h="(\d+)"/i);
      const orientMatch = attrs.match(/w:orient="(landscape|portrait)"/i);

      if (wMatch && hMatch) {
        widthPt = parseInt(wMatch[1], 10) / 20; // 20 twips = 1 pt
        heightPt = parseInt(hMatch[1], 10) / 20;
      }

      if (orientMatch) {
        orientation = orientMatch[1] as 'portrait' | 'landscape';
      } else if (widthPt > heightPt) {
        orientation = 'landscape';
      }
    }

    // Margins <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    const pgMarMatch = sectContent.match(/<w:pgMar\s+([^>]*)\/>/i);
    if (pgMarMatch) {
      const attrs = pgMarMatch[1];
      const topMatch = attrs.match(/w:top="(\d+)"/i);
      const bottomMatch = attrs.match(/w:bottom="(\d+)"/i);
      const leftMatch = attrs.match(/w:left="(\d+)"/i);
      const rightMatch = attrs.match(/w:right="(\d+)"/i);

      if (topMatch) marginTopPt = parseInt(topMatch[1], 10) / 20;
      if (bottomMatch) marginBottomPt = parseInt(bottomMatch[1], 10) / 20;
      if (leftMatch) marginLeftPt = parseInt(leftMatch[1], 10) / 20;
      if (rightMatch) marginRightPt = parseInt(rightMatch[1], 10) / 20;
    }
  }

  return {
    widthPt,
    heightPt,
    marginTopPt,
    marginBottomPt,
    marginLeftPt,
    marginRightPt,
    orientation,
  };
}

export function extractTextFromDocx(data: Uint8Array): ParsedBlock[] & { geometry: DocxSectionGeometry } {
  const blocks: ParsedBlock[] = [];
  let geometry: DocxSectionGeometry = {
    widthPt: 595.28,
    heightPt: 841.89,
    marginTopPt: 54,
    marginBottomPt: 54,
    marginLeftPt: 54,
    marginRightPt: 54,
    orientation: 'portrait',
  };

  try {
    const unzipped = unzipSync(data);
    const docXmlBytes = unzipped['word/document.xml'];

    if (docXmlBytes) {
      const xmlStr = new TextDecoder('utf-8').decode(docXmlBytes);
      geometry = extractSectionGeometry(xmlStr);

      // Match paragraphs <w:p ...>...</w:p> and tables <w:tbl>...</w:tbl>
      const bodyMatch = xmlStr.match(/<w:body>([\s\S]*?)<\/w:body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : xmlStr;

      // Extract tables
      const tblRegex = /<w:tbl(?:\s+[^>]*)?>([\s\S]*?)<\/w:tbl>/g;
      let tblMatch: RegExpExecArray | null;
      const tableRanges: { start: number; end: number }[] = [];

      while ((tblMatch = tblRegex.exec(bodyContent)) !== null) {
        tableRanges.push({ start: tblMatch.index, end: tblMatch.index + tblMatch[0].length });
        const trRegex = /<w:tr(?:\s+[^>]*)?>([\s\S]*?)<\/w:tr>/g;
        let trMatch: RegExpExecArray | null;

        while ((trMatch = trRegex.exec(tblMatch[1])) !== null) {
          const tcRegex = /<w:tc(?:\s+[^>]*)?>([\s\S]*?)<\/w:tc>/g;
          let tcMatch: RegExpExecArray | null;
          const cells: string[] = [];

          while ((tcMatch = tcRegex.exec(trMatch[1])) !== null) {
            const tMatches = tcMatch[1].match(/<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g);
            const cellText = tMatches
              ? tMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ').trim()
              : '';
            cells.push(cellText);
          }

          if (cells.length > 0) {
            blocks.push({
              type: 'table-row',
              text: cells.join(' | '),
              tableCells: cells,
            });
          }
        }
      }

      // Match paragraphs
      const paragraphRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
      let pMatch: RegExpExecArray | null;

      while ((pMatch = paragraphRegex.exec(bodyContent)) !== null) {
        // Skip if inside a table already processed
        const pIndex = pMatch.index;
        const insideTable = tableRanges.some((r) => pIndex >= r.start && pIndex <= r.end);
        if (insideTable) continue;

        const pContent = pMatch[1];

        // Check style
        let type: ParsedBlock['type'] = 'paragraph';
        if (/<w:pStyle\s+[^>]*w:val="(?:Heading1|Title)"/i.test(pContent)) {
          type = 'heading1';
        } else if (/<w:pStyle\s+[^>]*w:val="Heading2"/i.test(pContent)) {
          type = 'heading2';
        } else if (/<w:pStyle\s+[^>]*w:val="Heading3"/i.test(pContent)) {
          type = 'heading3';
        } else if (/<w:numPr>/i.test(pContent)) {
          type = 'bullet';
        }

        // Check alignment
        let align: ParsedBlock['align'] = 'left';
        if (/<w:jc\s+[^>]*w:val="center"/i.test(pContent)) {
          align = 'center';
        } else if (/<w:jc\s+[^>]*w:val="right"/i.test(pContent)) {
          align = 'right';
        }

        // Extract text runs
        const textRuns: string[] = [];
        const isBold = /<w:b(?:\s+[^>]*)?\/>/i.test(pContent);
        const isItalic = /<w:i(?:\s+[^>]*)?\/>/i.test(pContent);

        const tRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g;
        let tMatch: RegExpExecArray | null;
        while ((tMatch = tRegex.exec(pContent)) !== null) {
          textRuns.push(tMatch[1]);
        }

        const fullText = textRuns.join('').trim();
        if (fullText) {
          blocks.push({
            type,
            text: fullText,
            isBold,
            isItalic,
            align,
          });
        }
      }
    }
  } catch {
    // Legacy / binary .doc fallback
    const textStr = new TextDecoder('latin1').decode(data);
    const cleaned = textStr.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 3);

    for (const line of lines) {
      blocks.push({
        type: 'paragraph',
        text: line,
      });
    }
  }

  if (blocks.length === 0) {
    blocks.push({
      type: 'paragraph',
      text: 'Document contained no recognizable text or formatting.',
    });
  }

  const result = blocks as ParsedBlock[] & { geometry: DocxSectionGeometry };
  result.geometry = geometry;
  return result;
}

export async function convertDocxToPdf(
  data: Uint8Array,
  filename: string,
  ctx?: RunContext
): Promise<DocxToPdfResult> {
  ctx?.onProgress?.(0.2, 'Analyzing OpenXML geometry, tables, and typography...');

  const parsed = extractTextFromDocx(data);
  const blocks = parsed;
  const geometry = parsed.geometry;

  ctx?.onProgress?.(0.5, `Rendering ${blocks.length} elements into PDF...`);

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Apply dynamic page geometry and margins from source document w:sectPr
  const pageWidth = geometry.widthPt;
  const pageHeight = geometry.heightPt;
  const marginTop = geometry.marginTopPt;
  const marginBottom = geometry.marginBottomPt;
  const marginLeft = geometry.marginLeftPt;
  const marginRight = geometry.marginRightPt;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  // Flow text with automatic wrapping and dynamic pagination
  const drawWrappedText = (
    text: string,
    fontSize: number,
    font: any,
    color = rgb(0.12, 0.14, 0.17),
    indent = 0,
    align: 'left' | 'center' | 'right' = 'left',
    lineHeightFactor = 1.35
  ) => {
    const lineHeight = fontSize * lineHeightFactor;
    const words = text.split(/\s+/).filter(Boolean);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > contentWidth - indent) {
        if (y < marginBottom + lineHeight) {
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - marginTop;
        }

        const lineWidth = font.widthOfTextAtSize(currentLine, fontSize);
        let x = marginLeft + indent;
        if (align === 'center') {
          x = marginLeft + (contentWidth - lineWidth) / 2;
        } else if (align === 'right') {
          x = marginLeft + contentWidth - lineWidth;
        }

        page.drawText(currentLine, { x, y, size: fontSize, font, color });
        currentLine = word;
        y -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < marginBottom + lineHeight) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - marginTop;
      }

      const lineWidth = font.widthOfTextAtSize(currentLine, fontSize);
      let x = marginLeft + indent;
      if (align === 'center') {
        x = marginLeft + (contentWidth - lineWidth) / 2;
      } else if (align === 'right') {
        x = marginLeft + contentWidth - lineWidth;
      }

      page.drawText(currentLine, { x, y, size: fontSize, font, color });
      y -= lineHeight;
    }
  };

  // Render content blocks without ANY injected headers or templates
  for (const block of blocks) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');

    if (block.type === 'heading1') {
      y -= 14;
      drawWrappedText(block.text, 16, fontBold, rgb(0.08, 0.1, 0.15), 0, block.align);
      y -= 8;
    } else if (block.type === 'heading2') {
      y -= 10;
      drawWrappedText(block.text, 13, fontBold, rgb(0.15, 0.2, 0.25), 0, block.align);
      y -= 6;
    } else if (block.type === 'heading3') {
      y -= 8;
      drawWrappedText(block.text, 11, fontBold, rgb(0.2, 0.25, 0.3), 0, block.align);
      y -= 4;
    } else if (block.type === 'bullet') {
      const bulletFont = block.isBold ? fontBold : block.isItalic ? fontItalic : fontRegular;
      drawWrappedText(`•  ${block.text}`, 10, bulletFont, rgb(0.15, 0.15, 0.15), 14, block.align);
      y -= 4;
    } else if (block.type === 'table-row' && block.tableCells && block.tableCells.length > 0) {
      // Render table row
      const cellCount = block.tableCells.length;
      const colWidth = contentWidth / cellCount;
      const cellHeight = 18;

      if (y < marginBottom + cellHeight) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - marginTop;
      }

      for (let c = 0; c < cellCount; c++) {
        const cellText = block.tableCells[c].substring(0, 40);
        page.drawText(cellText, {
          x: marginLeft + c * colWidth + 4,
          y: y - 10,
          size: 9,
          font: fontRegular,
          color: rgb(0.15, 0.15, 0.15),
        });
        page.drawLine({
          start: { x: marginLeft + c * colWidth, y: y + 4 },
          end: { x: marginLeft + c * colWidth, y: y - cellHeight + 4 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
      }
      page.drawLine({
        start: { x: marginLeft, y: y - cellHeight + 4 },
        end: { x: marginLeft + contentWidth, y: y - cellHeight + 4 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      y -= cellHeight;
    } else {
      const regularFont = block.isBold ? fontBold : block.isItalic ? fontItalic : fontRegular;
      drawWrappedText(block.text, 10, regularFont, rgb(0.12, 0.14, 0.17), 0, block.align);
      y -= 6;
    }
  }

  ctx?.onProgress?.(0.9, 'Finalizing vector PDF file...');
  const totalPages = doc.getPageCount();
  const pdfBytes = await doc.save({ useObjectStreams: true });

  return {
    data: pdfBytes,
    pageCount: totalPages,
    extractedParagraphsCount: blocks.length,
  };
}
