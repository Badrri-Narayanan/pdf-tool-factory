import { test, expect } from './fixtures';
import { downloadPdf, makeImageFile, reorderBefore } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/images-to-pdf');
});

test('converts images to a PDF in the chosen order', async ({ page }) => {
  const wide = await makeImageFile(page, 'png', 400, 200, 'wide.png');
  const tall = await makeImageFile(page, 'jpeg', 200, 400, 'tall.jpg');
  await page.getByLabel('Choose images').setInputFiles([wide, tall]);
  await expect(page.getByRole('button', { name: 'Reorder tall.jpg' })).toBeVisible();

  await reorderBefore(page, 'tall.jpg');
  await page.getByRole('button', { name: 'Create PDF' }).click();

  const { filename, doc } = await downloadPdf(page);
  expect(filename).toBe('images.pdf');
  const [first, second] = doc.getPages().map((p) => p.getSize());
  expect(first.height).toBeGreaterThan(first.width); // tall image is now first
  expect(second.width).toBeGreaterThan(second.height);
});

test('A4 option produces A4 pages', async ({ page }) => {
  await page.getByLabel('Choose images').setInputFiles([await makeImageFile(page, 'png', 100, 100, 'square.png')]);
  await page.getByRole('radio', { name: /A4/ }).click();
  await page.getByRole('button', { name: 'Create PDF' }).click();
  const { doc } = await downloadPdf(page);
  expect(doc.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
});

test('a wrong file type is flagged and blocks conversion until removed', async ({ page }) => {
  await page.getByLabel('Choose images').setInputFiles([
    await makeImageFile(page, 'png', 50, 50, 'ok.png'),
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('shopping list') },
  ]);
  await expect(page.getByText("This file type isn't supported.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create PDF' })).toBeDisabled();
  await expect(page.getByText('Remove the files marked in red to continue.')).toBeVisible();

  await page.getByRole('button', { name: 'Remove notes.txt' }).click();
  await expect(page.getByRole('button', { name: 'Create PDF' })).toBeEnabled();
});

test('Create PDF is disabled until images are added', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Create PDF' })).toBeDisabled();
});
