import { mergePdfs } from '../core/mergePdfs';
import { exposeJob } from './expose';

export interface MergePdfRequest {
  files: File[];
}

exposeJob<MergePdfRequest, Uint8Array>(async ({ files }, onProgress) => {
  const pdfs = await Promise.all(files.map(async (file) => new Uint8Array(await file.arrayBuffer())));
  const bytes = await mergePdfs(pdfs, onProgress);
  return { result: bytes, transfer: [bytes.buffer as ArrayBuffer] };
});
