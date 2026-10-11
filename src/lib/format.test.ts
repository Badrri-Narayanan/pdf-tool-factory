import { describe, expect, it } from 'vitest';
import { compressedFilename, formatBytes, percentSaved } from './format';

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [1536, '1.5 KB'],
    [10 * 1024 * 1024, '10 MB'],
    [1.25 * 1024 ** 3, '1.3 GB'],
  ])('formats %i as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});

describe('percentSaved', () => {
  it('rounds to a whole percent', () => {
    expect(percentSaved(1000, 270)).toBe(73);
  });
});

describe('compressedFilename', () => {
  it('appends -compressed before the extension', () => {
    expect(compressedFilename('Bank Statement.PDF')).toBe('Bank Statement-compressed.pdf');
    expect(compressedFilename('scan')).toBe('scan-compressed.pdf');
  });
});
