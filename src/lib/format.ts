const UNITS = ['KB', 'MB', 'GB'];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1).replace(/\.0$/, '') : Math.round(value)} ${UNITS[unit]}`;
}

export function percentSaved(original: number, compressed: number): number {
  return Math.round((1 - compressed / original) * 100);
}

export function compressedFilename(name: string): string {
  return `${name.replace(/\.pdf$/i, '')}-compressed.pdf`;
}
