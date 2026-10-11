import { imagesToPdf, type ImageInput, type ImagesToPdfOptions } from '../core/imagesToPdf';
import { exposeJob } from './expose';

export interface ImagesToPdfRequest {
  images: ImageInput[];
  options: ImagesToPdfOptions;
}

exposeJob<ImagesToPdfRequest, Uint8Array>(async ({ images, options }, onProgress) => {
  const bytes = await imagesToPdf(images, options, onProgress);
  return { result: bytes, transfer: [bytes.buffer as ArrayBuffer] };
});
