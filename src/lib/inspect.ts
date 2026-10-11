import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ToolError } from '../core/errors';
import { sniffImageFormat } from '../core/image/sniff';
import type { Inspector } from './useFileList';
import { loadPdfjs } from './pdfjs';

const THUMB_EDGE = 240;

export const inspectImage: Inspector = async (file) => {
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (!sniffImageFormat(head)) throw new ToolError('UNSUPPORTED_FORMAT', 'Not a supported image.');
  // Browsers that can't show HEIC fall back to an icon in FileCard.
  return { thumbUrl: URL.createObjectURL(file) };
};

export const inspectPdf: Inspector = async (file) => {
  const { getDocument } = await loadPdfjs();
  // useWasm: false keeps pdf.js from fetching its optional wasm decoders.
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), useWasm: false });
  let doc: PDFDocumentProxy;
  try {
    doc = await task.promise;
  } catch (err) {
    await task.destroy();
    const encrypted = (err as { name?: string }).name === 'PasswordException';
    throw new ToolError(encrypted ? 'ENCRYPTED_PDF' : 'CORRUPT_FILE', encrypted ? 'Password-protected PDF.' : 'Not a valid PDF.');
  }
  try {
    return { pageCount: doc.numPages, thumbUrl: await renderFirstPage(doc) };
  } finally {
    await task.destroy(); // in pdf.js 6 destroy() lives on the loading task, not the document
  }
};

async function renderFirstPage(doc: PDFDocumentProxy): Promise<string | undefined> {
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: THUMB_EDGE / Math.max(base.width, base.height) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ? URL.createObjectURL(blob) : undefined;
  } catch {
    return undefined; // a missing thumbnail must not reject an otherwise valid PDF
  }
}
