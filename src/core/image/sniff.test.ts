import { describe, expect, it } from 'vitest';
import { sniffImageFormat } from './sniff';

const pad = (head: number[]) => new Uint8Array([...head, ...new Array(16).fill(0)]);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe('sniffImageFormat', () => {
  it.each([
    ['jpeg', [0xff, 0xd8, 0xff, 0xe0]],
    ['png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ['gif', ascii('GIF89a')],
    ['bmp', ascii('BM')],
    ['webp', [...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')]],
    ['heic', [0, 0, 0, 0x18, ...ascii('ftypheic')]],
    ['heic', [0, 0, 0, 0x18, ...ascii('ftypmif1')]],
  ])('detects %s from its signature', (expected, head) => {
    expect(sniffImageFormat(pad(head))).toBe(expected);
  });

  it('returns null for text, PDFs and too-short input', () => {
    expect(sniffImageFormat(pad(ascii('hello world')))).toBeNull();
    expect(sniffImageFormat(pad(ascii('%PDF-1.7')))).toBeNull();
    expect(sniffImageFormat(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});
