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
