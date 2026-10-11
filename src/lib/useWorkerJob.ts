import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToolErrorCode } from '../core/errors';
import type { WorkerResponse } from '../workers/protocol';

export type JobState<Result> =
  | { status: 'idle' }
  | { status: 'running'; progress: number }
  | { status: 'done'; result: Result }
  | { status: 'error'; code: ToolErrorCode; message: string; fileIndex?: number };

/** Runs one job per fresh worker so memory is released when the job ends. */
export function useWorkerJob<Request, Result>(createWorker: () => Worker) {
  const [state, setState] = useState<JobState<Result>>({ status: 'idle' });
  const workerRef = useRef<Worker | null>(null);

  const stop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const run = useCallback(
    (request: Request) => {
      stop();
      const worker = createWorker();
      workerRef.current = worker;
      setState({ status: 'running', progress: 0 });
      worker.onmessage = (event: MessageEvent<WorkerResponse<Result>>) => {
        const message = event.data;
        if (message.type === 'progress') {
          setState({ status: 'running', progress: message.value });
          return;
        }
        stop();
        setState(
          message.type === 'done'
            ? { status: 'done', result: message.result }
            : { status: 'error', code: message.code, message: message.message, fileIndex: message.fileIndex },
        );
      };
      worker.onerror = (event) => {
        event.preventDefault();
        stop();
        setState({ status: 'error', code: 'UNKNOWN', message: event.message || 'The background worker crashed.' });
      };
      worker.postMessage(request);
    },
    [createWorker, stop],
  );

  const reset = useCallback(() => {
    stop();
    setState({ status: 'idle' });
  }, [stop]);

  return { state, run, reset };
}
