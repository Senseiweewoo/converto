import { PDFDocument, degrees } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface SmartFixIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'orientation' | 'size' | 'pages' | 'metadata' | 'forms';
  fixable: boolean;
  fixAction: string;
}

export interface SmartFixAnalysis {
  healthScore: number; // 0 to 100
  totalPages: number;
  fileSizeBytes: number;
  recommendedSizeBytes: number;
  isScannedLikely: boolean;
  hasMixedOrientations: boolean;
  blankPageIndices: number[];
  rotatedPageIndices: number[];
  hasFormFields: boolean;
  hasMetadata: boolean;
  issues: SmartFixIssue[];
}

export async function analyzePdfHealth(
  data: Uint8Array,
  ctx?: RunContext
): Promise<SmartFixAnalysis> {
  ctx?.onProgress?.(0.1, 'Inspecting PDF object tree...');
  const doc = await safeLoadPdf(data);
  const totalPages = doc.getPageCount();
  const fileSizeBytes = data.length;

  const pages = doc.getPages();
  const rotatedPageIndices: number[] = [];
  const blankPageIndices: number[] = [];
  let portraitCount = 0;
  let landscapeCount = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const rot = page.getRotation().angle;

    if (rot !== 0) {
      rotatedPageIndices.push(i);
    }

    if (width > height) {
      landscapeCount++;
    } else {
      portraitCount++;
    }

    // Heuristic for blank page detection (no annotations, minimal content stream)
    try {
      const node = page.node;
      const contents = node.Contents();
      if (!contents || (Array.isArray(contents) && contents.length === 0)) {
        blankPageIndices.push(i);
      }
    } catch {
      // ignore
    }
  }

  const hasMixedOrientations = portraitCount > 0 && landscapeCount > 0;

  // Form detection
  let hasFormFields = false;
  try {
    const form = doc.getForm();
    const fields = form.getFields();
    hasFormFields = fields.length > 0;
  } catch {
    hasFormFields = false;
  }

  // Metadata check
  const title = doc.getTitle();
  const author = doc.getAuthor();
  const hasMetadata = !!(title || author);

  // Recommended size heuristic: ~120KB per standard page
  const recommendedSizeBytes = Math.max(80 * 1024, totalPages * 150 * 1024);
  const isOversized = fileSizeBytes > recommendedSizeBytes * 2.5;

  const issues: SmartFixIssue[] = [];

  if (hasMixedOrientations) {
    issues.push({
      id: 'mixed-orientation',
      title: 'Mixed Page Orientations',
      description: `Document has ${portraitCount} portrait and ${landscapeCount} landscape pages.`,
      severity: 'warning',
      category: 'orientation',
      fixable: true,
      fixAction: 'Normalize all pages to portrait',
    });
  }

  if (rotatedPageIndices.length > 0) {
    issues.push({
      id: 'rotated-pages',
      title: 'Pages with non-zero rotation',
      description: `${rotatedPageIndices.length} page(s) have non-standard rotation angles.`,
      severity: 'info',
      category: 'orientation',
      fixable: true,
      fixAction: 'Reset page rotation to 0°',
    });
  }

  if (blankPageIndices.length > 0) {
    issues.push({
      id: 'blank-pages',
      title: 'Unnecessary Blank Pages',
      description: `Detected ${blankPageIndices.length} blank page(s) (pages: ${blankPageIndices.map((n) => n + 1).join(', ')}).`,
      severity: 'warning',
      category: 'pages',
      fixable: true,
      fixAction: 'Remove blank pages',
    });
  }

  if (isOversized) {
    const currentMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    const recMb = (recommendedSizeBytes / (1024 * 1024)).toFixed(1);
    issues.push({
      id: 'oversized',
      title: 'Suboptimal File Size',
      description: `File size (${currentMb} MB) is higher than recommended (${recMb} MB for ${totalPages} pages).`,
      severity: 'warning',
      category: 'size',
      fixable: true,
      fixAction: 'Compress object streams and optimize',
    });
  }

  if (hasMetadata) {
    issues.push({
      id: 'exposed-metadata',
      title: 'Exposed Document Metadata',
      description: `Contains author or title tags that may leak private details.`,
      severity: 'info',
      category: 'metadata',
      fixable: true,
      fixAction: 'Scrub metadata',
    });
  }

  if (hasFormFields) {
    issues.push({
      id: 'unflattened-form',
      title: 'Fillable Form Fields Present',
      description: 'Document contains active AcroForm fields that may render inconsistently.',
      severity: 'info',
      category: 'forms',
      fixable: true,
      fixAction: 'Flatten form fields',
    });
  }

  // Calculate Health Score (100 minus deductions)
  let healthScore = 100;
  issues.forEach((iss) => {
    if (iss.severity === 'critical') healthScore -= 30;
    else if (iss.severity === 'warning') healthScore -= 15;
    else healthScore -= 5;
  });
  healthScore = Math.max(10, Math.min(100, healthScore));

  ctx?.onProgress?.(1.0, 'Analysis complete.');

  return {
    healthScore,
    totalPages,
    fileSizeBytes,
    recommendedSizeBytes,
    isScannedLikely: false,
    hasMixedOrientations,
    blankPageIndices,
    rotatedPageIndices,
    hasFormFields,
    hasMetadata,
    issues,
  };
}

export async function executeSmartFixChain(
  data: Uint8Array,
  analysis: SmartFixAnalysis,
  ctx?: RunContext
): Promise<{ data: Uint8Array; fixesApplied: string[] }> {
  ctx?.onProgress?.(0.1, 'Applying automated Smart Fix chain...');
  const doc = await safeLoadPdf(data);
  const fixesApplied: string[] = [];

  // 1. Remove blank pages if any
  if (analysis.blankPageIndices.length > 0 && analysis.blankPageIndices.length < doc.getPageCount()) {
    ctx?.onProgress?.(0.3, 'Trimming blank pages...');
    // Remove in reverse order so indices do not shift
    const toRemove = [...analysis.blankPageIndices].sort((a, b) => b - a);
    for (const idx of toRemove) {
      doc.removePage(idx);
    }
    fixesApplied.push(`Removed ${toRemove.length} blank page(s)`);
  }

  // 2. Normalize orientations and reset rotations
  ctx?.onProgress?.(0.5, 'Normalizing page orientations...');
  const pages = doc.getPages();
  let rotatedCount = 0;
  for (const page of pages) {
    if (page.getRotation().angle !== 0) {
      page.setRotation(degrees(0));
      rotatedCount++;
    }
  }
  if (rotatedCount > 0) {
    fixesApplied.push(`Aligned ${rotatedCount} rotated page(s) to 0° standard`);
  }

  // 3. Flatten forms if present
  if (analysis.hasFormFields) {
    ctx?.onProgress?.(0.7, 'Flattening form fields...');
    try {
      const form = doc.getForm();
      form.flatten();
      fixesApplied.push('Flattened form fields into clean read-only printable vector text');
    } catch {
      // ignore
    }
  }

  // 4. Scrub metadata for privacy
  if (analysis.hasMetadata) {
    ctx?.onProgress?.(0.85, 'Scrubbing metadata...');
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('Converto Smart Fix Engine');
    fixesApplied.push('Scrubbed hidden metadata tags');
  }

  // 5. Save with maximum object stream compression
  ctx?.onProgress?.(0.95, 'Compacting document structure...');
  const fixedBytes = await doc.save({
    useObjectStreams: true,
  });

  const reduction = data.length - fixedBytes.length;
  if (reduction > 0) {
    fixesApplied.push(`Reduced size by ${(reduction / 1024).toFixed(0)} KB via stream compaction`);
  }

  ctx?.onProgress?.(1.0, 'Smart Fix complete!');

  return {
    data: fixedBytes,
    fixesApplied,
  };
}
