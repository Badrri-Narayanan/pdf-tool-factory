import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, Loader2, RotateCw, X } from 'lucide-react';
import type { FileItem } from '../lib/fileList';
import { formatBytes } from '../lib/format';

interface Props {
  item: FileItem;
  onRemove(id: string): void;
  /** Reordering is only offered when the grid supports it. */
  reorderable?: boolean;
  onRotate?(id: string): void;
}

export function FileCard({ item, onRemove, onRotate, reorderable = true }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [thumbFailed, setThumbFailed] = useState(false);
  const name = item.file.name;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex flex-col overflow-hidden rounded-xl border bg-white dark:bg-slate-900 ${
        item.status === 'error' ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
      } ${isDragging ? 'z-10 shadow-lg' : ''}`}
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 dark:bg-slate-800">
        {item.status === 'checking' ? (
          <Loader2 aria-label="Checking file" className="size-6 animate-spin text-slate-400" />
        ) : item.thumbUrl && !thumbFailed ? (
          <img
            src={item.thumbUrl}
            alt=""
            onError={() => setThumbFailed(true)}
            style={{ transform: `rotate(${item.rotation}deg)` }}
            className="max-h-full max-w-full object-contain transition-transform"
          />
        ) : (
          <FileText aria-hidden className="size-10 text-slate-400" />
        )}
      </div>
      <div className="flex items-start gap-1 p-2">
        {reorderable && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reorder ${name}`}
            className="flex size-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1 py-1">
          <p className="truncate text-sm font-medium" title={name}>{name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {item.pageCount !== undefined && `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'} · `}
            {formatBytes(item.file.size)}
          </p>
          {item.status === 'error' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{item.error}</p>}
        </div>
      </div>
      <div className="absolute right-1 top-1 flex gap-1">
        {onRotate && item.status !== 'error' && (
          <button
            type="button"
            aria-label={`Rotate ${name}`}
            onClick={() => onRotate(item.id)}
            className="flex size-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-slate-200"
          >
            <RotateCw aria-hidden className="size-4" />
          </button>
        )}
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={() => onRemove(item.id)}
          className="flex size-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-slate-200"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </li>
  );
}
