import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import type { WorkerResponse } from './protocol';
import { makeEncryptedPdf, makeImage, makePdf } from '../test/fixtures';
import { DEFAULT_IMAGES_TO_PDF_OPTIONS } from '../core/imagesToPdf';
import type { CompressResult } from '../core/compressPdf';

function runWorker<Result>(worker: Worker, request: unknown): Promise<WorkerResponse<Result>[]> {
  return new Promise((resolve) => {
    const messages: WorkerResponse<Result>[] = [];
    worker.onmessage = (event: MessageEvent<WorkerResponse<Result>>) => {
      messages.push(event.data);
      if (event.data.type !== 'progress') {
        worker.terminate();
        resolve(messages);
      }
    };
    worker.postMessage(request);
  });
}

const pdfFile = (bytes: Uint8Array, name: string) => new File([bytes as Uint8Array<ArrayBuffer>], name, { type: 'application/pdf' });

describe('workers', () => {
  it('merge worker reports progress and returns the merged PDF', async () => {
    const worker = new Worker(new URL('./merge-pdf.worker.ts', import.meta.url), { type: 'module' });
    const messages = await runWorker<Uint8Array>(worker, { files: [pdfFile(await makePdf(1), 'a.pdf'), pdfFile(await makePdf(2), 'b.pdf')] });
    const last = messages.at(-1)!;
    expect(messages.filter((m) => m.type === 'progress').length).toBeGreaterThan(0);
    expect(last.type).toBe('done');
    if (last.type === 'done') expect((await PDFDocument.load(last.result)).getPageCount()).toBe(3);
  });

  it('merge worker reports a typed error with the failing file index', async () => {
    const worker = new Worker(new URL('./merge-pdf.worker.ts', import.meta.url), { type: 'module' });
    const messages = await runWorker(worker, { files: [pdfFile(await makePdf(1), 'a.pdf'), pdfFile(await makeEncryptedPdf(), 'locked.pdf')] });
    expect(messages.at(-1)).toMatchObject({ type: 'error', code: 'ENCRYPTED_PDF', fileIndex: 1 });
  });

  it('images worker returns a PDF', async () => {
    const worker = new Worker(new URL('./images-to-pdf.worker.ts', import.meta.url), { type: 'module' });
    const image = new File([(await makeImage('png', 20, 10)) as Uint8Array<ArrayBuffer>], 'a.png');
    const messages = await runWorker<Uint8Array>(worker, { images: [{ file: image, rotation: 0 }], options: DEFAULT_IMAGES_TO_PDF_OPTIONS });
    expect(messages.at(-1)?.type).toBe('done');
  });

  it('compress worker returns a CompressResult', async () => {
    const worker = new Worker(new URL('./compress-pdf.worker.ts', import.meta.url), { type: 'module' });
    const messages = await runWorker<CompressResult>(worker, { file: pdfFile(await makePdf(1), 'a.pdf'), level: 'light', baseUrl: `${location.origin}/` });
    expect(messages.at(-1)).toMatchObject({ type: 'done', result: { usedOriginal: true } });
  });

  it('compress worker attaches file index 0 to an encrypted PDF error', async () => {
    const worker = new Worker(new URL('./compress-pdf.worker.ts', import.meta.url), { type: 'module' });
    const messages = await runWorker(worker, { file: pdfFile(await makeEncryptedPdf(), 'locked.pdf'), level: 'light', baseUrl: `${location.origin}/` });
    expect(messages.at(-1)).toMatchObject({ type: 'error', code: 'ENCRYPTED_PDF', fileIndex: 0 });
  });
});
