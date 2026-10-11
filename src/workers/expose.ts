import { toToolError } from '../core/errors';
import type { WorkerResponse } from './protocol';

type Handler<Request, Result> = (
  request: Request,
  onProgress: (value: number) => void,
) => Promise<{ result: Result; transfer?: Transferable[] }>;

export function exposeJob<Request, Result>(handler: Handler<Request, Result>): void {
  const post = (message: WorkerResponse<Result>, transfer: Transferable[] = []) =>
    self.postMessage(message, { transfer });

  self.onmessage = async (event: MessageEvent<Request>) => {
    try {
      const { result, transfer } = await handler(event.data, (value) => post({ type: 'progress', value }));
      post({ type: 'done', result }, transfer);
    } catch (err) {
      const error = toToolError(err);
      post({ type: 'error', code: error.code, message: error.message, fileIndex: error.fileIndex });
    }
  };
}
