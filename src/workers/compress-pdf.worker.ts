import { compressPdf, type CompressionLevel, type CompressResult } from '../core/compressPdf';
import { toToolError } from '../core/errors';
import { exposeJob } from './expose';

export interface CompressPdfRequest {
  file: File;
  level: CompressionLevel;
  /** document.baseURI of the page, used to locate the Ghostscript files. */
  baseUrl: string;
}

exposeJob<CompressPdfRequest, CompressResult>(async ({ file, level, baseUrl }, onProgress) => {
  const pdf = new Uint8Array(await file.arrayBuffer());
  let result: CompressResult;
  try {
    result = await compressPdf(pdf, level, { onProgress, ghostscriptBaseUrl: baseUrl });
  } catch (err) {
    const error = toToolError(err);
    // Problems with the document itself belong on its card; engine/memory failures are not the file's fault.
    const fileFault = error.code === 'ENCRYPTED_PDF' || error.code === 'CORRUPT_FILE' || error.code === 'UNSUPPORTED_FORMAT';
    throw fileFault ? toToolError(error, 0) : error;
  }
  return { result, transfer: [result.bytes.buffer as ArrayBuffer] };
});
