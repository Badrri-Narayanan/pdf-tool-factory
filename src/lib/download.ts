const REVOKE_AFTER_MS = 10_000;

export function pdfFile(bytes: Uint8Array, name: string): File {
  return new File([bytes as Uint8Array<ArrayBuffer>], name, { type: 'application/pdf' });
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

export function canShareFile(file: File): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}

export async function shareFile(file: File): Promise<void> {
  try {
    await navigator.share({ files: [file], title: file.name });
  } catch (err) {
    if ((err as Error).name !== 'AbortError') throw err;
  }
}
