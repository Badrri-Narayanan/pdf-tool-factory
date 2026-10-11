import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { DEFAULT_IMAGES_TO_PDF_OPTIONS, imagesToPdf, type ImageInput, type ImagesToPdfOptions } from './imagesToPdf';
import { TINY_GIF, makeBmp, makeImage, toBlob, withExifOrientation } from '../test/fixtures';

const input = (bytes: Uint8Array, rotation: ImageInput['rotation'] = 0): ImageInput => ({ file: toBlob(bytes), rotation });
const opts = (overrides: Partial<ImagesToPdfOptions> = {}) => ({ ...DEFAULT_IMAGES_TO_PDF_OPTIONS, ...overrides });

async function pageSizes(pdf: Uint8Array) {
  const doc = await PDFDocument.load(pdf);
  return doc.getPages().map((p) => {
    const { width, height } = p.getSize();
    return [Math.round(width * 100) / 100, Math.round(height * 100) / 100];
  });
}

describe('imagesToPdf', () => {
  it('makes one page per image, in order, sized to each image (1 px = 0.75 pt)', async () => {
    const pdf = await imagesToPdf([input(await makeImage('png', 40, 20)), input(await makeImage('jpeg', 20, 40))], opts());
    expect(await pageSizes(pdf)).toEqual([[30, 15], [15, 30]]);
  });

  it('accepts every supported format', async () => {
    const files = [
      await makeImage('png', 10, 10),
      await makeImage('jpeg', 10, 10),
      await makeImage('webp', 10, 10),
      TINY_GIF,
      makeBmp(10, 10),
    ];
    expect(await pageSizes(await imagesToPdf(files.map((f) => input(f)), opts()))).toHaveLength(5);
  });

  it('keeps phone photos upright by honoring EXIF orientation', async () => {
    const jpeg = withExifOrientation(await makeImage('jpeg', 40, 20), 6);
    expect(await pageSizes(await imagesToPdf([input(jpeg)], opts()))).toEqual([[15, 30]]);
  });

  it('applies the user rotation', async () => {
    const pdf = await imagesToPdf([input(await makeImage('png', 40, 20), 90)], opts());
    expect(await pageSizes(pdf)).toEqual([[15, 30]]);
  });

  it('uses A4 and picks orientation from the image when set to auto', async () => {
    const landscape = input(await makeImage('png', 40, 20));
    expect(await pageSizes(await imagesToPdf([landscape], opts({ pageSize: 'a4' })))).toEqual([[841.89, 595.28]]);
    expect(await pageSizes(await imagesToPdf([landscape], opts({ pageSize: 'a4', orientation: 'portrait' })))).toEqual([[595.28, 841.89]]);
    expect(await pageSizes(await imagesToPdf([landscape], opts({ pageSize: 'letter', orientation: 'landscape' })))).toEqual([[792, 612]]);
  });

  it('adds margins around fit-to-image pages', async () => {
    const pdf = await imagesToPdf([input(await makeImage('png', 40, 20))], opts({ margin: 'small' }));
    expect(await pageSizes(pdf)).toEqual([[86.69, 71.69]]);
  });

  it('caps the long edge at 2000 px with Reduced quality', async () => {
    const pdf = await imagesToPdf([input(await makeImage('png', 3000, 1000))], opts({ quality: 'reduced' }));
    const [[width, height]] = await pageSizes(pdf);
    expect(width).toBe(1500);
    expect(height).toBeCloseTo(500.25, 1);
  });

  it('reports which file failed', async () => {
    const files = [input(await makeImage('png', 10, 10)), input(new TextEncoder().encode('not an image at all'))];
    await expect(imagesToPdf(files, opts())).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT', fileIndex: 1 });
  });

  it('reports progress up to 1', async () => {
    const onProgress = vi.fn();
    await imagesToPdf([input(await makeImage('png', 10, 10)), input(await makeImage('png', 10, 10))], opts(), onProgress);
    expect(onProgress.mock.calls.map(([v]) => v)).toEqual([0.5, 1]);
  });
});
