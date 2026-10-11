import { formatBytes } from './format';

const MOBILE_LIMIT = 200 * 1024 * 1024;
const DESKTOP_LIMIT = 1024 * 1024 * 1024;

export function exceedsSafeSize(totalBytes: number, coarsePointer: boolean): boolean {
  return totalBytes > (coarsePointer ? MOBILE_LIMIT : DESKTOP_LIMIT);
}

export function confirmLargeJob(files: File[]): boolean {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (!exceedsSafeSize(total, coarse)) return true;
  return window.confirm(
    `These files add up to ${formatBytes(total)}. Processing this much on this device may be slow or fail. Continue?`,
  );
}
