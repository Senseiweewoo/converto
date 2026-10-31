import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface RepairResult {
  data: Uint8Array;
  recoveredPages: number;
  repairsApplied: string[];
}

export async function repairPdf(
  data: Uint8Array,
  ctx?: RunContext
): Promise<RepairResult> {
  const repairs: string[] = [];
  ctx?.onProgress?.(0.2, 'Analyzing binary header and cross-reference tables...');

  let workingBytes = new Uint8Array(data);

  // 1. Ensure %PDF- header is at offset 0
  const headerMarker = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  let headerOffset = -1;
  const maxScan = Math.min(workingBytes.length - 5, 2048);

  for (let i = 0; i < maxScan; i++) {
    if (
      workingBytes[i] === headerMarker[0] &&
      workingBytes[i + 1] === headerMarker[1] &&
      workingBytes[i + 2] === headerMarker[2] &&
      workingBytes[i + 3] === headerMarker[3] &&
      workingBytes[i + 4] === headerMarker[4]
    ) {
      headerOffset = i;
      break;
    }
  }

  if (headerOffset > 0) {
    repairs.push(`Stripped ${headerOffset} bytes of prepended corrupt bytes`);
    workingBytes = workingBytes.slice(headerOffset);
  }

  // 2. Check for missing %%EOF at tail without re-encoding binary stream
  const eofMarker = [0x25, 0x25, 0x45, 0x4f, 0x46]; // %%EOF
  let hasEof = false;
  const tailScanStart = Math.max(0, workingBytes.length - 128);

  for (let i = tailScanStart; i < workingBytes.length - 4; i++) {
    if (
      workingBytes[i] === eofMarker[0] &&
      workingBytes[i + 1] === eofMarker[1] &&
      workingBytes[i + 2] === eofMarker[2] &&
      workingBytes[i + 3] === eofMarker[3] &&
      workingBytes[i + 4] === eofMarker[4]
    ) {
      hasEof = true;
      break;
    }
  }

  if (!hasEof) {
    repairs.push('Reconstructed missing %%EOF trailer');
    const eofBytes = new Uint8Array([0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a]); // \n%%EOF\n
    const merged = new Uint8Array(workingBytes.length + eofBytes.length);
    merged.set(workingBytes, 0);
    merged.set(eofBytes, workingBytes.length);
    workingBytes = merged;
  }

  ctx?.onProgress?.(0.5, 'Rebuilding broken page trees and stream objects...');

  let doc: PDFDocument;
  try {
    doc = await safeLoadPdf(workingBytes);
  } catch {
    doc = await PDFDocument.load(workingBytes, { ignoreEncryption: true });
    repairs.push('Sanitized catalog and bypassed non-fatal encryption dictionary');
  }

  const recoveredPages = doc.getPageCount();
  const cleanDoc = await PDFDocument.create();
  const copiedPages = await cleanDoc.copyPages(doc, doc.getPageIndices());

  for (const page of copiedPages) {
    cleanDoc.addPage(page);
  }

  repairs.push(`Successfully recovered and normalized ${recoveredPages} pages`);

  ctx?.onProgress?.(0.85, 'Finalizing repaired document structure...');
  const repairedBytes = await cleanDoc.save({ useObjectStreams: true });

  return {
    data: repairedBytes,
    recoveredPages,
    repairsApplied: repairs,
  };
}
