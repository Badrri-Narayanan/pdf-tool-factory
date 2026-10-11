import { useMemo, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { ErrorBanner } from '../../components/ErrorBanner';
import { OptionGroup } from '../../components/OptionGroup';
import { ProgressBar } from '../../components/ProgressBar';
import { ResultPanel } from '../../components/ResultPanel';
import { SortableFileGrid } from '../../components/SortableFileGrid';
import { ToolLayout } from '../../components/ToolLayout';
import type { CompressionLevel, CompressResult } from '../../core/compressPdf';
import { pdfFile } from '../../lib/download';
import { ERROR_MESSAGES } from '../../lib/errorMessages';
import { compressedFilename, formatBytes, percentSaved } from '../../lib/format';
import { inspectPdf } from '../../lib/inspect';
import { confirmLargeJob } from '../../lib/sizeGuard';
import { applyJobError } from '../../lib/fileList';
import { useFileList } from '../../lib/useFileList';
import { useWorkerJob } from '../../lib/useWorkerJob';
import type { CompressPdfRequest } from '../../workers/compress-pdf.worker';

const createWorker = () =>
  new Worker(new URL('../../workers/compress-pdf.worker.ts', import.meta.url), { type: 'module' });

const LEVELS: { value: CompressionLevel; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Fast · keeps quality · best for scans and photos' },
  { value: 'medium', label: 'Medium', description: 'Fast · softer images · bigger savings' },
  { value: 'maximum', label: 'Maximum', description: 'One-time ~16 MB download · slower on phones · shrinks everything' },
];

export default function CompressPdfPage() {
  const files = useFileList(inspectPdf);
  const [level, setLevel] = useState<CompressionLevel>('light');
  const job = useWorkerJob<CompressPdfRequest, CompressResult>(createWorker);
  const items = applyJobError(files.items, job.state);

  const item = items[0];
  const ready = item?.status === 'ready';
  const running = job.state.status === 'running';
  const done = job.state.status === 'done' ? job.state.result : null;
  const result = useMemo(
    () => (done && item ? pdfFile(done.bytes, compressedFilename(item.file.name)) : null),
    [done, item],
  );

  const start = () => {
    if (!item || !confirmLargeJob([item.file])) return;
    job.run({ file: item.file, level, baseUrl: document.baseURI });
  };

  const progressLabel =
    level === 'maximum' && job.state.status === 'running' && job.state.progress < 0.5
      ? 'Downloading compression engine (first time only)'
      : 'Compressing';

  return (
    <ToolLayout
      title="Compress PDF"
      description="Make a PDF smaller. Pick how much quality you're willing to trade for size."
      action={
        !result && (
          <button
            type="button"
            disabled={!ready || running}
            onClick={start}
            className="min-h-12 w-full rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Compress PDF
          </button>
        )
      }
    >
      <DropZone
        accept="application/pdf,.pdf"
        multiple={false}
        label="Choose a PDF"
        hint="One PDF at a time. You can also drop it anywhere on this page."
        onFiles={(selected) => {
          job.reset();
          files.replace(selected.slice(0, 1));
        }}
      />

      {item && (
        <SortableFileGrid
          items={items}
          onRemove={(id) => {
            job.reset();
            files.remove(id);
          }}
        />
      )}

      <OptionGroup
        label="Compression level"
        value={level}
        options={LEVELS}
        onChange={(value) => {
          job.reset();
          setLevel(value);
        }}
      />

      {job.state.status === 'running' && <ProgressBar value={job.state.progress} label={progressLabel} />}
      {job.state.status === 'error' && (
        <ErrorBanner
          message={
            job.state.fileIndex !== undefined
              ? 'This PDF could not be used. It is marked in red above.'
              : ERROR_MESSAGES[job.state.code]
          }
          onRetry={job.state.fileIndex === undefined ? start : undefined}
        />
      )}
      {result && done && (
        <ResultPanel
          file={result}
          onReset={() => {
            job.reset();
            files.clear();
          }}
        >
          {done.usedOriginal ? (
            <p>This PDF is already well optimized.</p>
          ) : (
            <p>
              {formatBytes(done.originalSize)} → {formatBytes(done.compressedSize)}{' '}
              <strong>({percentSaved(done.originalSize, done.compressedSize)}% smaller)</strong>
            </p>
          )}
        </ResultPanel>
      )}
    </ToolLayout>
  );
}
