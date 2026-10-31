import { describe, it, expect } from 'vitest';
import {
  analyzePdfHealth,
  executeSmartFixChain,
  compressToTarget,
  redactPdf,
  signPdf,
  comparePdfs,
  executeWorkflowPipeline,
  safeLoadPdf,
  WORKFLOW_TEMPLATES,
  WorkspaceFile,
} from '../index';
import { createSamplePdf } from './helpers';
import { PDFDocument, degrees } from 'pdf-lib';

describe('Phase C: Smart Fix, Target Compression, Workflows, Redact & Sign', () => {
  it('analyzes PDF health and reports mixed orientations and rotations', async () => {
    const doc = await PDFDocument.create();
    const p1 = doc.addPage([595, 842]); // portrait
    const p2 = doc.addPage([842, 595]); // landscape
    p2.setRotation(degrees(90));
    const bytes = await doc.save();

    const analysis = await analyzePdfHealth(bytes);
    expect(analysis.totalPages).toBe(2);
    expect(analysis.hasMixedOrientations).toBe(true);
    expect(analysis.rotatedPageIndices).toContain(1);
    expect(analysis.issues.length).toBeGreaterThan(0);
    expect(analysis.healthScore).toBeLessThan(100);
  });

  it('executes automated Smart Fix chain to heal irregular rotations', async () => {
    const doc = await PDFDocument.create();
    const p1 = doc.addPage([595, 842]);
    p1.setRotation(degrees(90));
    const bytes = await doc.save();

    const analysis = await analyzePdfHealth(bytes);
    const fixed = await executeSmartFixChain(bytes, analysis);

    expect(fixed.fixesApplied.length).toBeGreaterThan(0);
    const verified = await safeLoadPdf(fixed.data);
    expect(verified.getPages()[0].getRotation().angle).toBe(0);
  });

  it('compresses to specified target size preset', async () => {
    const pdf = await createSamplePdf(2, 'Target Compress Test');

    const result = await compressToTarget(pdf, {
      preset: 'job-portal', // 500 KB
    });

    expect(result.finalSize).toBeLessThanOrEqual(500 * 1024);
    expect(result.hitTarget).toBe(true);
  });

  it('warns when compression target is unrealistically small', async () => {
    const pdf = await createSamplePdf(10, 'Big Document');

    const result = await compressToTarget(pdf, {
      preset: 'custom',
      customTargetKb: 1, // 1 KB is physically impossible for a 10-page PDF
    });

    expect(result.hitTarget).toBe(false);
    expect(result.warnings).toBeDefined();
    expect(result.warnings![0]).toContain('Unable to reach 1 KB');
  });

  it('permanently redacts specified coordinates and scrubs metadata', async () => {
    const doc = await safeLoadPdf(await createSamplePdf(1, 'Secret Document'));
    doc.setTitle('Sensitive Title');
    const bytes = await doc.save();

    const redacted = await redactPdf(bytes, {
      areas: [
        {
          pageIndex: 0,
          x: 50,
          y: 700,
          width: 300,
          height: 30,
          label: '[REDACTED]',
          color: 'black',
        },
      ],
      scrubMetadata: true,
    });

    expect(redacted.areasRedacted).toBe(1);
    const verified = await safeLoadPdf(redacted.data);
    expect(verified.getTitle()).toBe('');
  });

  it('signs document across all pages', async () => {
    const pdf = await createSamplePdf(3, 'Sign All Pages');

    const signed = await signPdf(pdf, {
      typedSignatureText: 'Jane Smith, Esq.',
      placementMode: 'sign-all-pages',
    });

    expect(signed.signedPagesCount).toBe(3);
    const doc = await safeLoadPdf(signed.data);
    expect(doc.getPageCount()).toBe(3);
  });

  it('compares two PDF documents and detects differences', async () => {
    const docA = await createSamplePdf(2, 'Version 1');
    const docB = await createSamplePdf(3, 'Version 2'); // 3 pages instead of 2

    const comp = await comparePdfs(docA, docB);
    expect(comp.pageCountMatches).toBe(false);
    expect(comp.docAPageCount).toBe(2);
    expect(comp.docBPageCount).toBe(3);
    expect(comp.differences.length).toBeGreaterThan(0);
  });

  it('executes a multi-step workflow pipeline', async () => {
    const pdf = await createSamplePdf(2, 'Pipeline Input');
    const workspaceFiles: WorkspaceFile[] = [
      {
        id: 'f1',
        name: 'input.pdf',
        size: pdf.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: pdf,
      },
    ];

    const template = WORKFLOW_TEMPLATES[0]; // "Prepare for Email" (Rotate + Compress)
    const result = await executeWorkflowPipeline(workspaceFiles, template);

    expect(result.files.length).toBe(1);
    expect(result.stepLogs.length).toBe(template.steps.length);
    const verified = await safeLoadPdf(result.files[0].data);
    expect(verified.getPageCount()).toBe(2);
  });
});
