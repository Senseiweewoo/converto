import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { unzipSync } from 'fflate';
import { RunContext } from '../types';

export interface DocxToPdfResult {
  data: Uint8Array;
  pageCount: number;
  extractedParagraphsCount: number;
}

interface ParsedBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullet' | 'table-row';
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export function extractTextFromDocx(data: Uint8Array): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];

  try {
    const unzipped = unzipSync(data);
    const docXmlBytes = unzipped['word/document.xml'];

    if (docXmlBytes) {
      const xmlStr = new TextDecoder('utf-8').decode(docXmlBytes);

      // Match paragraphs <w:p ...>...</w:p>
      const paragraphRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
      let pMatch: RegExpExecArray | null;

      while ((pMatch = paragraphRegex.exec(xmlStr)) !== null) {
        const pContent = pMatch[1];

        // Check heading style
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
          });
        }
      }
    }
  } catch {
    // If not a valid zip archive (e.g. legacy binary .doc or plain text), extract printable text
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

  // Fallback if no blocks were found
  if (blocks.length === 0) {
    blocks.push({
      type: 'paragraph',
      text: 'Document contained no recognizable text or formatting.',
    });
  }

  return blocks;
}

export async function convertDocxToPdf(
  data: Uint8Array,
  filename: string,
  ctx?: RunContext
): Promise<DocxToPdfResult> {
  ctx?.onProgress?.(0.2, 'Unpacking Word document structure and styles...');

  const blocks = extractTextFromDocx(data);

  ctx?.onProgress?.(0.5, `Rendering ${blocks.length} paragraphs into vector PDF pages...`);

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Standard A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 54; // 0.75 inch margin
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Helper to flow text with automatic wrapping and pagination
  const drawWrappedText = (
    text: string,
    fontSize: number,
    font: any,
    color = rgb(0.12, 0.14, 0.17),
    indent = 0,
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
        if (y < margin + lineHeight) {
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        page.drawText(currentLine, {
          x: margin + indent,
          y,
          size: fontSize,
          font,
          color,
        });

        currentLine = word;
        y -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + lineHeight) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      page.drawText(currentLine, {
        x: margin + indent,
        y,
        size: fontSize,
        font,
        color,
      });

      y -= lineHeight;
    }
  };

  // Render content blocks
  for (const block of blocks) {
    if (ctx?.signal?.aborted) throw new Error('Operation was cancelled.');

    if (block.type === 'heading1') {
      y -= 14;
      drawWrappedText(block.text, 16, fontBold, rgb(0.08, 0.1, 0.15));
      y -= 8;
    } else if (block.type === 'heading2') {
      y -= 10;
      drawWrappedText(block.text, 13, fontBold, rgb(0.15, 0.2, 0.25));
      y -= 6;
    } else if (block.type === 'heading3') {
      y -= 8;
      drawWrappedText(block.text, 11, fontBold, rgb(0.2, 0.25, 0.3));
      y -= 4;
    } else if (block.type === 'bullet') {
      const bulletFont = block.isBold ? fontBold : block.isItalic ? fontItalic : fontRegular;
      drawWrappedText(`•  ${block.text}`, 10, bulletFont, rgb(0.15, 0.15, 0.15), 12);
      y -= 4;
    } else {
      const regularFont = block.isBold ? fontBold : block.isItalic ? fontItalic : fontRegular;
      drawWrappedText(block.text, 10, regularFont, rgb(0.12, 0.14, 0.17));
      y -= 6; // paragraph spacing
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
