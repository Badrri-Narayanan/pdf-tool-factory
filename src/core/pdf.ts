import { EncryptedPDFError, PDFDocument } from 'pdf-lib';
import { ToolError } from './errors';

// pdf-lib's CJS/ES5 build breaks the prototype chain of EncryptedPDFError, so instanceof alone is unreliable.
const isEncryptedError = (err: unknown): boolean =>
  err instanceof EncryptedPDFError || (err instanceof Error && /\bis encrypted\b/.test(err.message));

export async function loadPdf(bytes: Uint8Array, fileIndex?: number): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (isEncryptedError(err)) {
      throw new ToolError('ENCRYPTED_PDF', 'This PDF is password-protected.', fileIndex);
    }
    if (err instanceof RangeError) throw new ToolError('OUT_OF_MEMORY', err.message, fileIndex);
    throw new ToolError('CORRUPT_FILE', 'This file is not a valid PDF.', fileIndex);
  }
}
