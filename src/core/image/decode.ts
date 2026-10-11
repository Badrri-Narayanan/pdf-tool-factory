import { ToolError } from '../errors';
import type { ImageFormat } from './sniff';

export async function decodeImage(blob: Blob, format: ImageFormat): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob);
  } catch {
    if (format !== 'heic') throw new ToolError('CORRUPT_FILE', 'Could not read this image.');
  }
  return decodeHeic(blob);
}

/** Safari decodes HEIC natively; other browsers need libheif, loaded only when a HEIC file shows up. */
async function decodeHeic(blob: Blob): Promise<ImageBitmap> {
  const fail = () => new ToolError('CORRUPT_FILE', 'Could not read this HEIC image.');
  const { default: libheif } = await import('libheif-js/wasm-bundle');
  const images = new libheif.HeifDecoder().decode(new Uint8Array(await blob.arrayBuffer()));
  if (images.length === 0) throw fail();
  const image = images[0];
  const imageData = new ImageData(image.get_width(), image.get_height());
  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (result) => (result ? resolve() : reject(fail())));
  });
  return createImageBitmap(imageData);
}
