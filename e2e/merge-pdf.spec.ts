import { test, expect } from './fixtures';
import { downloadPdf, makePdfFile, reorderBefore } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/merge-pdf');
});

test('merges PDFs in the chosen order', async ({ page }) => {
  await page.getByLabel('Choose PDFs').setInputFiles([
    await makePdfFile(2, 'first.pdf', [100, 100]),
    await makePdfFile(3, 'second.pdf', [200, 300]),
  ]);
  await expect(page.getByText('2 pages', { exact: false })).toBeVisible();
  await expect(page.getByText('3 pages', { exact: false })).toBeVisible();

  await reorderBefore(page, 'second.pdf');
  await page.getByRole('button', { name: 'Merge PDFs' }).click();

  const { filename, doc } = await downloadPdf(page);
  expect(filename).toBe('merged.pdf');
  expect(doc.getPageCount()).toBe(5);
  expect(doc.getPage(0).getSize()).toEqual({ width: 200, height: 300 });
});

test('needs at least two PDFs', async ({ page }) => {
  await page.getByLabel('Choose PDFs').setInputFiles([await makePdfFile(1, 'only.pdf')]);
  await expect(page.getByText('Add at least 2 PDFs to merge.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
});

test('a file that is not a PDF is flagged', async ({ page }) => {
  await page.getByLabel('Choose PDFs').setInputFiles([
    await makePdfFile(1, 'a.pdf'),
    await makePdfFile(1, 'b.pdf'),
    { name: 'fake.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not really a pdf') },
  ]);
  await expect(page.getByText("This file type isn't supported.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
});

test('a file with a PDF header but broken content is reported as damaged', async ({ page }) => {
  await page.getByLabel('Choose PDFs').setInputFiles([
    await makePdfFile(1, 'a.pdf'),
    await makePdfFile(1, 'b.pdf'),
    { name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\ngarbage garbage garbage') },
  ]);
  await expect(page.getByText("This file looks damaged and can't be read.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
});
