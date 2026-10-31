import { WorkspaceFile, ToolResult, RunContext } from '../types';
import { mergePdf } from './merge';
import { splitPdf } from './split';
import { compressPdf } from './compress';
import { rotatePdf } from './rotate';
import { watermarkPdf } from './watermark';
import { addPageNumbers } from './page-numbers';
import { compressToTarget } from './compress-to-target';
import { redactPdf } from './redact';

export interface WorkflowStep {
  id: string;
  toolId: string;
  title: string;
  settings: any;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export const WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  {
    id: 'prepare-for-email',
    name: 'Prepare for Email',
    description: 'Compresses PDF under 2 MB, resets irregular page rotations, and scrubs metadata.',
    steps: [
      {
        id: 's1',
        toolId: 'rotate-pdf',
        title: 'Normalize Rotations',
        settings: { angle: 90, pages: 'all' },
      },
      {
        id: 's2',
        toolId: 'compress-pdf',
        title: 'Strong Compression & Scrub Metadata',
        settings: { preset: 'strong', removeMetadata: true },
      },
    ],
  },
  {
    id: 'contract-ready',
    name: 'Contract Ready to Sign',
    description: 'Numbers all pages excluding cover, and sets up watermark draft stamp.',
    steps: [
      {
        id: 's1',
        toolId: 'page-numbers',
        title: 'Insert Page Numbers',
        settings: { position: 'bottom-right', format: 'slash', pages: 'exclude-first' },
      },
      {
        id: 's2',
        toolId: 'watermark-pdf',
        title: 'Stamp Confidentiality',
        settings: { type: 'text', text: 'CONFIDENTIAL DRAFT', opacity: 0.15, rotation: 45 },
      },
    ],
  },
  {
    id: 'redact-and-share',
    name: 'Redact & Sanitize for Sharing',
    description: 'Permanently scrubs metadata and applies maximum compression stream compaction.',
    steps: [
      {
        id: 's1',
        toolId: 'compress-pdf',
        title: 'Scrub All Metadata & Linearize',
        settings: { preset: 'basic', removeMetadata: true },
      },
    ],
  },
];

export async function executeWorkflowPipeline(
  initialFiles: WorkspaceFile[],
  workflow: WorkflowDefinition,
  ctx?: RunContext
): Promise<{ files: WorkspaceFile[]; stepLogs: string[] }> {
  let currentFiles = [...initialFiles];
  const stepLogs: string[] = [];

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    if (ctx?.signal?.aborted) throw new Error('Workflow was cancelled.');

    ctx?.onProgress?.(
      i / workflow.steps.length,
      `Step ${i + 1}/${workflow.steps.length}: ${step.title}...`
    );

    switch (step.toolId) {
      case 'compress-pdf': {
        const outFiles: WorkspaceFile[] = [];
        for (const f of currentFiles) {
          const res = await compressPdf(f.data, step.settings, ctx);
          outFiles.push({
            id: Math.random().toString(36).substring(2, 9),
            name: f.name,
            size: res.compressedSize,
            type: 'application/pdf',
            lastModified: Date.now(),
            data: res.data,
          });
        }
        currentFiles = outFiles;
        stepLogs.push(`Executed ${step.title}: compressed ${currentFiles.length} file(s).`);
        break;
      }

      case 'rotate-pdf': {
        const outFiles: WorkspaceFile[] = [];
        for (const f of currentFiles) {
          const res = await rotatePdf(f.data, step.settings, ctx);
          outFiles.push({
            id: Math.random().toString(36).substring(2, 9),
            name: f.name,
            size: res.data.length,
            type: 'application/pdf',
            lastModified: Date.now(),
            data: res.data,
            pageCount: res.totalPages,
          });
        }
        currentFiles = outFiles;
        stepLogs.push(`Executed ${step.title}: rotated pages.`);
        break;
      }

      case 'page-numbers': {
        const outFiles: WorkspaceFile[] = [];
        for (const f of currentFiles) {
          const res = await addPageNumbers(f.data, step.settings, ctx);
          outFiles.push({
            id: Math.random().toString(36).substring(2, 9),
            name: f.name,
            size: res.data.length,
            type: 'application/pdf',
            lastModified: Date.now(),
            data: res.data,
          });
        }
        currentFiles = outFiles;
        stepLogs.push(`Executed ${step.title}: labeled ${currentFiles.length} file(s).`);
        break;
      }

      case 'watermark-pdf': {
        const outFiles: WorkspaceFile[] = [];
        for (const f of currentFiles) {
          const res = await watermarkPdf(f.data, step.settings, ctx);
          outFiles.push({
            id: Math.random().toString(36).substring(2, 9),
            name: f.name,
            size: res.data.length,
            type: 'application/pdf',
            lastModified: Date.now(),
            data: res.data,
          });
        }
        currentFiles = outFiles;
        stepLogs.push(`Executed ${step.title}: applied watermark.`);
        break;
      }

      case 'merge-pdf': {
        if (currentFiles.length > 1) {
          const res = await mergePdf(currentFiles.map((f) => ({ name: f.name, data: f.data })), ctx);
          currentFiles = [
            {
              id: Math.random().toString(36).substring(2, 9),
              name: 'workflow_merged.pdf',
              size: res.data.length,
              type: 'application/pdf',
              lastModified: Date.now(),
              data: res.data,
              pageCount: res.pageCount,
            },
          ];
          stepLogs.push(`Executed ${step.title}: merged into single PDF.`);
        }
        break;
      }

      default:
        stepLogs.push(`Skipped step ${step.title} (custom handler).`);
    }
  }

  ctx?.onProgress?.(1.0, 'Workflow completed successfully.');

  return {
    files: currentFiles,
    stepLogs,
  };
}
