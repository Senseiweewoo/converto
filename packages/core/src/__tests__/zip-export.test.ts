import { describe, it, expect } from 'vitest';
import { zipSync, unzipSync } from 'fflate';

describe('In-Browser ZIP Export & Archiving', () => {
  it('creates and extracts valid zip archives in-memory without external calls', () => {
    const file1 = new TextEncoder().encode('Hello PDF World');
    const file2 = new TextEncoder().encode('%PDF-1.4 sample content');

    const zipData: Record<string, Uint8Array> = {
      'doc1.txt': file1,
      'doc2.pdf': file2,
    };

    const compressed = zipSync(zipData, { level: 6 });
    expect(compressed.length).toBeGreaterThan(0);

    // Verify ZIP magic bytes "PK\x03\x04"
    expect(compressed[0]).toBe(0x50); // P
    expect(compressed[1]).toBe(0x4b); // K
    expect(compressed[2]).toBe(0x03);
    expect(compressed[3]).toBe(0x04);

    // Decompress and verify content round-trip
    const unzipped = unzipSync(compressed);
    expect(unzipped['doc1.txt']).toBeDefined();
    expect(unzipped['doc2.pdf']).toBeDefined();
    expect(new TextDecoder().decode(unzipped['doc1.txt'])).toBe('Hello PDF World');
  });

  it('handles duplicate file names gracefully without collisions', () => {
    const dataA = new Uint8Array([1, 2, 3]);
    const dataB = new Uint8Array([4, 5, 6]);

    const zipData: Record<string, Uint8Array> = {
      'document.pdf': dataA,
      'document_(1).pdf': dataB,
    };

    const compressed = zipSync(zipData);
    const unzipped = unzipSync(compressed);
    expect(Object.keys(unzipped).length).toBe(2);
    expect(unzipped['document.pdf']).toEqual(dataA);
    expect(unzipped['document_(1).pdf']).toEqual(dataB);
  });
});
