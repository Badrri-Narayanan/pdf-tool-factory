import { describe, expect, it } from 'vitest';
import { encodeCanvas, renderBitmap } from './render';
import { makeImage, makeTransparentPng, readPixel, toBlob } from '../../test/fixtures';

const bitmapOf = async (bytes: Uint8Array) => createImageBitmap(toBlob(bytes));

describe('renderBitmap', () => {
  it('keeps size when no options are given', async () => {
    const canvas = renderBitmap(await bitmapOf(await makeImage('png', 40, 20)));
    expect([canvas.width, canvas.height]).toEqual([40, 20]);
  });

  it.each([
    [90, [20, 40]],
    [180, [40, 20]],
    [270, [20, 40]],
  ] as const)('rotates by %i degrees', async (rotation, size) => {
    const canvas = renderBitmap(await bitmapOf(await makeImage('png', 40, 20)), { rotation });
    expect([canvas.width, canvas.height]).toEqual(size);
  });

  it('downscales so the long edge fits, and never upscales', async () => {
    const big = renderBitmap(await bitmapOf(await makeImage('png', 400, 100)), { maxLongEdge: 200 });
    expect([big.width, big.height]).toEqual([200, 50]);
    const small = renderBitmap(await bitmapOf(await makeImage('png', 40, 10)), { maxLongEdge: 200 });
    expect([small.width, small.height]).toEqual([40, 10]);
  });

  it('flattens transparency onto the background color before JPEG encoding', async () => {
    const canvas = renderBitmap(await bitmapOf(await makeTransparentPng(10, 10)), { background: '#ffffff' });
    const [r, g, b] = await readPixel(await encodeCanvas(canvas, 'jpeg', 0.8), 5, 5);
    expect(Math.min(r, g, b)).toBeGreaterThan(245);
  });
});

describe('encodeCanvas', () => {
  it('produces JPEG and PNG bytes', async () => {
    const canvas = renderBitmap(await bitmapOf(await makeImage('png', 8, 8)));
    const jpeg = await encodeCanvas(canvas, 'jpeg', 0.8);
    const png = await encodeCanvas(canvas, 'png');
    expect([...jpeg.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    expect([...png.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
  });
});
