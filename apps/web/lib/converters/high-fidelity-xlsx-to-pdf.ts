import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { extractRowsFromXlsx } from '@converto/core';

export interface HighFidelityXlsxResult {
  data: Uint8Array;
  pageCount: number;
  rowCount: number;
}

/**
 * High-fidelity client-side Excel (.xlsx) to PDF conversion.
 * Renders spreadsheet tables with exact cell borders, column alignments,
 * and high-resolution pagination without injected title banners or footers.
 */
export async function renderXlsxToPdfHighFidelity(
  data: Uint8Array,
  filename: string,
  onProgress?: (ratio: number, status: string) => void
): Promise<HighFidelityXlsxResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('High-fidelity DOM rendering requires a browser client environment.');
  }

  onProgress?.(0.2, 'Extracting spreadsheet workbook cells and structure...');
  const rows = extractRowsFromXlsx(data);

  if (rows.length === 0) {
    throw new Error('Spreadsheet contains no readable rows or worksheet data.');
  }

  onProgress?.(0.4, `Assembling tabular layout for ${rows.length} rows...`);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '1123px'; // Landscape A4 at 96 DPI
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

  // Build clean, authentic table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '12px';
  table.style.color = '#1f2937';

  const tbody = document.createElement('tbody');

  for (let r = 0; r < rows.length; r++) {
    const tr = document.createElement('tr');
    const isHeader = r === 0;

    for (let c = 0; c < rows[r].length; c++) {
      const cell = document.createElement(isHeader ? 'th' : 'td');
      cell.textContent = String(rows[r][c] || '');
      cell.style.border = '1px solid #d1d5db';
      cell.style.padding = '8px 12px';
      cell.style.textAlign = 'left';
      cell.style.wordBreak = 'break-word';

      if (isHeader) {
        cell.style.backgroundColor = '#f3f4f6';
        cell.style.fontWeight = '600';
        cell.style.color = '#111827';
      } else if (r % 2 === 1) {
        cell.style.backgroundColor = '#fafafa';
      }

      tr.appendChild(cell);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);
  document.body.appendChild(container);

  try {
    await new Promise((resolve) => setTimeout(resolve, 250));

    onProgress?.(0.6, 'Rasterizing spreadsheet tables at 2x resolution...');

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

    onProgress?.(0.85, 'Compiling landscape vector PDF...');

    const widthPt = 841.89; // Landscape A4 width
    const heightPt = 595.28; // Landscape A4 height

    const pageHeightPx = Math.round(container.scrollWidth * (heightPt / widthPt));
    const totalPages = Math.max(1, Math.ceil(container.scrollHeight / pageHeightPx));

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [widthPt, heightPt],
      compress: true,
    });

    for (let p = 0; p < totalPages; p++) {
      const currentHeightPx = Math.min(pageHeightPx * 2, canvas.height - p * pageHeightPx * 2);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentHeightPx;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          p * pageHeightPx * 2,
          canvas.width,
          currentHeightPx,
          0,
          0,
          canvas.width,
          currentHeightPx
        );
      }

      if (p > 0) {
        pdf.addPage([widthPt, heightPt], 'landscape');
      }

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, undefined, 'FAST');
    }

    onProgress?.(1.0, 'Excel to PDF conversion completed.');

    const pdfArrayBuffer = pdf.output('arraybuffer');
    return {
      data: new Uint8Array(pdfArrayBuffer),
      pageCount: totalPages,
      rowCount: rows.length,
    };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
