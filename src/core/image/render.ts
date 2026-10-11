import { ToolError } from '../errors';

export type Rotation = 0 | 90 | 180 | 270;

export interface RenderOptions {
  rotation?: Rotation;
  maxLongEdge?: number;
  /** Fill color drawn under the image; use for JPEG output so transparency doesn't turn black. */
  background?: string;
}

export function renderBitmap(bitmap: ImageBitmap, options: RenderOptions = {}): OffscreenCanvas {
  const rotation = options.rotation ?? 0;
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = options.maxLongEdge ? Math.min(1, options.maxLongEdge / longEdge) : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const sideways = rotation === 90 || rotation === 270;

  const canvas = new OffscreenCanvas(sideways ? height : width, sideways ? width : height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ToolError('UNKNOWN', 'Canvas is not available in this browser.');
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(bitmap, -width / 2, -height / 2, width, height);
  return canvas;
}

export async function encodeCanvas(
  canvas: OffscreenCanvas,
  format: 'jpeg' | 'png',
  quality?: number,
): Promise<Uint8Array> {
  const blob = await canvas.convertToBlob({ type: `image/${format}`, quality });
  return new Uint8Array(await blob.arrayBuffer());
}
