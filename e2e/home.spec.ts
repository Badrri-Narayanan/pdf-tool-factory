import { test, expect } from './fixtures';

test('home lists the three tools and the privacy notice', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Your private PDF toolkit' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Images → PDF/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Merge PDFs/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Compress PDF/ })).toBeVisible();
  await expect(page.getByText('Files are processed on your device. Nothing is uploaded.')).toBeVisible();
});

test('unknown routes show a not-found page with a way home', async ({ page }) => {
  await page.goto('/#/nope');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to all tools' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your private PDF toolkit' })).toBeVisible();
});
