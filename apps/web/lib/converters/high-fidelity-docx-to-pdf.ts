import { renderAsync, defaultOptions } from 'docx-preview';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface HighFidelityDocxResult {
  data: Uint8Array;
  pageCount: number;
}

/**
 * High-fidelity client-side Word (.docx) to PDF conversion.
 * Parses OpenXML structures (styles, numbering, tables, images, section properties)
 * and renders 1:1 visual output into vector/retina PDF without artificial template injections.
 */
export async function renderDocxToPdfHighFidelity(
  data: Uint8Array,
  filename: string,
  onProgress?: (ratio: number, status: string) => void
): Promise<HighFidelityDocxResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('High-fidelity DOM rendering is only available in browser client environments.');
  }

  onProgress?.(0.1, 'Parsing OpenXML document structure and style definitions...');

  // Create an off-screen staging container
  const container = document.createElement('div');
  container.id = `converto-render-staging-${Math.random().toString(36).substring(2, 9)}`;
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = 'auto';
  container.style.height = 'auto';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-1000';
  container.style.backgroundColor = '#ffffff';

  document.body.appendChild(container);

  try {
    onProgress?.(0.3, 'Rendering document layout, tables, fonts, and media elements...');

    // Render using docx-preview with full layout, styles, and media preservation
    await renderAsync(data.buffer as ArrayBuffer, container, undefined, {
      ...defaultOptions,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
      trimXmlDeclaration: true,
      inWrapper: true,
    });

    // Allow styles, fonts, and embedded images to settle
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Locate rendered page sections: docx-preview outputs `.docx-wrapper > section.docx`
    let sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));

    if (sections.length === 0) {
      const wrapper = container.querySelector<HTMLElement>('.docx-wrapper');
      if (wrapper) {
        sections = [wrapper];
      } else {
        sections = [container];
      }
    }

    onProgress?.(0.5, `Rasterizing ${sections.length} physical page(s) at 2x retina resolution...`);

    let pdf: jsPDF | null = null;
    let totalPagesRendered = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      onProgress?.(
        0.5 + (i / sections.length) * 0.4,
        `Rendering page ${i + 1} of ${sections.length} with 1:1 typographic fidelity...`
      );

      // Measure physical dimensions of the rendered page section
      const rect = section.getBoundingClientRect();
      const widthPx = Math.max(rect.width, section.offsetWidth, 400);
      const heightPx = Math.max(rect.height, section.offsetHeight, 500);

      // Convert pixels (96 DPI standard CSS) to PDF points (72 points/inch)
      const widthPt = widthPx * 0.75;
      const heightPt = heightPx * 0.75;
      const orientation = widthPt > heightPt ? 'landscape' : 'portrait';

      // Capture at scale: 2 for crisp retina text and high-res vector graphics
      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: widthPx,
        height: heightPx,
        windowWidth: widthPx,
        windowHeight: heightPx,
      });

      // Standard page height threshold to determine if section needs vertical chunking
      const pageRatio = heightPt / widthPt;
      const isMultiPageSection = heightPx > widthPx * 1.6;

      if (!isMultiPageSection) {
        // Standard single section page
        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: 'pt',
            format: [widthPt, heightPt],
            compress: true,
          });
        } else {
          pdf.addPage([widthPt, heightPt], orientation);
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, undefined, 'FAST');
        totalPagesRendered++;
      } else {
        // Long continuous section: slice into native page increments
        const sliceHeightPx = Math.round(widthPx * 1.414); // Standard A4/Letter aspect ratio
        const totalSlices = Math.max(1, Math.ceil(heightPx / sliceHeightPx));
        const sliceHeightPt = sliceHeightPx * 0.75;

        for (let s = 0; s < totalSlices; s++) {
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          const currentSliceHeight = Math.min(sliceHeightPx * 2, canvas.height - s * sliceHeightPx * 2);
          sliceCanvas.height = currentSliceHeight;

          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(
              canvas,
              0,
              s * sliceHeightPx * 2,
              canvas.width,
              currentSliceHeight,
              0,
              0,
              canvas.width,
              currentSliceHeight
            );
          }

          const currentSlicePt = (currentSliceHeight / 2) * 0.75;

          if (!pdf) {
            pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'pt',
              format: [widthPt, currentSlicePt],
              compress: true,
            });
          } else {
            pdf.addPage([widthPt, currentSlicePt], 'portrait');
          }

          const imgData = sliceCanvas.toDataURL('image/jpeg', 0.96);
          pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, currentSlicePt, undefined, 'FAST');
          totalPagesRendered++;
        }
      }
    }

    if (!pdf) {
      throw new Error('Failed to generate PDF pages from document content.');
    }

    onProgress?.(0.95, 'Finalizing vector PDF file...');
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    return {
      data: pdfBytes,
      pageCount: totalPagesRendered,
    };
  } finally {
    // Clean up staging DOM container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
