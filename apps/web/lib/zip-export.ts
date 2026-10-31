import { zipSync } from 'fflate';

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export function createZipArchive(entries: ZipEntry[]): Uint8Array {
  const zipData: Record<string, Uint8Array> = {};

  // Deduplicate file names if any
  const nameCounts: Record<string, number> = {};

  for (const entry of entries) {
    let cleanName = entry.name;
    if (nameCounts[cleanName] !== undefined) {
      nameCounts[cleanName]++;
      const ext = cleanName.includes('.') ? cleanName.split('.').pop() : '';
      const base = cleanName.replace(`.${ext}`, '');
      cleanName = `${base}_(${nameCounts[cleanName]}).${ext}`;
    } else {
      nameCounts[cleanName] = 0;
    }
    zipData[cleanName] = entry.data;
  }

  return zipSync(zipData, { level: 6 });
}

export function downloadZip(zipBytes: Uint8Array, archiveName = 'converto_batch.zip'): void {
  const blob = new Blob([zipBytes as any], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = archiveName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
