import type { ToolErrorCode } from '../core/errors';

export type WorkerResponse<Result> =
  | { type: 'progress'; value: number }
  | { type: 'done'; result: Result }
  | { type: 'error'; code: ToolErrorCode; message: string; fileIndex?: number };
