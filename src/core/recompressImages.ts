import { PDFArray, PDFBool, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFStream, type PDFContext, type PDFObject } from 'pdf-lib';
import { readJpegOrientation } from './image/exif';
import { encodeCanvas, renderBitmap } from './image/render';
import { loadPdf } from './pdf';

export interface RecompressSettings {
  quality: number;
  dpi: number;
}

const name = (value: string) => PDFName.of(value);
const DEFAULT_PAGE_EDGE_PT = 792;

/**
 * Re-encodes embedded raster images as smaller JPEGs. Text, vectors and fonts are untouched.
 * Images are skipped when they use masks/transparency, unusual color spaces or filters,
 * or when the re-encoded version would not be smaller.
 */
export async function recompressImages(
  pdf: Uint8Array,
  settings: RecompressSettings,
  onProgress: (value: number) => void = () => {},
): Promise<Uint8Array> {
  const doc = await loadPdf(pdf);
  const pageEdges = doc.getPages().map((page) => Math.max(page.getWidth(), page.getHeight()));
  const maxPageEdgePt = pageEdges.length ? Math.max(...pageEdges) : DEFAULT_PAGE_EDGE_PT;
  const maxEdgePx = Math.max(1, Math.round((maxPageEdgePt / 72) * settings.dpi));

  const images = doc.context
    .enumerateIndirectObjects()
    .filter((entry): entry is [PDFRef, PDFRawStream] => {
      const obj = entry[1];
      return obj instanceof PDFRawStream && obj.dict.get(name('Subtype')) === name('Image');
    });

  const maskRefs = maskTargets(images);
  let replaced = 0;
  for (let i = 0; i < images.length; i++) {
    const [ref, stream] = images[i];
    if (maskRefs.has(ref)) {
      onProgress((i + 1) / images.length);
      continue;
    }
    const replacement = await recompressImage(stream, doc.context, maxEdgePx, settings.quality);
    if (replacement) {
      doc.context.assign(ref, replacement);
      replaced++;
    }
    onProgress((i + 1) / images.length);
  }
  // Re-saving an untouched document can shift its size by a few bytes either way; return it as-is instead.
  if (replaced === 0) return pdf;
  return doc.save({ useObjectStreams: true });
}

/** Refs used as /SMask or /Mask streams. They must stay DeviceGray, so they are never re-encoded. */
function maskTargets(images: [PDFRef, PDFRawStream][]): Set<PDFRef> {
  const targets = new Set<PDFRef>();
  for (const [, stream] of images) {
    for (const key of ['SMask', 'Mask']) {
      const value = stream.dict.get(name(key));
      if (value instanceof PDFRef) targets.add(value);
    }
  }
  return targets;
}

async function recompressImage(
  stream: PDFRawStream,
  context: PDFContext,
  maxEdgePx: number,
  quality: number,
): Promise<PDFRawStream | null> {
  const dict = stream.dict;
  if (dict.has(name('SMask')) || dict.has(name('Mask')) || dict.has(name('Decode'))) return null;
  if (dict.get(name('ImageMask')) === PDFBool.True) return null;

  const width = numberValue(dict.lookup(name('Width')));
  const height = numberValue(dict.lookup(name('Height')));
  const components = colorComponents(dict.lookup(name('ColorSpace')), context);
  const filter = singleFilter(dict.lookup(name('Filter')));
  if (!width || !height || !components || !filter) return null;

  let bitmap: ImageBitmap;
  try {
    if (filter === name('DCTDecode')) {
      // PDFs ignore EXIF rotation, but the browser's decoder would apply it, so skip such images.
      if (readJpegOrientation(stream.contents) !== 1) return null;
      bitmap = await createImageBitmap(new Blob([stream.contents as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' }));
    } else if (
      filter === name('FlateDecode') &&
      !dict.has(name('DecodeParms')) &&
      numberValue(dict.lookup(name('BitsPerComponent'))) === 8
    ) {
      bitmap = await rawPixelsToBitmap(await inflate(stream.contents), width, height, components);
    } else {
      return null;
    }
  } catch {
    return null;
  }

  try {
    if (bitmap.width !== width || bitmap.height !== height) return null;
    const canvas = renderBitmap(bitmap, { maxLongEdge: maxEdgePx, background: '#ffffff' });
    const jpeg = await encodeCanvas(canvas, 'jpeg', quality);
    if (jpeg.length >= stream.contents.length) return null;
    return context.stream(jpeg, {
      Type: 'XObject',
      Subtype: 'Image',
      Width: canvas.width,
      Height: canvas.height,
      ColorSpace: 'DeviceRGB',
      BitsPerComponent: 8,
      Filter: 'DCTDecode',
    });
  } finally {
    bitmap.close();
  }
}

function numberValue(obj: PDFObject | undefined): number | undefined {
  return obj instanceof PDFNumber ? obj.asNumber() : undefined;
}

function singleFilter(obj: PDFObject | undefined): PDFName | null {
  if (obj instanceof PDFName) return obj;
  if (obj instanceof PDFArray && obj.size() === 1) {
    const only = obj.get(0);
    return only instanceof PDFName ? only : null;
  }
  return null;
}

function colorComponents(colorSpace: PDFObject | undefined, context: PDFContext): 1 | 3 | null {
  if (colorSpace === name('DeviceRGB')) return 3;
  if (colorSpace === name('DeviceGray')) return 1;
  if (colorSpace instanceof PDFArray && colorSpace.get(0) === name('ICCBased')) {
    const profile = context.lookup(colorSpace.get(1));
    const n = profile instanceof PDFStream ? numberValue(profile.dict.lookup(name('N'))) : undefined;
    if (n === 3) return 3;
    if (n === 1) return 1;
  }
  return null;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function rawPixelsToBitmap(pixels: Uint8Array, width: number, height: number, components: 1 | 3): Promise<ImageBitmap> {
  const pixelCount = width * height;
  if (pixels.length < pixelCount * components) throw new Error('Image data is shorter than its dimensions.');
  const rgba = new Uint8ClampedArray(pixelCount * 4);
  for (let p = 0, s = 0; p < pixelCount; p++, s += components) {
    const d = p * 4;
    rgba[d] = pixels[s];
    rgba[d + 1] = components === 3 ? pixels[s + 1] : pixels[s];
    rgba[d + 2] = components === 3 ? pixels[s + 2] : pixels[s];
    rgba[d + 3] = 255;
  }
  return createImageBitmap(new ImageData(rgba, width, height));
}
