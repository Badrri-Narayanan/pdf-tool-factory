import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from './mergePdfs';
import { makeEncryptedPdf, makePdf } from '../test/fixtures';

const sizes = async (pdf: Uint8Array) =>
  (await PDFDocument.load(pdf)).getPages().map((p) => [p.getWidth(), p.getHeight()]);

describe('mergePdfs', () => {
  it('concatenates all pages in file order', async () => {
    const merged = await mergePdfs([await makePdf(2, [100, 200]), await makePdf(3, [300, 400])]);
    expect(await sizes(merged)).toEqual([[100, 200], [100, 200], [300, 400], [300, 400], [300, 400]]);
  });

  it('allows the same file twice', async () => {
    const pdf = await makePdf(2);
    expect(await sizes(await mergePdfs([pdf, pdf]))).toHaveLength(4);
  });

  it('rejects a password-protected PDF and says which one', async () => {
    const files = [await makePdf(1), await makeEncryptedPdf()];
    await expect(mergePdfs(files)).rejects.toMatchObject({ code: 'ENCRYPTED_PDF', fileIndex: 1 });
  });

  it('rejects a file that is not a PDF and says which one', async () => {
    const files = [new TextEncoder().encode('definitely not a pdf'), await makePdf(1)];
    await expect(mergePdfs(files)).rejects.toMatchObject({ code: 'CORRUPT_FILE', fileIndex: 0 });
  });

  it('reports progress per file', async () => {
    const onProgress = vi.fn();
    await mergePdfs([await makePdf(1), await makePdf(1)], onProgress);
    expect(onProgress.mock.calls.map(([v]) => v)).toEqual([0.5, 1]);
  });
});
