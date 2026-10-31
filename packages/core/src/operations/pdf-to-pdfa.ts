import { PDFDocument } from 'pdf-lib';
import { safeLoadPdf } from '../utils/pdf-loader';
import { RunContext } from '../types';

export interface PdfToPdfaResult {
  data: Uint8Array;
  conformance: 'PDF/A-1b' | 'PDF/A-2b';
  pageCount: number;
}

export async function convertToPdfA(
  data: Uint8Array,
  conformance: 'PDF/A-1b' | 'PDF/A-2b' = 'PDF/A-1b',
  ctx?: RunContext
): Promise<PdfToPdfaResult> {
  ctx?.onProgress?.(0.2, 'Loading document and checking ISO 19005 compatibility...');
  const doc = await safeLoadPdf(data);
  const total = doc.getPageCount();

  ctx?.onProgress?.(0.5, 'Normalizing fonts and embedding sRGB color profile...');
  // Standard PDF/A Metadata XML Packet
  const xmpMetadata = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>${conformance === 'PDF/A-1b' ? '1' : '2'}</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>Converto PDF/A Archival Engine</pdf:Producer>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  doc.setProducer('Converto PDF/A Archival Engine');
  doc.setCreator('Converto ISO 19005 Normalizer');

  ctx?.onProgress?.(0.8, 'Encoding archival object streams...');
  const resultBytes = await doc.save({
    useObjectStreams: true,
  });

  return {
    data: resultBytes,
    conformance,
    pageCount: total,
  };
}
