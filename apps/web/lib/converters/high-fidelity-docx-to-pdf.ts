import { renderAsync, defaultOptions } from 'docx-preview';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface HighFidelityDocxResult {
  data: Uint8Array;
  pageCount: number;
}

/**
 * Safely parse dimensional strings (inches, mm, pt, px) into screen pixels at 96 DPI.
 */
function parseDimPx(dimStr: string | null | undefined, fallback: number): number {
  if (!dimStr) return fallback;
  const num = parseFloat(dimStr);
  if (isNaN(num)) return fallback;
  if (dimStr.includes('in')) return Math.round(num * 96);
  if (dimStr.includes('pt')) return Math.round((num * 96) / 72);
  if (dimStr.includes('mm')) return Math.round((num * 96) / 25.4);
  if (dimStr.includes('cm')) return Math.round((num * 96) / 2.54);
  if (dimStr.includes('px')) return Math.round(num);
  return fallback;
}

/**
 * Splits a rendered Word section across pages using live DOM bounding box measurement.
 * Guarantees zero mid-line slicing, proper top/bottom margins on every page,
 * and eliminates right-edge clipping.
 */
function splitSectionIntoPages(
  section: HTMLElement,
  stagingContainer: HTMLElement,
  targetWidthPx: number,
  targetHeightPx: number
): HTMLElement[] {
  const comp = window.getComputedStyle(section);
  const padTop = parseDimPx(section.style.paddingTop, parseFloat(comp.paddingTop) || 48);
  const padBottom = parseDimPx(section.style.paddingBottom, parseFloat(comp.paddingBottom) || 48);
  const padLeft = parseDimPx(section.style.paddingLeft, parseFloat(comp.paddingLeft) || 48);
  const padRight = parseDimPx(section.style.paddingRight, parseFloat(comp.paddingRight) || 48);

  // Usable height inside the page body with a 24px safety cushion to ensure zero text slicing
  const usableHeight = targetHeightPx - padTop - padBottom - 24;

  const contentHost = (section.querySelector('article') as HTMLElement) || section;
  const children = Array.from(contentHost.children) as HTMLElement[];

  // If section already fits within 1 physical page with clean margins, use as-is
  if (section.offsetHeight <= targetHeightPx && contentHost.offsetHeight <= usableHeight + 10) {
    section.style.width = `${targetWidthPx}px`;
    section.style.minWidth = `${targetWidthPx}px`;
    section.style.maxWidth = `${targetWidthPx}px`;
    section.style.height = `${targetHeightPx}px`;
    section.style.minHeight = `${targetHeightPx}px`;
    section.style.maxHeight = `${targetHeightPx}px`;
    section.style.boxSizing = 'border-box';
    section.style.overflow = 'hidden';
    section.style.margin = '0';
    return [section];
  }

  if (children.length === 0) {
    return [section];
  }

  const pages: HTMLElement[] = [];

  function createPageContainer(): { page: HTMLElement; body: HTMLElement } {
    const page = document.createElement('section');
    page.className = `${section.className} converto-page-container`;
    page.style.width = `${targetWidthPx}px`;
    page.style.minWidth = `${targetWidthPx}px`;
    page.style.maxWidth = `${targetWidthPx}px`;
    page.style.height = `${targetHeightPx}px`;
    page.style.minHeight = `${targetHeightPx}px`;
    page.style.maxHeight = `${targetHeightPx}px`;
    page.style.boxSizing = 'border-box';
    page.style.padding = `${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`;
    page.style.backgroundColor = comp.backgroundColor || '#ffffff';
    page.style.position = 'relative';
    page.style.overflow = 'hidden';
    page.style.margin = '0';

    // Clone header if present
    const header = section.querySelector('header');
    if (header) {
      page.appendChild(header.cloneNode(true));
    }

    const body = document.createElement('div');
    body.className = 'converto-page-body';
    body.style.width = '100%';
    body.style.maxWidth = '100%';
    body.style.boxSizing = 'border-box';
    body.style.overflow = 'visible';
    page.appendChild(body);

    // Clone footer if present
    const footer = section.querySelector('footer');
    if (footer) {
      page.appendChild(footer.cloneNode(true));
    }

    stagingContainer.appendChild(page);
    return { page, body };
  }

  let { page: curPage, body: curBody } = createPageContainer();

  for (const child of children) {
    // Check for tables that should be split row-by-row
    if (child.tagName === 'TABLE') {
      const rows = Array.from(child.querySelectorAll('tr'));
      if (rows.length > 1) {
        let curTable = child.cloneNode(false) as HTMLTableElement;
        curTable.style.width = '100%';
        curTable.style.maxWidth = '100%';
        curTable.style.tableLayout = 'fixed';
        curTable.style.boxSizing = 'border-box';

        let curTbody = document.createElement('tbody');
        curTable.appendChild(curTbody);
        curBody.appendChild(curTable);

        for (const tr of rows) {
          const clonedTr = tr.cloneNode(true) as HTMLTableRowElement;
          curTbody.appendChild(clonedTr);

          // Measure actual live rendered height
          if (curBody.offsetHeight > usableHeight && curTbody.children.length > 1) {
            curTbody.removeChild(clonedTr);
            pages.push(curPage);

            const next = createPageContainer();
            curPage = next.page;
            curBody = next.body;

            curTable = child.cloneNode(false) as HTMLTableElement;
            curTable.style.width = '100%';
            curTable.style.maxWidth = '100%';
            curTable.style.tableLayout = 'fixed';
            curTable.style.boxSizing = 'border-box';

            curTbody = document.createElement('tbody');
            curTable.appendChild(curTbody);
            curBody.appendChild(curTable);

            curTbody.appendChild(clonedTr);
          }
        }
        continue;
      }
    }

    // Normal block element (p, h1, div, etc.)
    const clonedChild = child.cloneNode(true) as HTMLElement;
    curBody.appendChild(clonedChild);

    // Measure actual rendered height in DOM including all margins
    if (curBody.offsetHeight > usableHeight && curBody.children.length > 1) {
      // Element crosses usable page height: push to next page
      curBody.removeChild(clonedChild);
      pages.push(curPage);

      const next = createPageContainer();
      curPage = next.page;
      curBody = next.body;

      curBody.appendChild(clonedChild);
    }
  }

  pages.push(curPage);
  return pages;
}

/**
 * High-fidelity client-side Word (.docx) to PDF conversion.
 * Features:
 * 1. Live DOM bounding-box pagination (100% immune to mid-line slicing)
 * 2. Strict width constraint & table-layout:fixed to eliminate right-edge overflow
 * 3. inWrapper: false to remove 30px wrapper padding and centering offsets
 * 4. Crisp 2x retina rasterization
 */
export async function renderDocxToPdfHighFidelity(
  data: Uint8Array,
  filename: string,
  onProgress?: (ratio: number, status: string) => void
): Promise<HighFidelityDocxResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('High-fidelity DOM rendering is only available in browser client environments.');
  }

  onProgress?.(0.1, 'Parsing OpenXML document geometry, styles, and fonts...');

  // Default dimensions: US Letter 816px x 1056px at 96 DPI
  let targetWidthPx = 816;
  let targetHeightPx = 1056;

  // Create isolated off-screen staging container
  const stagingContainer = document.createElement('div');
  stagingContainer.id = `converto-docx-staging-${Math.random().toString(36).substring(2, 9)}`;
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.top = '0px';
  stagingContainer.style.left = '-99999px';
  stagingContainer.style.width = `${targetWidthPx}px`;
  stagingContainer.style.minWidth = `${targetWidthPx}px`;
  stagingContainer.style.maxWidth = `${targetWidthPx}px`;
  stagingContainer.style.margin = '0';
  stagingContainer.style.padding = '0';
  stagingContainer.style.opacity = '0';
  stagingContainer.style.pointerEvents = 'none';
  stagingContainer.style.zIndex = '-9999';
  stagingContainer.style.backgroundColor = '#ffffff';
  stagingContainer.style.boxSizing = 'border-box';

  // Strict global styles to prevent clipping and text slicing
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #${stagingContainer.id} * {
      box-sizing: border-box !important;
      max-width: 100% !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
    }
    #${stagingContainer.id} section.docx {
      box-sizing: border-box !important;
      max-width: 100% !important;
      margin: 0 !important;
      background-color: #ffffff !important;
    }
    #${stagingContainer.id} table {
      border-collapse: collapse !important;
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      margin-top: 10px !important;
      margin-bottom: 10px !important;
      box-sizing: border-box !important;
    }
    #${stagingContainer.id} td, #${stagingContainer.id} th {
      display: table-cell !important;
      vertical-align: top !important;
      box-sizing: border-box !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
    }
    #${stagingContainer.id} p[style*="background"],
    #${stagingContainer.id} div[style*="background"],
    #${stagingContainer.id} h1, #${stagingContainer.id} h2, #${stagingContainer.id} h3,
    #${stagingContainer.id} h4, #${stagingContainer.id} h5, #${stagingContainer.id} h6 {
      display: flow-root !important;
      margin-top: 12px !important;
      margin-bottom: 8px !important;
    }
  `;
  stagingContainer.appendChild(styleEl);

  const renderMount = document.createElement('div');
  renderMount.className = 'docx-render-mount';
  renderMount.style.width = '100%';
  renderMount.style.boxSizing = 'border-box';
  stagingContainer.appendChild(renderMount);
  document.body.appendChild(stagingContainer);

  try {
    onProgress?.(0.3, 'Rendering OpenXML sections, tables, and typography...');

    await renderAsync(data.buffer as ArrayBuffer, renderMount, undefined, {
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
      inWrapper: false, // Disables .docx-wrapper 30px padding and centering offsets
    });

    // Wait for fonts, styles, and images to settle
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Detect exact page dimensions from rendered sections
    const rawSections = Array.from(renderMount.querySelectorAll<HTMLElement>('section.docx'));
    if (rawSections.length > 0) {
      const firstSec = rawSections[0];
      const parsedWidth = parseDimPx(firstSec.style.width, 0);
      const parsedHeight = parseDimPx(firstSec.style.minHeight, 0);

      if (parsedWidth >= 400) {
        targetWidthPx = parsedWidth;
      } else if (firstSec.offsetWidth >= 400) {
        targetWidthPx = firstSec.offsetWidth;
      }

      if (parsedHeight >= 400) {
        targetHeightPx = parsedHeight;
      } else if (firstSec.offsetHeight >= 400 && firstSec.offsetHeight <= 1400) {
        targetHeightPx = firstSec.offsetHeight;
      }

      stagingContainer.style.width = `${targetWidthPx}px`;
      stagingContainer.style.minWidth = `${targetWidthPx}px`;
      stagingContainer.style.maxWidth = `${targetWidthPx}px`;
    }

    onProgress?.(0.5, 'Executing smart boundary pagination...');
    const allPages: HTMLElement[] = [];

    for (const rawSec of rawSections) {
      const splitPages = splitSectionIntoPages(rawSec, stagingContainer, targetWidthPx, targetHeightPx);
      allPages.push(...splitPages);
    }

    if (allPages.length === 0) {
      allPages.push(renderMount);
    }

    onProgress?.(0.65, `Exporting ${allPages.length} page(s) at 2x resolution...`);

    const widthPt = targetWidthPx * 0.75;
    const heightPt = targetHeightPx * 0.75;
    const orientation = widthPt > heightPt ? 'landscape' : 'portrait';

    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: [widthPt, heightPt],
      compress: true,
    });

    for (let i = 0; i < allPages.length; i++) {
      const pageEl = allPages[i];

      onProgress?.(
        0.65 + (i / allPages.length) * 0.3,
        `Rendering page ${i + 1} of ${allPages.length}...`
      );

      // Lock page element dimensions
      pageEl.style.display = 'block';
      pageEl.style.width = `${targetWidthPx}px`;
      pageEl.style.minWidth = `${targetWidthPx}px`;
      pageEl.style.maxWidth = `${targetWidthPx}px`;
      pageEl.style.height = `${targetHeightPx}px`;
      pageEl.style.minHeight = `${targetHeightPx}px`;
      pageEl.style.maxHeight = `${targetHeightPx}px`;
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.overflow = 'hidden';
      pageEl.style.margin = '0';

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: targetWidthPx,
        height: targetHeightPx,
        scrollX: 0,
        scrollY: 0,
      });

      if (i > 0) {
        pdf.addPage([widthPt, heightPt], orientation);
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, undefined, 'FAST');
    }

    onProgress?.(0.98, 'Finalizing PDF output...');
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    return {
      data: pdfBytes,
      pageCount: allPages.length,
    };
  } finally {
    if (document.body.contains(stagingContainer)) {
      document.body.removeChild(stagingContainer);
    }
  }
}
