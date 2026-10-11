import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface Props {
  accept: string;
  multiple: boolean;
  label: string;
  hint: string;
  onFiles(files: File[]): void;
}

export function DropZone({ accept, multiple, label, hint, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  });

  useEffect(() => {
    const over = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (e.relatedTarget === null) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!e.dataTransfer?.files.length) return;
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFilesRef.current(multiple ? files : files.slice(0, 1));
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [multiple]);

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <Upload aria-hidden className="size-8 text-blue-600" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-11 rounded-xl bg-blue-600 px-5 font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {label}
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          hidden
          aria-label={label}
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length) onFiles(files);
          }}
        />
      </div>
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-600/20 backdrop-blur-sm">
          <p className="rounded-xl bg-white px-6 py-4 text-lg font-semibold shadow-lg dark:bg-slate-900">Drop files to add them</p>
        </div>
      )}
    </>
  );
}
