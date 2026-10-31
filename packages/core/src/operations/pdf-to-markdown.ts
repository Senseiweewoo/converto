import { safeLoadPdf } from '../utils/pdf-loader';
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
  const title = doc.getTitle() || filename.replace(/\.pdf$/i, '');

  ctx?.onProgress?.(0.3, 'Parsing document text flow and hierarchy...');

  let content = rawText || '';
  if (!content.trim()) {
    // Basic fallback representation if no text layer passed
    content = `*Document contains ${total} pages. Title: ${title}*`;
  }

  ctx?.onProgress?.(0.6, 'Structuring Markdown headers, lists, and tables...');

  // Convert common document patterns into Markdown
  const lines = content.split('\n');
  const markdownLines: string[] = [];

  markdownLines.push(`# ${title}\n`);
  markdownLines.push(`> Converted with Converto Private PDF Engine &bull; ${total} Pages\n`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      markdownLines.push('');
      continue;
    }

    // Header heuristics
    if (/^(CHAPTER|SECTION|ARTICLE)\s+[0-9IVX]+/i.test(line)) {
      markdownLines.push(`\n## ${line}\n`);
    } else if (/^[0-9]+\.[0-9]+(\.[0-9]+)?\s+[A-Z]/.test(line)) {
      markdownLines.push(`\n### ${line}\n`);
    } else if (/^([A-Z\s]{4,40})$/.test(line) && line.length > 5) {
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

  const markdown = markdownLines.join('\n');
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;

  return {
    markdown,
    pageCount: total,
    wordCount,
  };
}
