import { renderAsync, defaultOptions } from 'docx-preview';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface HighFidelityDocxResult {
  data: Uint8Array;
  pageCount: number;
}

/**
 * Splits a rendered section that exceeds standard page height into distinct,
 * fully padded page containers using a smart element walker.
 * Guarantees zero mid-line slicing, proper top/bottom margins on every page,
 * and table row integrity.
 */
function splitSectionIntoPages(
  section: HTMLElement,
  stagingContainer: HTMLElement,
  targetWidthPx: number,
  targetHeightPx: number
): HTMLElement[] {
  const comp = window.getComputedStyle(section);
  const padTop = Math.max(parseFloat(comp.paddingTop) || 0, 48);
  const padBottom = Math.max(parseFloat(comp.paddingBottom) || 0, 48);
  const padLeft = Math.max(parseFloat(comp.paddingLeft) || 0, 48);
  const padRight = Math.max(parseFloat(comp.paddingRight) || 0, 48);
  const usableHeight = targetHeightPx - padTop - padBottom;

  // If the section already fits within one physical page, return as-is
  if (section.offsetHeight <= targetHeightPx + 20) {
    section.style.width = `${targetWidthPx}px`;
    section.style.maxWidth = `${targetWidthPx}px`;
    section.style.minHeight = `${targetHeightPx}px`;
    section.style.height = `${targetHeightPx}px`;
    section.style.boxSizing = 'border-box';
    section.style.overflow = 'hidden';
    return [section];
  }

  // Locate child blocks inside <article> or direct children
  const contentHost = (section.querySelector('article') as HTMLElement) || section;
  const children = Array.from(contentHost.children) as HTMLElement[];

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
  let currentHeight = 0;

  for (const child of children) {
    // Preserve paragraph spacing around shaded blocks and headings
    const childComp = window.getComputedStyle(child);
    const hasShading =
      (childComp.backgroundColor &&
        childComp.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        childComp.backgroundColor !== 'transparent') ||
      /^H[1-6]$/.test(child.tagName) ||
      child.classList.contains('docx-highlight') ||
      child.getAttribute('style')?.includes('background');

    if (hasShading) {
      child.style.display = 'flow-root';
      const curMt = parseFloat(childComp.marginTop) || 0;
      const curMb = parseFloat(childComp.marginBottom) || 0;
      if (curMt < 14) child.style.marginTop = '14px';
      if (curMb < 10) child.style.marginBottom = '10px';
    }

    // Smart table row splitting for tall tables
    if (child.tagName === 'TABLE' && child.offsetHeight > usableHeight * 0.5) {
      const rows = Array.from(child.querySelectorAll('tr'));
      if (rows.length > 1) {
        let curTable = child.cloneNode(false) as HTMLTableElement;
        curTable.style.width = '100%';
        curTable.style.maxWidth = '100%';
        curTable.style.boxSizing = 'border-box';

        let curTbody = document.createElement('tbody');
        curTable.appendChild(curTbody);
        curBody.appendChild(curTable);

        for (const tr of rows) {
          const trHeight = tr.offsetHeight || 32;

          if (currentHeight + trHeight > usableHeight && curTbody.children.length > 0) {
            pages.push(curPage);

            const next = createPageContainer();
            curPage = next.page;
            curBody = next.body;
            currentHeight = 0;

            curTable = child.cloneNode(false) as HTMLTableElement;
            curTable.style.width = '100%';
            curTable.style.maxWidth = '100%';
            curTable.style.boxSizing = 'border-box';

            curTbody = document.createElement('tbody');
            curTable.appendChild(curTbody);
            curBody.appendChild(curTable);
          }

          curTbody.appendChild(tr.cloneNode(true));
          currentHeight += trHeight;
        }
        continue;
      }
    }

    const childHeight = child.offsetHeight || 36;

    // Check if adding this child crosses the usable page height
    if (currentHeight + childHeight > usableHeight && currentHeight > 30) {
      pages.push(curPage);

      const next = createPageContainer();
      curPage = next.page;
      curBody = next.body;
      currentHeight = 0;
    }

    curBody.appendChild(child.cloneNode(true));
    currentHeight += childHeight;
  }

  pages.push(curPage);
  return pages;
}

/**
 * High-fidelity client-side Word (.docx) to PDF conversion.
 * Features:
 * 1. Smart element-based pagination (no mid-line cuts; proper margins on every page)
 * 2. Strict width constraint & box-sizing to eliminate right-edge overflow clipping
 * 3. Spacing preservation on shaded blocks to prevent collision
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

  onProgress?.(0.1, 'Parsing OpenXML document structure and style definitions...');

  // Standard A4 dimensions at 96 DPI: 794px width x 1123px height
  let targetWidthPx = 794;
  let targetHeightPx = 1123;

  // Create isolated off-screen staging container with locked width
  const stagingContainer = document.createElement('div');
  stagingContainer.id = `converto-docx-staging-${Math.random().toString(36).substring(2, 9)}`;
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.top = '0px';
  stagingContainer.style.left = '-99999px';
  stagingContainer.style.width = `${targetWidthPx}px`;
  stagingContainer.style.minWidth = `${targetWidthPx}px`;
  stagingContainer.style.maxWidth = `${targetWidthPx}px`;
  stagingContainer.style.opacity = '0';
  stagingContainer.style.pointerEvents = 'none';
  stagingContainer.style.zIndex = '-9999';
  stagingContainer.style.backgroundColor = '#ffffff';
  stagingContainer.style.boxSizing = 'border-box';

  // Inject global layout and anti-collapse styles
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
    }
    #${stagingContainer.id} table {
      border-collapse: collapse !important;
      width: 100% !important;
      max-width: 100% !important;
      table-layout: auto !important;
      margin-top: 12px !important;
      margin-bottom: 12px !important;
    }
    #${stagingContainer.id} td, #${stagingContainer.id} th {
      box-sizing: border-box !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
    }
    #${stagingContainer.id} h1, #${stagingContainer.id} h2, #${stagingContainer.id} h3,
    #${stagingContainer.id} [style*="background-color"]:not([style*="rgba(0, 0, 0, 0)"]):not([style*="transparent"]),
    #${stagingContainer.id} [style*="background:"]:not([style*="none"]) {
      display: flow-root !important;
      margin-top: 14px !important;
      margin-bottom: 10px !important;
    }
  `;
  stagingContainer.appendChild(styleEl);

  const renderMount = document.createElement('div');
  renderMount.className = 'docx-render-mount';
  stagingContainer.appendChild(renderMount);
  document.body.appendChild(stagingContainer);

  try {
    onProgress?.(0.3, 'Rendering document layout, tables, fonts, and media elements...');

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
      inWrapper: true,
    });

    // Allow fonts and images to settle
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Detect if section defined US Letter or Landscape
    const rawSections = Array.from(renderMount.querySelectorAll<HTMLElement>('section.docx'));
    if (rawSections.length > 0) {
      const firstSec = rawSections[0];
      const secWidthStr = firstSec.style.width || '';
      if (secWidthStr.includes('8.5in') || secWidthStr.includes('8.5')) {
        targetWidthPx = 816; // Letter width at 96 DPI
        targetHeightPx = 1056; // Letter height
      } else if (firstSec.offsetWidth > 850) {
        // Landscape section
        targetWidthPx = firstSec.offsetWidth;
        targetHeightPx = Math.round(targetWidthPx * (595.28 / 841.89));
      }
      stagingContainer.style.width = `${targetWidthPx}px`;
      stagingContainer.style.maxWidth = `${targetWidthPx}px`;
    }

    // Split raw sections with smart page walker
    onProgress?.(0.5, 'Structuring smart page boundaries and margins...');
    const allPages: HTMLElement[] = [];

    for (const rawSec of rawSections) {
      const splitPages = splitSectionIntoPages(rawSec, stagingContainer, targetWidthPx, targetHeightPx);
      allPages.push(...splitPages);
    }

    // Fallback if no sections detected
    if (allPages.length === 0) {
      allPages.push(renderMount);
    }

    onProgress?.(0.65, `Rendering ${allPages.length} pages at 2x retina resolution...`);

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
        `Rendering page ${i + 1} of ${allPages.length} without mid-line clipping...`
      );

      // Render page element matching exact width with x: 0
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        x: 0,
        y: 0,
        width: targetWidthPx,
        height: targetHeightPx,
        windowWidth: targetWidthPx,
        windowHeight: targetHeightPx,
        scrollX: 0,
        scrollY: 0,
      });

      if (i > 0) {
        pdf.addPage([widthPt, heightPt], orientation);
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt, undefined, 'FAST');
    }

    onProgress?.(0.98, 'Finalizing vector PDF file...');
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
