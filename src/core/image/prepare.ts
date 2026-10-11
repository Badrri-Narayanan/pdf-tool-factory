import { ToolError } from '../errors';
import { decodeImage } from './decode';
import { readJpegOrientation } from './exif';
import { encodeCanvas, renderBitmap, type Rotation } from './render';
import { sniffImageFormat } from './sniff';

export interface ImageInput {
  file: Blob;
  rotation: Rotation;
}

export interface PreparedImage {
  bytes: Uint8Array;
  format: 'jpeg' | 'png';
}

const REDUCED_MAX_EDGE = 2000;
const REDUCED_QUALITY = 0.75;
const REENCODED_JPEG_QUALITY = 0.92;
const WHITE = '#ffffff';

export async function prepareImage(input: ImageInput, quality: 'original' | 'reduced'): Promise<PreparedImage> {
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const format = sniffImageFormat(bytes);
  if (!format) throw new ToolError('UNSUPPORTED_FORMAT', 'This file is not a supported image.');

  // pdf-lib embeds JPEG/PNG bytes directly, but it ignores EXIF rotation, so only pass through upright JPEGs.
  if (quality === 'original' && input.rotation === 0) {
    if (format === 'png') return { bytes, format: 'png' };
    if (format === 'jpeg' && readJpegOrientation(bytes) === 1) return { bytes, format: 'jpeg' };
  }

  const bitmap = await decodeImage(input.file, format);
  try {
    if (quality === 'reduced') {
      const canvas = renderBitmap(bitmap, { rotation: input.rotation, maxLongEdge: REDUCED_MAX_EDGE, background: WHITE });
      return { bytes: await encodeCanvas(canvas, 'jpeg', REDUCED_QUALITY), format: 'jpeg' };
    }
    if (format === 'jpeg') {
      const canvas = renderBitmap(bitmap, { rotation: input.rotation, background: WHITE });
      return { bytes: await encodeCanvas(canvas, 'jpeg', REENCODED_JPEG_QUALITY), format: 'jpeg' };
    }
    return { bytes: await encodeCanvas(renderBitmap(bitmap, { rotation: input.rotation }), 'png'), format: 'png' };
  } finally {
    bitmap.close();
  }
}
