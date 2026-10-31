import * as fs from 'fs';
import * as path from 'path';
import { 
  mergePdf, 
  splitPdf, 
  compressPdf, 
  rotatePdf, 
  safeLoadPdf 
} from '@converto/core';

export interface CliCommandResult {
  success: boolean;
  message: string;
  outputFilePath?: string;
  bytesWritten?: number;
}

export async function runCli(argv: string[]): Promise<CliCommandResult> {
  const args = argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    return {
      success: true,
      message: `
Converto CLI - Private, Local PDF Processing Toolkit

Usage:
  converto <command> [options]

Commands:
  merge <file1.pdf> <file2.pdf> ... -o <output.pdf>
      Merge multiple PDF files into one.

  split <input.pdf> --pages <1-3,5> -o <output.pdf>
      Split PDF by page ranges (1-indexed).

  compress <input.pdf> -o <output.pdf> [--level basic|strong|extreme]
      Compress PDF file with optimization presets.

  rotate <input.pdf> -o <output.pdf> [--angle 90|180|270]
      Rotate all pages of a PDF file.

  info <input.pdf>
      Inspect PDF metadata, page count, and dimensions.

Options:
  -o, --output    Output file path
  --level         Compression preset (basic, strong, extreme)
  --angle         Rotation angle in degrees (90, 180, 270)
  --pages         Page range specification (e.g. 1-3, 5, 7-9)
  -h, --help      Show this help documentation
`,
    };
  }

  try {
    switch (command) {
      case 'merge': {
        const outIdx = args.findIndex((a) => a === '-o' || a === '--output');
        if (outIdx === -1 || !args[outIdx + 1]) {
          throw new Error('Missing required output flag -o <output.pdf>');
        }
        const outputPath = args[outIdx + 1];

        // Filter out flag and its value
        const inputFiles: string[] = [];
        for (let i = 1; i < args.length; i++) {
          if (i === outIdx || i === outIdx + 1) continue;
          if (args[i].startsWith('-')) continue;
          inputFiles.push(args[i]);
        }

        if (inputFiles.length < 2) {
          throw new Error('Merge requires at least 2 input PDF files.');
        }

        const filesToMerge: { name: string; data: Uint8Array }[] = [];
        for (const f of inputFiles) {
          if (!fs.existsSync(f)) throw new Error(`Input file not found: ${f}`);
          filesToMerge.push({
            name: path.basename(f),
            data: new Uint8Array(fs.readFileSync(f)),
          });
        }

        const mergeResult = await mergePdf(filesToMerge);
        fs.writeFileSync(outputPath, Buffer.from(mergeResult.data));
        return {
          success: true,
          message: `Successfully merged ${inputFiles.length} files into ${outputPath} (${mergeResult.data.length} bytes)`,
          outputFilePath: outputPath,
          bytesWritten: mergeResult.data.length,
        };
      }

      case 'split': {
        const input = args[1];
        if (!input || !fs.existsSync(input)) {
          throw new Error(`Input PDF file not found: ${input}`);
        }

        const pagesIdx = args.findIndex((a) => a === '--pages');
        const pagesStr = pagesIdx !== -1 ? args[pagesIdx + 1] : undefined;
        if (!pagesStr) {
          throw new Error('Missing --pages argument (e.g. --pages 1-3,5)');
        }

        const outIdx = args.findIndex((a) => a === '-o' || a === '--output');
        const outputPath = outIdx !== -1 ? args[outIdx + 1] : 'split_output.pdf';

        const fileBytes = new Uint8Array(fs.readFileSync(input));
        const splitResult = await splitPdf(fileBytes, path.basename(input), {
          mode: 'ranges',
          ranges: pagesStr,
          mergeRangesIntoOne: true,
        });

        if (!splitResult.files || splitResult.files.length === 0) {
          throw new Error(`No pages found matching range "${pagesStr}".`);
        }

        const fileData = splitResult.files[0].data;
        fs.writeFileSync(outputPath, Buffer.from(fileData));
        return {
          success: true,
          message: `Successfully split pages [${pagesStr}] to ${outputPath}`,
          outputFilePath: outputPath,
          bytesWritten: fileData.length,
        };
      }

      case 'compress': {
        const input = args[1];
        if (!input || !fs.existsSync(input)) {
          throw new Error(`Input PDF file not found: ${input}`);
        }

        const levelIdx = args.findIndex((a) => a === '--level');
        const level = (levelIdx !== -1 ? args[levelIdx + 1] : 'strong') as 'basic' | 'strong' | 'extreme';

        const outIdx = args.findIndex((a) => a === '-o' || a === '--output');
        const outputPath = outIdx !== -1 ? args[outIdx + 1] : 'compressed_output.pdf';

        const fileBytes = new Uint8Array(fs.readFileSync(input));
        const result = await compressPdf(fileBytes, {
          preset: ['basic', 'strong', 'extreme'].includes(level) ? level : 'strong',
          removeMetadata: true,
        });

        fs.writeFileSync(outputPath, Buffer.from(result.data));
        return {
          success: true,
          message: `Compressed ${input} from ${result.originalSize} to ${result.compressedSize} bytes -> ${outputPath}`,
          outputFilePath: outputPath,
          bytesWritten: result.compressedSize,
        };
      }

      case 'rotate': {
        const input = args[1];
        if (!input || !fs.existsSync(input)) {
          throw new Error(`Input PDF file not found: ${input}`);
        }

        const angleIdx = args.findIndex((a) => a === '--angle');
        const angle = angleIdx !== -1 ? parseInt(args[angleIdx + 1], 10) : 90;

        const outIdx = args.findIndex((a) => a === '-o' || a === '--output');
        const outputPath = outIdx !== -1 ? args[outIdx + 1] : 'rotated_output.pdf';

        const fileBytes = new Uint8Array(fs.readFileSync(input));
        const resultBytes = await rotatePdf(fileBytes, {
          angle: (angle as any) || 90,
          targetPages: 'all',
        });

        fs.writeFileSync(outputPath, Buffer.from(resultBytes));
        return {
          success: true,
          message: `Rotated ${input} by ${angle}° -> ${outputPath}`,
          outputFilePath: outputPath,
          bytesWritten: resultBytes.length,
        };
      }

      case 'info': {
        const input = args[1];
        if (!input || !fs.existsSync(input)) {
          throw new Error(`Input PDF file not found: ${input}`);
        }

        const fileBytes = new Uint8Array(fs.readFileSync(input));
        const doc = await safeLoadPdf(fileBytes);
        const pageCount = doc.getPageCount();
        const title = doc.getTitle() || 'Untitled';
        const author = doc.getAuthor() || 'Unknown';

        return {
          success: true,
          message: `
File: ${input}
Size: ${(fileBytes.length / 1024).toFixed(1)} KB
Pages: ${pageCount}
Title: ${title}
Author: ${author}
`,
        };
      }

      default:
        throw new Error(`Unknown command "${command}". Run "converto --help" for available commands.`);
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Error: ${err?.message || 'Operation failed'}`,
    };
  }
}
