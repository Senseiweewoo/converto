import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface HighFidelityHtmlResult {
  data: Uint8Array;
  pageCount: number;
}

/**
 * High-fidelity HTML to PDF conversion.
 * Renders web content or raw HTML in an isolated DOM sandbox with full CSS, fonts, and images,
 * and exports crisp 2x retina PDF pages without artificial headers.
 */
export async function renderHtmlToPdfHighFidelity(
  htmlContent: string,
  onProgress?: (ratio: number, status: string) => void
): Promise<HighFidelityHtmlResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('High-fidelity DOM rendering requires a browser client environment.');
  }

  onProgress?.(0.2, 'Mounting HTML content into isolated sandbox container...');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-99999px';
  iframe.style.left = '-99999px';
  iframe.style.width = '794px'; // Standard A4 width at 96 DPI
  iframe.style.height = '1123px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = 'none';
  iframe.style.backgroundColor = '#ffffff';

  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('Could not access iframe document.');
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 40px;
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1a1a1a;
              background-color: #ffffff;
            }
            img { max-width: 100%; height: auto; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    doc.close();

    // Allow resources/images to render
    await new Promise((resolve) => setTimeout(resolve, 350));

    onProgress?.(0.5, 'Rasterizing HTML pages at 2x resolution...');

    const body = doc.body;
    const contentWidth = Math.max(body.scrollWidth, 794);
    const contentHeight = Math.max(body.scrollHeight, 1123);

    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: contentWidth,
      height: contentHeight,
      windowWidth: contentWidth,
      windowHeight: contentHeight,
    });

    onProgress?.(0.8, 'Slicing pages and compiling vector PDF...');

    const widthPt = contentWidth * 0.75;
    const pageHeightPx = Math.round(contentWidth * 1.414); // A4 aspect ratio
    const pageHeightPt = pageHeightPx * 0.75;
    const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [widthPt, pageHeightPt],
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
          currentSlicePx(currentHeightPx),
          0,
          0,
          canvas.width,
          currentSlicePx(currentHeightPx)
        );
      }

      function currentSlicePx(h: number) {
        return h;
      }

      const slicePt = (currentHeightPx / 2) * 0.75;

      if (p > 0) {
        pdf.addPage([widthPt, slicePt], 'portrait');
      }

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, slicePt, undefined, 'FAST');
    }

    onProgress?.(1.0, 'HTML to PDF conversion completed.');
    const pdfArrayBuffer = pdf.output('arraybuffer');
    return {
      data: new Uint8Array(pdfArrayBuffer),
      pageCount: totalPages,
    };
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
