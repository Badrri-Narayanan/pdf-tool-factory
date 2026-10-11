import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ privacyGuard: void }>({
  privacyGuard: [
    async ({ context, baseURL }, run) => {
      const origin = new URL(baseURL!).origin;
      const external: string[] = [];
      context.on('request', (request) => {
        const url = request.url();
        if (url.startsWith('blob:') || url.startsWith('data:')) return;
        if (new URL(url).origin !== origin) external.push(url);
      });
      await run();
      expect(external, 'requests to other origins').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
