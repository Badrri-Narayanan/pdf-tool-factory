import type { Rotation } from '../core/image/render';
import { ERROR_MESSAGES } from './errorMessages';
import type { JobState } from './useWorkerJob';

export interface FileItem {
  id: string;
  file: File;
  rotation: Rotation;
  status: 'checking' | 'ready' | 'error';
  error?: string;
  thumbUrl?: string;
  pageCount?: number;
}

export function moveItem(items: FileItem[], activeId: string, overId: string): FileItem[] {
  const from = items.findIndex((i) => i.id === activeId);
  const to = items.findIndex((i) => i.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function rotateItem(items: FileItem[], id: string): FileItem[] {
  return updateItem(items, id, { rotation: ((items.find((i) => i.id === id)?.rotation ?? 0) + 90) % 360 as Rotation });
}

export function updateItem(items: FileItem[], id: string, patch: Partial<FileItem>): FileItem[] {
  return items.map((i) => (i.id === id ? { ...i, ...patch } : i));
}

/** When a job fails because of one specific file, show that file's card as an error. */
export function applyJobError(items: FileItem[], state: JobState<unknown>): FileItem[] {
  if (state.status !== 'error' || state.fileIndex === undefined) return items;
  const error = ERROR_MESSAGES[state.code];
  return items.map((item, i) => (i === state.fileIndex ? { ...item, status: 'error', error } : item));
}
