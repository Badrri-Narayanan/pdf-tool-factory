import { describe, expect, it } from 'vitest';
import { exceedsSafeSize } from './sizeGuard';

const MB = 1024 * 1024;

describe('exceedsSafeSize', () => {
  it('uses 200 MB on touch devices and 1 GB elsewhere', () => {
    expect(exceedsSafeSize(200 * MB, true)).toBe(false);
    expect(exceedsSafeSize(201 * MB, true)).toBe(true);
    expect(exceedsSafeSize(900 * MB, false)).toBe(false);
    expect(exceedsSafeSize(1025 * MB, false)).toBe(true);
  });
});
