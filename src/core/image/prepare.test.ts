import { describe, expect, it } from 'vitest';
import { prepareImage } from './prepare';
import { makeImage, makeTransparentPng, readPixel, toBlob, withExifOrientation } from '../../test/fixtures';

describe('prepareImage', () => {
  it('passes JPEG and PNG bytes through untouched at original quality', async () => {
    const jpeg = await makeImage('jpeg', 30, 20);
    const png = await makeImage('png', 30, 20);
    expect((await prepareImage({ file: toBlob(jpeg), rotation: 0 }, 'original')).bytes).toEqual(jpeg);
    expect(await prepareImage({ file: toBlob(png), rotation: 0 }, 'original')).toEqual({ bytes: png, format: 'png' });
  });

  it('re-encodes JPEGs with EXIF rotation so they come out upright', async () => {
    const jpeg = withExifOrientation(await makeImage('jpeg', 40, 20), 6);
    const prepared = await prepareImage({ file: toBlob(jpeg), rotation: 0 }, 'original');
    const bitmap = await createImageBitmap(toBlob(prepared.bytes));
    expect(prepared.format).toBe('jpeg');
    expect([bitmap.width, bitmap.height]).toEqual([20, 40]);
  });

  it('converts WebP to lossless PNG at original quality', async () => {
    const prepared = await prepareImage({ file: toBlob(await makeImage('webp', 10, 10)), rotation: 0 }, 'original');
    expect(prepared.format).toBe('png');
  });

  it('turns transparency white when Reduced quality converts PNG to JPEG', async () => {
    const prepared = await prepareImage({ file: toBlob(await makeTransparentPng(10, 10)), rotation: 0 }, 'reduced');
    const [r, g, b] = await readPixel(prepared.bytes, 5, 5);
    expect(prepared.format).toBe('jpeg');
    expect(Math.min(r, g, b)).toBeGreaterThan(245);
  });

  it('rejects files that are not supported images', async () => {
    const text = toBlob(new TextEncoder().encode('just some notes, not an image'));
    await expect(prepareImage({ file: text, rotation: 0 }, 'original')).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT' });
  });
});
