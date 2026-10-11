import { describe, expect, it } from 'vitest';
import { inspectImage, inspectPdf } from './inspect';
import { makeImage, makePdf } from '../test/fixtures';

const file = (bytes: Uint8Array, name: string, type = '') => new File([bytes as Uint8Array<ArrayBuffer>], name, { type });

describe('inspectImage', () => {
  it('accepts a supported image and returns a preview URL', async () => {
    const info = await inspectImage(file(await makeImage('png', 10, 10), 'a.png', 'image/png'));
    expect(info.thumbUrl).toMatch(/^blob:/);
  });

  it('accepts HEIC even when the browser gives no MIME type', async () => {
    const heicHead = new Uint8Array([0, 0, 0, 0x18, ...[...'ftypheic'].map((c) => c.charCodeAt(0)), 0, 0, 0, 0]);
    await expect(inspectImage(file(heicHead, 'IMG_0001.HEIC'))).resolves.toBeDefined();
  });

  it('rejects a dropped file of the wrong type', async () => {
    const notes = file(new TextEncoder().encode('shopping list'), 'notes.txt', 'text/plain');
    await expect(inspectImage(notes)).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT' });
  });
});

describe('inspectPdf', () => {
  it('returns the page count and a thumbnail', async () => {
    const info = await inspectPdf(file(await makePdf(3), 'a.pdf', 'application/pdf'));
    expect(info.pageCount).toBe(3);
    expect(info.thumbUrl).toMatch(/^blob:/);
  });

  it('rejects a file that is not a PDF', async () => {
    await expect(inspectPdf(file(new TextEncoder().encode('nope'), 'a.pdf'))).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT' });
  });

  it('reports a file with a PDF header but garbage content as damaged', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.7\ngarbage garbage garbage');
    await expect(inspectPdf(file(bytes, 'a.pdf'))).rejects.toMatchObject({ code: 'CORRUPT_FILE' });
  });
});
