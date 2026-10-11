import { PDFDocument } from 'pdf-lib';
import { toToolError } from './errors';
import { loadPdf } from './pdf';

export async function mergePdfs(
  pdfs: Uint8Array[],
  onProgress: (value: number) => void = () => {},
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (let i = 0; i < pdfs.length; i++) {
    const source = await loadPdf(pdfs[i], i);
    try {
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    } catch (err) {
      throw toToolError(err, i);
    }
    onProgress((i + 1) / pdfs.length);
  }
  return merged.save({ useObjectStreams: true });
}
