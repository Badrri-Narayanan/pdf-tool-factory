import { useMemo, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { ErrorBanner } from '../../components/ErrorBanner';
import { OptionGroup } from '../../components/OptionGroup';
import { ProgressBar } from '../../components/ProgressBar';
import { ResultPanel } from '../../components/ResultPanel';
import { SortableFileGrid } from '../../components/SortableFileGrid';
import { ToolLayout } from '../../components/ToolLayout';
import { DEFAULT_IMAGES_TO_PDF_OPTIONS, type ImagesToPdfOptions } from '../../core/imagesToPdf';
import { pdfFile } from '../../lib/download';
import { ERROR_MESSAGES } from '../../lib/errorMessages';
import { inspectImage } from '../../lib/inspect';
import { confirmLargeJob } from '../../lib/sizeGuard';
import { applyJobError } from '../../lib/fileList';
import { useFileList } from '../../lib/useFileList';
import { useWorkerJob } from '../../lib/useWorkerJob';
import type { ImagesToPdfRequest } from '../../workers/images-to-pdf.worker';

const createWorker = () =>
  new Worker(new URL('../../workers/images-to-pdf.worker.ts', import.meta.url), { type: 'module' });

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif';

export default function ImagesToPdfPage() {
  const files = useFileList(inspectImage);
  const [options, setOptions] = useState<ImagesToPdfOptions>(DEFAULT_IMAGES_TO_PDF_OPTIONS);
  const job = useWorkerJob<ImagesToPdfRequest, Uint8Array>(createWorker);
  const items = applyJobError(files.items, job.state);

  const hasErrors = items.some((i) => i.status === 'error');
  const ready = items.length > 0 && items.every((i) => i.status === 'ready');
  const running = job.state.status === 'running';
  const result = useMemo(
    () => (job.state.status === 'done' ? pdfFile(job.state.result, 'images.pdf') : null),
    [job.state],
  );

  const set = <K extends keyof ImagesToPdfOptions>(key: K) => (value: ImagesToPdfOptions[K]) => {
    job.reset();
    setOptions((o) => ({ ...o, [key]: value }));
  };
  const edit = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => {
    job.reset();
    fn(...args);
  };

  const start = () => {
    if (!confirmLargeJob(items.map((i) => i.file))) return;
    job.run({ images: items.map((i) => ({ file: i.file, rotation: i.rotation })), options });
  };

  return (
    <ToolLayout
      title="Images → PDF"
      description="Add photos or images, put them in order, and turn them into one PDF."
      action={
        !result && (
          <button
            type="button"
            disabled={!ready || running}
            onClick={start}
            className="min-h-12 w-full rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Create PDF
          </button>
        )
      }
    >
      <DropZone
        accept={ACCEPT}
        multiple
        label="Choose images"
        hint="JPG, PNG, WebP, GIF, BMP or HEIC. You can also drop them anywhere on this page."
        onFiles={edit(files.add)}
      />

      {items.length > 0 && (
        <SortableFileGrid items={items} onMove={edit(files.move)} onRemove={edit(files.remove)} onRotate={edit(files.rotate)} />
      )}
      {hasErrors && <p className="text-sm text-red-600 dark:text-red-400">Remove the files marked in red to continue.</p>}

      <div className="space-y-5">
        <OptionGroup
          label="Page size"
          value={options.pageSize}
          onChange={set('pageSize')}
          options={[
            { value: 'fit', label: 'Fit to image', description: 'Each page matches its image' },
            { value: 'a4', label: 'A4', description: '210 × 297 mm' },
            { value: 'letter', label: 'Letter', description: '8.5 × 11 in' },
          ]}
        />
        {options.pageSize !== 'fit' && (
          <OptionGroup
            label="Orientation"
            value={options.orientation}
            onChange={set('orientation')}
            options={[
              { value: 'auto', label: 'Auto', description: 'Match each image' },
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
          />
        )}
        <OptionGroup
          label="Margin"
          value={options.margin}
          onChange={set('margin')}
          options={[
            { value: 'none', label: 'None' },
            { value: 'small', label: 'Small', description: '10 mm' },
            { value: 'large', label: 'Large', description: '20 mm' },
          ]}
        />
        <OptionGroup
          label="Image quality"
          value={options.quality}
          onChange={set('quality')}
          options={[
            { value: 'original', label: 'Original', description: 'Best quality, larger file' },
            { value: 'reduced', label: 'Reduced', description: 'Smaller file, fine for sharing' },
          ]}
        />
      </div>

      {job.state.status === 'running' && <ProgressBar value={job.state.progress} label="Creating PDF" />}
      {job.state.status === 'error' && (
        <ErrorBanner
          message={job.state.fileIndex !== undefined ? 'One image could not be used. It is marked in red above.' : ERROR_MESSAGES[job.state.code]}
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
