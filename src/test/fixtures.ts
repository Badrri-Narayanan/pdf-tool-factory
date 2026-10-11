import { PDFDocument, PDFName, PDFNumber, PDFRawStream, StandardFonts } from 'pdf-lib';

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

/** PNG with random RGB and random alpha in 1..254, so its soft mask is large and incompressible. */
export async function makeNoisyAlphaPng(width: number, height: number): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = Math.random() * 255;
    image.data[i + 1] = Math.random() * 255;
    image.data[i + 2] = Math.random() * 255;
    image.data[i + 3] = 1 + Math.floor(Math.random() * 254);
  }
  ctx.putImageData(image, 0, 0);
  return canvasBytes(canvas, 'image/png');
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

export async function makePdf(pageCount: number, size: [number, number] = [300, 400]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage(size);
  return doc.save();
}

export async function makeTextPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([300, 400]).drawText('Hello, plain text only.', { x: 20, y: 360, size: 14, font });
  return doc.save();
}

/** Not truly encrypted, but carries an /Encrypt trailer entry so pdf-lib treats it as password-protected. */
export async function makeEncryptedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([300, 400]);
  doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: 'Standard', V: 1, R: 2 });
  return doc.save({ useObjectStreams: false });
}

export async function makeImagePdf(
  image: Uint8Array,
  format: 'png' | 'jpeg',
  pagePt: [number, number] = [200, 150],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const embedded = format === 'jpeg' ? await doc.embedJpg(image) : await doc.embedPng(image);
  doc.addPage(pagePt).drawImage(embedded, { x: 0, y: 0, width: pagePt[0], height: pagePt[1] });
  return doc.save();
}

export async function imageStreams(pdf: Uint8Array) {
  const doc = await PDFDocument.load(pdf);
  return doc.context
    .enumerateIndirectObjects()
    .map(([, obj]) => obj)
    .filter((obj): obj is PDFRawStream => obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'))
    .filter((stream) => !isSoftMask(doc, stream))
    .map((stream) => ({
      width: (stream.dict.lookup(PDFName.of('Width')) as PDFNumber).asNumber(),
      filter: String(stream.dict.lookup(PDFName.of('Filter'))),
      hasSMask: stream.dict.has(PDFName.of('SMask')),
    }));
}

function isSoftMask(doc: PDFDocument, candidate: PDFRawStream): boolean {
  return doc.context
    .enumerateIndirectObjects()
    .some(([, obj]) => obj instanceof PDFRawStream && doc.context.lookup(obj.dict.get(PDFName.of('SMask'))) === candidate);
}
