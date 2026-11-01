import { safeLoadPdf } from '../utils/pdf-loader';
import { extractRawTextFromPdfBuffer } from './ocr-pdf';
import { RunContext } from '../types';

export interface PdfToMarkdownResult {
  markdown: string;
  pageCount: number;
  wordCount: number;
}

export async function convertPdfToMarkdown(
  data: Uint8Array,
  filename: string,
  rawText?: string,
  ctx?: RunContext
): Promise<PdfToMarkdownResult> {
  const doc = await safeLoadPdf(data);
  const total = doc.getPageCount();

  ctx?.onProgress?.(0.3, 'Parsing document text flow and structure...');

  let content = rawText;
  if (!content || !content.trim()) {
    content = extractRawTextFromPdfBuffer(data);
  }

  if (!content.trim()) {
    content = '';
  }

  ctx?.onProgress?.(0.6, 'Structuring clean Markdown syntax...');

  // Convert document lines into clean Markdown preserving structure without injected headers
  const lines = content.split('\n');
  const markdownLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      markdownLines.push('');
      continue;
    }

    // Preserve natural headings and lists without adding artificial content
    if (/^(CHAPTER|SECTION|ARTICLE)\s+[0-9IVX]+/i.test(line)) {
      markdownLines.push(`\n## ${line}\n`);
    } else if (/^[0-9]+\.[0-9]+(\.[0-9]+)?\s+[A-Z]/.test(line)) {
      markdownLines.push(`\n### ${line}\n`);
    } else if (/^[-*•]\s+/.test(line)) {
      markdownLines.push(`- ${line.replace(/^[-*•]\s+/, '')}`);
    } else if (/^[0-9]+\.\s+/.test(line)) {
      markdownLines.push(line);
    } else if (line.includes(':') && line.length < 50 && !line.endsWith('.')) {
      const [key, ...rest] = line.split(':');
      markdownLines.push(`**${key.trim()}:** ${rest.join(':').trim()}`);
    } else {
      markdownLines.push(line);
    }
  }

  const markdown = markdownLines.join('\n').trim();
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;

  return {
    markdown,
    pageCount: total,
    wordCount,
  };
}
