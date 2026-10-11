import { describe, expect, it } from 'vitest';
import { readJpegOrientation } from './exif';
import { withExifOrientation } from '../../test/fixtures';

const BARE_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('readJpegOrientation', () => {
  it('reads the orientation tag from an EXIF APP1 segment', () => {
    expect(readJpegOrientation(withExifOrientation(BARE_JPEG, 6))).toBe(6);
    expect(readJpegOrientation(withExifOrientation(BARE_JPEG, 3))).toBe(3);
  });

  it('defaults to 1 when there is no EXIF data', () => {
    expect(readJpegOrientation(BARE_JPEG)).toBe(1);
  });

  it('skips a non-EXIF APP1 segment such as XMP', () => {
    const xmp = new Uint8Array([0xff, 0xe1, 0x00, 0x08, ...[...'http'].map((c) => c.charCodeAt(0)), 0, 0]);
    const withXmp = new Uint8Array([0xff, 0xd8, ...xmp, ...withExifOrientation(BARE_JPEG, 8).subarray(2)]);
    expect(readJpegOrientation(withXmp)).toBe(8);
  });

  it('returns 1 for non-JPEG or truncated input instead of throwing', () => {
    expect(readJpegOrientation(new Uint8Array([0x89, 0x50]))).toBe(1);
    expect(readJpegOrientation(withExifOrientation(BARE_JPEG, 6).subarray(0, 12))).toBe(1);
  });
});
