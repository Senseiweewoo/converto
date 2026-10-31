export interface DocumentChunk {
  id: string;
  page: number;
  text: string;
  tokenEstimate: number;
}

export function chunkDocumentPages(
  pagesText: { page: number; text: string }[],
  targetTokensPerChunk = 600
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  for (const page of pagesText) {
    const paragraphs = page.text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    let currentChunkText = '';
    let currentChunkTokens = 0;

    for (const para of paragraphs) {
      // Rough token estimation: 1 word ~ 1.3 tokens
      const words = para.trim().split(/\s+/).length;
      const tokens = Math.ceil(words * 1.3);

      if (currentChunkTokens + tokens > targetTokensPerChunk && currentChunkText.length > 0) {
        chunks.push({
          id: Math.random().toString(36).substring(2, 9),
          page: page.page,
          text: currentChunkText.trim(),
          tokenEstimate: currentChunkTokens,
        });
        currentChunkText = '';
        currentChunkTokens = 0;
      }

      currentChunkText += `${para}\n\n`;
      currentChunkTokens += tokens;
    }

    if (currentChunkText.trim().length > 0) {
      chunks.push({
        id: Math.random().toString(36).substring(2, 9),
        page: page.page,
        text: currentChunkText.trim(),
        tokenEstimate: currentChunkTokens,
      });
    }
  }

  return chunks;
}

export function buildChatPromptWithCitations(
  question: string,
  chunks: DocumentChunk[]
): string {
  const contextFormatted = chunks
    .map((c) => `--- [Page ${c.page}] ---\n${c.text}`)
    .join('\n\n');

  return `
Answer the user's question using ONLY the provided document excerpts.
Every fact or assertion MUST be followed by its page citation, formatted exactly as [Page X].
If the answer cannot be found in the provided document text, you MUST state: "I couldn't find information about that in this document."

<<<DOCUMENT_DATA_START>>>
${contextFormatted}
<<<DOCUMENT_DATA_END>>>

User Question: ${question}
`.trim();
}
