import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runCli } from '../index';
import { PDFDocument } from 'pdf-lib';

describe('Converto CLI test suite', () => {
  const tempDir = path.join(__dirname, 'temp_cli_test');
  const file1 = path.join(tempDir, 'test1.pdf');
  const file2 = path.join(tempDir, 'test2.pdf');
  const mergedOut = path.join(tempDir, 'merged_out.pdf');
  const splitOut = path.join(tempDir, 'split_out.pdf');
  const compOut = path.join(tempDir, 'comp_out.pdf');

  beforeEach(async () => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create fixture 1 (2 pages)
    const doc1 = await PDFDocument.create();
    doc1.addPage([200, 200]);
    doc1.addPage([200, 200]);
    fs.writeFileSync(file1, await doc1.save());

    // Create fixture 2 (1 page)
    const doc2 = await PDFDocument.create();
    doc2.addPage([200, 200]);
    fs.writeFileSync(file2, await doc2.save());
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('prints help message when --help is passed', async () => {
    const res = await runCli(['node', 'converto', '--help']);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Converto CLI');
  });

  it('merges multiple PDF files via CLI', async () => {
    const res = await runCli(['node', 'converto', 'merge', file1, file2, '-o', mergedOut]);
    expect(res.success).toBe(true);
    expect(fs.existsSync(mergedOut)).toBe(true);

    const mergedBytes = fs.readFileSync(mergedOut);
    const loaded = await PDFDocument.load(mergedBytes);
    expect(loaded.getPageCount()).toBe(3); // 2 + 1
  });

  it('splits PDF pages by range via CLI', async () => {
    const res = await runCli(['node', 'converto', 'split', file1, '--pages', '1', '-o', splitOut]);
    expect(res.success).toBe(true);
    expect(fs.existsSync(splitOut)).toBe(true);

    const splitBytes = fs.readFileSync(splitOut);
    const loaded = await PDFDocument.load(splitBytes);
    expect(loaded.getPageCount()).toBe(1);
  });

  it('compresses PDF via CLI', async () => {
    const res = await runCli(['node', 'converto', 'compress', file1, '-o', compOut, '--level', 'strong']);
    expect(res.success).toBe(true);
    expect(fs.existsSync(compOut)).toBe(true);
  });

  it('inspects PDF info via CLI', async () => {
    const res = await runCli(['node', 'converto', 'info', file1]);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Pages: 2');
  });

  it('handles errors gracefully when file is missing', async () => {
    const res = await runCli(['node', 'converto', 'info', 'non_existent_document.pdf']);
    expect(res.success).toBe(false);
    expect(res.message).toContain('Error: Input PDF file not found');
  });
});
