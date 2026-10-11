import type { ReactNode } from 'react';
import { Download, Share2 } from 'lucide-react';
import { canShareFile, downloadFile, shareFile } from '../lib/download';

interface Props {
  file: File;
  children?: ReactNode;
  onReset(): void;
}

export function ResultPanel({ file, children, onReset }: Props) {
  return (
    <section aria-label="Result" className="space-y-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950">
      <p className="font-semibold">Your file is ready: {file.name}</p>
      {children}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => downloadFile(file)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-medium text-white hover:bg-blue-700"
        >
          <Download aria-hidden className="size-4" /> Download
        </button>
        {canShareFile(file) && (
          <button
            type="button"
            onClick={() => void shareFile(file).catch(() => {})}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-medium dark:border-slate-700 dark:bg-slate-900"
          >
            <Share2 aria-hidden className="size-4" /> Share
          </button>
        )}
        <button type="button" onClick={onReset} className="min-h-11 px-3 font-medium text-slate-600 underline dark:text-slate-400">
          Start over
        </button>
      </div>
    </section>
  );
}
