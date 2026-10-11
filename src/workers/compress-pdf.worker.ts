import { compressPdf, type CompressionLevel, type CompressResult } from '../core/compressPdf';
import { exposeJob } from './expose';

export interface CompressPdfRequest {
  file: File;
  level: CompressionLevel;
  /** document.baseURI of the page, used to locate the Ghostscript files. */
  baseUrl: string;
}

exposeJob<CompressPdfRequest, CompressResult>(async ({ file, level, baseUrl }, onProgress) => {
  const pdf = new Uint8Array(await file.arrayBuffer());
  const result = await compressPdf(pdf, level, { onProgress, ghostscriptBaseUrl: baseUrl });
  return { result, transfer: [result.bytes.buffer as ArrayBuffer] };
});
