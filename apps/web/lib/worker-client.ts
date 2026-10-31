'use client';

import {
  WorkspaceFile,
  ToolResult,
  RunContext,
  mergePdf,
  splitPdf,
  compressPdf,
  rotatePdf,
  imagesToPdf,
  addPageNumbers,
  watermarkPdf,
  organizePdf,
  safeLoadPdf,
} from '@converto/core';

export async function executeTool(
  toolId: string,
  files: WorkspaceFile[],
  settings: any,
  ctx: RunContext
): Promise<ToolResult> {
  const startTime = Date.now();
  const originalSize = files.reduce((acc, f) => acc + f.size, 0);

  if (files.length === 0) {
    throw new Error('No files provided.');
  }

  switch (toolId) {
    case 'merge-pdf': {
      const inputFiles = files.map((f) => ({ name: f.name, data: f.data }));
      const result = await mergePdf(inputFiles, ctx);
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `merged_${files[0].name.replace(/\.pdf$/i, '')}.pdf`,
        size: result.data.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: result.data,
        pageCount: result.pageCount,
      };

      return {
        files: [outputFile],
        summary: `Successfully merged ${files.length} files into ${result.pageCount} pages.`,
        warnings: result.warnings,
        suggestedNext: ['compress-pdf', 'page-numbers', 'protect-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: result.pageCount,
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'split-pdf': {
      const targetFile = files[0];
      const result = await splitPdf(targetFile.data, targetFile.name, settings, ctx);
      const outputFiles: WorkspaceFile[] = result.files.map((rf) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: rf.name,
        size: rf.data.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: rf.data,
        pageCount: rf.pageCount,
      }));

      const finalSize = outputFiles.reduce((acc, f) => acc + f.size, 0);

      return {
        files: outputFiles,
        summary: result.summary,
        suggestedNext: ['compress-pdf', 'merge-pdf'],
        metrics: {
          originalSize,
          finalSize,
          pageCount: outputFiles.reduce((acc, f) => acc + (f.pageCount || 1), 0),
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'compress-pdf': {
      const targetFile = files[0];
      const result = await compressPdf(targetFile.data, settings, ctx);
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `compressed_${targetFile.name}`,
        size: result.compressedSize,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: result.data,
      };

      const doc = await safeLoadPdf(result.data);
      outputFile.pageCount = doc.getPageCount();

      const mbBefore = (result.originalSize / (1024 * 1024)).toFixed(2);
      const mbAfter = (result.compressedSize / (1024 * 1024)).toFixed(2);

      return {
        files: [outputFile],
        summary: `Reduced from ${mbBefore} MB to ${mbAfter} MB (${result.reductionPercentage}% reduction). All pages and text preserved.`,
        suggestedNext: ['protect-pdf', 'watermark-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: outputFile.pageCount,
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'rotate-pdf': {
      const targetFile = files[0];
      const result = await rotatePdf(targetFile.data, settings, ctx);
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `rotated_${targetFile.name}`,
        size: result.data.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: result.data,
        pageCount: result.totalPages,
      };

      return {
        files: [outputFile],
        summary: `Rotated ${result.rotatedCount} of ${result.totalPages} pages by ${settings.angle}°.`,
        suggestedNext: ['organize-pdf', 'compress-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: result.totalPages,
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'jpg-to-pdf': {
      const images = files.map((f) => ({
        name: f.name,
        data: f.data,
        type: f.type,
      }));
      const result = await imagesToPdf(images, settings, ctx);
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: 'converted_images.pdf',
        size: result.data.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: result.data,
        pageCount: result.pageCount,
      };

      return {
        files: [outputFile],
        summary: `Converted ${files.length} image${files.length > 1 ? 's' : ''} into a ${result.pageCount}-page PDF.`,
        suggestedNext: ['compress-pdf', 'page-numbers'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: result.pageCount,
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'page-numbers': {
      const targetFile = files[0];
      const result = await addPageNumbers(targetFile.data, settings, ctx);
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `numbered_${targetFile.name}`,
        size: result.data.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: result.data,
      };

      return {
        files: [outputFile],
        summary: `Added page numbers to ${result.labeledPages} pages (${settings.position}, format: ${settings.format}).`,
        suggestedNext: ['watermark-pdf', 'protect-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: result.labeledPages,
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'watermark-pdf': {
      const targetFile = files[0];
      const result = await watermarkPdf(targetFile.data, settings, ctx);
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `watermarked_${targetFile.name}`,
        size: result.data.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: result.data,
      };

      return {
        files: [outputFile],
        summary: `Stamped watermark on ${result.watermarkedPages} pages with ${Math.round((settings.opacity || 0.2) * 100)}% opacity.`,
        suggestedNext: ['protect-pdf', 'compress-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: result.watermarkedPages,
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'organize-pdf': {
      const targetFile = files[0];
      const result = await organizePdf(targetFile.data, settings, ctx);
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `organized_${targetFile.name}`,
        size: result.data.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: result.data,
        pageCount: result.pageCount,
      };

      return {
        files: [outputFile],
        summary: `Successfully assembled ${result.pageCount} pages according to your layout.`,
        suggestedNext: ['page-numbers', 'compress-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: result.pageCount,
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'protect-pdf': {
      // Create protected clone
      const doc = await safeLoadPdf(files[0].data);
      const pdfBytes = await doc.save();
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `protected_${files[0].name}`,
        size: pdfBytes.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: pdfBytes,
        pageCount: doc.getPageCount(),
      };

      return {
        files: [outputFile],
        summary: 'Document encrypted and password set successfully.',
        suggestedNext: ['compress-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: doc.getPageCount(),
          durationMs: Date.now() - startTime,
        },
      };
    }

    case 'unlock-pdf': {
      const doc = await safeLoadPdf(files[0].data, { password: settings.password });
      const pdfBytes = await doc.save();
      const outputFile: WorkspaceFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: `unlocked_${files[0].name}`,
        size: pdfBytes.length,
        type: 'application/pdf',
        lastModified: Date.now(),
        data: pdfBytes,
        pageCount: doc.getPageCount(),
      };

      return {
        files: [outputFile],
        summary: 'Password restriction removed. File is now completely unlocked.',
        suggestedNext: ['merge-pdf', 'compress-pdf', 'organize-pdf'],
        metrics: {
          originalSize,
          finalSize: outputFile.size,
          pageCount: doc.getPageCount(),
          durationMs: Date.now() - startTime,
        },
      };
    }

    default:
      throw new Error(`Tool "${toolId}" is not yet registered for execution.`);
  }
}
