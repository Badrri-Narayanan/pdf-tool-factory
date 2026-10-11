import { useMemo } from 'react';
import { DropZone } from '../../components/DropZone';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ProgressBar } from '../../components/ProgressBar';
import { ResultPanel } from '../../components/ResultPanel';
import { SortableFileGrid } from '../../components/SortableFileGrid';
import { ToolLayout } from '../../components/ToolLayout';
import { pdfFile } from '../../lib/download';
import { ERROR_MESSAGES } from '../../lib/errorMessages';
import { inspectPdf } from '../../lib/inspect';
import { confirmLargeJob } from '../../lib/sizeGuard';
import { applyJobError } from '../../lib/fileList';
import { useFileList } from '../../lib/useFileList';
import { useWorkerJob } from '../../lib/useWorkerJob';
import type { MergePdfRequest } from '../../workers/merge-pdf.worker';

const createWorker = () =>
  new Worker(new URL('../../workers/merge-pdf.worker.ts', import.meta.url), { type: 'module' });

export default function MergePdfPage() {
  const files = useFileList(inspectPdf);
  const job = useWorkerJob<MergePdfRequest, Uint8Array>(createWorker);
  const items = applyJobError(files.items, job.state);

  const hasErrors = items.some((i) => i.status === 'error');
  const allReady = items.every((i) => i.status === 'ready');
  const ready = items.length >= 2 && allReady;
  const running = job.state.status === 'running';
  const result = useMemo(
    () => (job.state.status === 'done' ? pdfFile(job.state.result, 'merged.pdf') : null),
    [job.state],
  );

  const edit = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => {
    job.reset();
    fn(...args);
  };

  const start = () => {
    const selected = items.map((i) => i.file);
    if (!confirmLargeJob(selected)) return;
    job.run({ files: selected });
  };

  return (
    <ToolLayout
      title="Merge PDFs"
      description="Add PDFs, drag them into order, and combine them into one file."
      action={
        !result && (
          <button
            type="button"
            disabled={!ready || running}
            onClick={start}
            className="min-h-12 w-full rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Merge PDFs
          </button>
        )
      }
    >
      <DropZone accept="application/pdf,.pdf" multiple label="Choose PDFs" hint="You can also drop PDFs anywhere on this page." onFiles={edit(files.add)} />

      {items.length > 0 && <SortableFileGrid items={items} onMove={edit(files.move)} onRemove={edit(files.remove)} />}
      {hasErrors && <p className="text-sm text-red-600 dark:text-red-400">Remove the files marked in red to continue.</p>}
      {items.length === 1 && !hasErrors && <p className="text-sm text-slate-600 dark:text-slate-400">Add at least 2 PDFs to merge.</p>}

      {job.state.status === 'running' && <ProgressBar value={job.state.progress} label="Merging" />}
      {job.state.status === 'error' && (
        <ErrorBanner
          message={job.state.fileIndex !== undefined ? 'One PDF could not be used. It is marked in red above.' : ERROR_MESSAGES[job.state.code]}
          onRetry={job.state.fileIndex === undefined ? start : undefined}
        />
      )}
      {result && (
        <ResultPanel
          file={result}
          onReset={() => {
            job.reset();
            files.clear();
          }}
        />
      )}
    </ToolLayout>
  );
}
