import { readFile } from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export interface UploadFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export async function makeImageFile(page: Page, type: 'png' | 'jpeg', width: number, height: number, name: string): Promise<UploadFile> {
  const base64 = await page.evaluate(
    ({ type, width, height }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#3366cc';
      ctx.fillRect(0, 0, width, height);
      return canvas.toDataURL(`image/${type}`).split(',')[1];
    },
    { type, width, height },
  );
  return { name, mimeType: `image/${type}`, buffer: Buffer.from(base64, 'base64') };
}

export async function makePdfFile(pageCount: number, name: string, size: [number, number] = [300, 400]): Promise<UploadFile> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage(size);
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

export async function makeTextPdfFile(name: string): Promise<UploadFile> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([300, 400]).drawText('Plain text only.', { x: 20, y: 360, size: 14, font });
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

/** A PDF holding one large noisy JPEG, so compression has something to shrink. */
export async function makeNoisyPdfFile(page: Page, name: string): Promise<UploadFile> {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d')!;
    const image = ctx.createImageData(1200, 900);
    for (let i = 0; i < image.data.length; i += 4) {
      image.data[i] = Math.random() * 255;
      image.data[i + 1] = Math.random() * 255;
      image.data[i + 2] = Math.random() * 255;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/jpeg', 1).split(',')[1];
  });
  const doc = await PDFDocument.create();
  const jpg = await doc.embedJpg(Buffer.from(base64, 'base64'));
  doc.addPage([612, 792]).drawImage(jpg, { x: 0, y: 0, width: 612, height: 792 });
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

export async function downloadPdf(page: Page, buttonName = 'Download') {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: buttonName }).click()]);
  const bytes = await readFile(await download.path());
  return { filename: download.suggestedFilename(), size: bytes.length, doc: await PDFDocument.load(bytes) };
}

/**
 * Moves a file card one position earlier using the keyboard on its drag handle.
 * dnd-kit attaches its key listeners and measures droppables asynchronously after
 * pick-up, so each key press waits for the previous step's screen-reader
 * announcement instead of firing blind.
 */
export async function reorderBefore(page: Page, movingName: string) {
  const announcement = page.locator('[aria-live]').filter({ hasText: /\S/ });
  const handle = page.getByRole('button', { name: `Reorder ${movingName}` });
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(announcement).toHaveCount(1);
  const pickedUp = await announcement.textContent();
  await page.keyboard.press('ArrowLeft');
  await expect(announcement).not.toHaveText(pickedUp ?? '');
  await page.keyboard.press('Space');
}
