import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ privacyGuard: void }>({
  privacyGuard: [
    async ({ context, page, baseURL }, run) => {
      const origin = new URL(baseURL!).origin;
      const external: string[] = [];
      const cspViolations: string[] = [];
      context.on('request', (request) => {
        const url = request.url();
        if (url.startsWith('blob:') || url.startsWith('data:')) return;
        if (new URL(url).origin !== origin) external.push(url);
      });
      page.on('console', (message) => {
        if (message.text().includes('Content Security Policy')) cspViolations.push(message.text());
      });
      await run();
      expect(external, 'requests to other origins').toEqual([]);
      expect(cspViolations, 'Content-Security-Policy violations').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
