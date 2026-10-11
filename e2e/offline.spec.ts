import { test, expect } from './fixtures';

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Your private PDF toolkit' })).toBeVisible();
  await page.getByRole('link', { name: /Merge PDFs/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Merge PDFs' })).toBeVisible();
});

test('the built page ships a Content-Security-Policy', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("connect-src 'self' data: blob:");
});
