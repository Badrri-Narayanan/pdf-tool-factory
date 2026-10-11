import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

type PdfJs = typeof import('pdfjs-dist');
let pdfjs: Promise<PdfJs> | null = null;

export function loadPdfjs(): Promise<PdfJs> {
  pdfjs ??= import('pdfjs-dist').then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    return lib;
  });
  return pdfjs;
}
