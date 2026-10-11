import { test, expect } from './fixtures';
import { downloadPdf, makeNoisyPdfFile, makeTextPdfFile } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/compress-pdf');
});

test('light compression shrinks a photo PDF and shows the savings', async ({ page }) => {
  const input = await makeNoisyPdfFile(page, 'Scan 2026.pdf');
  await page.getByLabel('Choose a PDF').setInputFiles([input]);
  await expect(page.getByRole('radio', { name: /Light/ })).toBeChecked();
  await page.getByRole('button', { name: 'Compress PDF' }).click();

  await expect(page.getByText(/% smaller/)).toBeVisible();
  const { filename, size, doc } = await downloadPdf(page);
  expect(filename).toBe('Scan 2026-compressed.pdf');
  expect(size).toBeLessThan(input.buffer.length);
  expect(doc.getPageCount()).toBe(1);
});

test('an already optimized PDF comes back unchanged', async ({ page }) => {
  const input = await makeTextPdfFile('notes.pdf');
  await page.getByLabel('Choose a PDF').setInputFiles([input]);
  await page.getByRole('radio', { name: /Medium/ }).click();
  await page.getByRole('button', { name: 'Compress PDF' }).click();

  await expect(page.getByText('This PDF is already well optimized.')).toBeVisible();
  const { size } = await downloadPdf(page);
  expect(size).toBe(input.buffer.length);
});

test('maximum compression loads the engine and finishes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'one run of the 16 MB engine is enough');
  test.slow();
  await page.getByLabel('Choose a PDF').setInputFiles([await makeNoisyPdfFile(page, 'big.pdf')]);
  await page.getByRole('radio', { name: /Maximum/ }).click();
  await expect(page.getByText(/16 MB download/)).toBeVisible();
  await page.getByRole('button', { name: 'Compress PDF' }).click();
  await expect(page.getByText(/% smaller/)).toBeVisible({ timeout: 90_000 });
});

test('adding a second file replaces the first', async ({ page }) => {
  await page.getByLabel('Choose a PDF').setInputFiles([await makeTextPdfFile('one.pdf')]);
  await page.getByLabel('Choose a PDF').setInputFiles([await makeTextPdfFile('two.pdf')]);
  await expect(page.getByText('two.pdf')).toBeVisible();
  await expect(page.getByText('one.pdf')).toHaveCount(0);
});
