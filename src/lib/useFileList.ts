import { useCallback, useEffect, useRef, useState } from 'react';
import { messageFor } from './errorMessages';
import { moveItem, rotateItem, updateItem, type FileItem } from './fileList';

export type Inspector = (file: File) => Promise<{ thumbUrl?: string; pageCount?: number }>;

/** id → preview URL for every file still in the list; used to revoke URLs when files leave. */
type LiveFiles = Map<string, string | undefined>;

function release(live: LiveFiles, id: string): void {
  const url = live.get(id);
  if (url) URL.revokeObjectURL(url);
  live.delete(id);
}

export function useFileList(inspect: Inspector) {
  const [items, setItems] = useState<FileItem[]>([]);
  const live = useRef<LiveFiles>(new Map());

  useEffect(() => {
    const map = live.current;
    return () => [...map.keys()].forEach((id) => release(map, id));
  }, []);

  const add = useCallback(
    (files: File[]) => {
      const added: FileItem[] = files.map((file) => ({ id: crypto.randomUUID(), file, rotation: 0, status: 'checking' }));
      added.forEach((item) => live.current.set(item.id, undefined));
      setItems((current) => [...current, ...added]);
      for (const item of added) {
        inspect(item.file).then(
          (info) => {
            if (!live.current.has(item.id)) {
              if (info.thumbUrl) URL.revokeObjectURL(info.thumbUrl); // removed while it was being checked
              return;
            }
            live.current.set(item.id, info.thumbUrl);
            setItems((current) => updateItem(current, item.id, { status: 'ready', ...info }));
          },
          (err: unknown) => setItems((current) => updateItem(current, item.id, { status: 'error', error: messageFor(err) })),
        );
      }
    },
    [inspect],
  );

  const remove = useCallback((id: string) => {
    release(live.current, id);
    setItems((current) => current.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => {
    [...live.current.keys()].forEach((id) => release(live.current, id));
    setItems([]);
  }, []);

  const replace = useCallback(
    (files: File[]) => {
      clear();
      add(files);
    },
    [add, clear],
  );

  const move = useCallback((activeId: string, overId: string) => setItems((c) => moveItem(c, activeId, overId)), []);
  const rotate = useCallback((id: string) => setItems((c) => rotateItem(c, id)), []);

  return { items, add, replace, remove, move, rotate, clear };
}
