import { PDFDocument, LoadOptions } from 'pdf-lib';
import { PasswordRequiredError, CorruptPdfError, InvalidPasswordError } from '../errors';

export async function safeLoadPdf(
  data: Uint8Array,
  options?: LoadOptions & { password?: string }
): Promise<PDFDocument> {
  if (!data || data.length === 0) {
    throw new CorruptPdfError('File has 0 bytes.');
  }

  // Quick check of magic bytes "%PDF-"
  const header = String.fromCharCode(...data.subarray(0, 5));
  if (header !== '%PDF-') {
    throw new CorruptPdfError('Missing standard %PDF- header.');
  }

  try {
    const doc = await PDFDocument.load(data, {
      ignoreEncryption: false,
      ...options,
    });
    // Validate that document has a parseable catalog and page tree
    const count = doc.getPageCount();
    if (count === 0 && data.length < 100) {
      // Catch empty or malformed truncated fragments
      throw new CorruptPdfError('Document contains no valid page tree.');
    }
    return doc;
  } catch (err: unknown) {
    const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    
    if (errMsg.includes('encrypted') || errMsg.includes('password') || errMsg.includes('security handler')) {
      if (options?.password) {
        throw new InvalidPasswordError();
      }
      throw new PasswordRequiredError();
    }
    
    throw new CorruptPdfError(err instanceof Error ? err.message : 'Failed to parse PDF document.');
  }
}
