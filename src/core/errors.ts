export type ToolErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'ENCRYPTED_PDF'
  | 'CORRUPT_FILE'
  | 'OUT_OF_MEMORY'
  | 'ENGINE_LOAD_FAILED'
  | 'UNKNOWN';

export class ToolError extends Error {
  readonly code: ToolErrorCode;
  readonly fileIndex?: number;

  constructor(code: ToolErrorCode, message: string, fileIndex?: number) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.fileIndex = fileIndex;
  }
}

export function toToolError(err: unknown, fileIndex?: number): ToolError {
  if (err instanceof ToolError) {
    return err.fileIndex === undefined && fileIndex !== undefined
      ? new ToolError(err.code, err.message, fileIndex)
      : err;
  }
  if (err instanceof RangeError) return new ToolError('OUT_OF_MEMORY', err.message, fileIndex);
  const message = err instanceof Error ? err.message : String(err);
  return new ToolError('UNKNOWN', message, fileIndex);
}
