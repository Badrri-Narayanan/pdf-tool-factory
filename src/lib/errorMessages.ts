import { ToolError, type ToolErrorCode } from '../core/errors';

export const ERROR_MESSAGES: Record<ToolErrorCode, string> = {
  UNSUPPORTED_FORMAT: "This file type isn't supported.",
  ENCRYPTED_PDF: 'This PDF is password-protected. Remove the password and try again.',
  CORRUPT_FILE: "This file looks damaged and can't be read.",
  OUT_OF_MEMORY: 'Your device ran out of memory. Try fewer or smaller files.',
  ENGINE_LOAD_FAILED: "The maximum compression engine couldn't be loaded. Try Light or Medium instead.",
  UNKNOWN: 'Something went wrong. Please try again.',
};

export function messageFor(err: unknown): string {
  return err instanceof ToolError ? ERROR_MESSAGES[err.code] : ERROR_MESSAGES.UNKNOWN;
}
