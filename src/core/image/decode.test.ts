import { describe, expect, it } from 'vitest';
import { decodeImage } from './decode';
import { ToolError } from '../errors';
import { TINY_GIF, makeBmp, makeImage, toBlob, withExifOrientation } from '../../test/fixtures';

describe('decodeImage', () => {
  it.each(['png', 'jpeg', 'webp'] as const)('decodes %s', async (type) => {
    const bitmap = await decodeImage(toBlob(await makeImage(type, 40, 20)), type);
    expect([bitmap.width, bitmap.height]).toEqual([40, 20]);
  });

  it('decodes BMP and GIF', async () => {
    expect((await decodeImage(toBlob(makeBmp(7, 5)), 'bmp')).width).toBe(7);
    expect((await decodeImage(toBlob(TINY_GIF), 'gif')).width).toBe(1);
  });

  it('applies EXIF orientation so a rotated phone photo comes out upright', async () => {
    const jpeg = withExifOrientation(await makeImage('jpeg', 40, 20), 6);
    const bitmap = await decodeImage(toBlob(jpeg), 'jpeg');
    expect([bitmap.width, bitmap.height]).toEqual([20, 40]);
  });

  it('throws CORRUPT_FILE for bytes that are not really an image', async () => {
    const garbage = toBlob(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4, 5, 6, 7, 8]));
    await expect(decodeImage(garbage, 'png')).rejects.toMatchObject({ code: 'CORRUPT_FILE' });
    await expect(decodeImage(garbage, 'png')).rejects.toBeInstanceOf(ToolError);
  });

  it('maps libheif failures on corrupt HEIC bytes to CORRUPT_FILE', async () => {
    const garbage = toBlob(new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 1, 2, 3, 4]));
    await expect(decodeImage(garbage, 'heic')).rejects.toMatchObject({ code: 'CORRUPT_FILE' });
    await expect(decodeImage(garbage, 'heic')).rejects.toBeInstanceOf(ToolError);
  });
});
