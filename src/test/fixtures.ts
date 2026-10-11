/** Inserts a minimal little-endian EXIF APP1 segment with one Orientation tag right after SOI. */
export function withExifOrientation(jpeg: Uint8Array, orientation: number): Uint8Array {
  const app1 = new Uint8Array([
    0xff, 0xe1, 0x00, 0x22,
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00,
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, orientation, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
  const out = new Uint8Array(jpeg.length + app1.length);
  out.set(jpeg.subarray(0, 2));
  out.set(app1, 2);
  out.set(jpeg.subarray(2), 2 + app1.length);
  return out;
}

export function toBlob(bytes: Uint8Array, type = ''): Blob {
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type });
}

async function canvasBytes(canvas: OffscreenCanvas, type: string, quality?: number): Promise<Uint8Array> {
  const blob = await canvas.convertToBlob({ type, quality });
  return new Uint8Array(await blob.arrayBuffer());
}

export async function makeImage(
  type: 'png' | 'jpeg' | 'webp',
  width: number,
  height: number,
  fill = 'rgb(200, 30, 30)',
): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  return canvasBytes(canvas, `image/${type}`, 0.9);
}

export async function makeTransparentPng(width: number, height: number): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d');
  return canvasBytes(canvas, 'image/png');
}

/** Random pixels compress badly, so these make large files that recompression can shrink. */
export async function makeNoiseImage(type: 'png' | 'jpeg', width: number, height: number): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = Math.random() * 255;
    image.data[i + 1] = Math.random() * 255;
    image.data[i + 2] = Math.random() * 255;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvasBytes(canvas, `image/${type}`, 1);
}

/** 24-bit bottom-up BMP filled with blue. */
export function makeBmp(width: number, height: number): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const bytes = new Uint8Array(54 + pixelBytes);
  const view = new DataView(bytes.buffer);
  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, bytes.length, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) bytes[54 + y * rowSize + x * 3] = 255;
  }
  return bytes;
}

export const TINY_GIF = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='),
  (c) => c.charCodeAt(0),
);

export async function readPixel(bytes: Uint8Array, x: number, y: number): Promise<number[]> {
  const bitmap = await createImageBitmap(toBlob(bytes));
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  return [...ctx.getImageData(x, y, 1, 1).data];
}
