import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { ghostscriptCompress } from './ghostscript';
import { compressPdf } from './compressPdf';
import { makeImagePdf, makeNoiseImage } from '../test/fixtures';

const BASE = `${location.origin}/`;

describe('ghostscriptCompress', () => {
  it('produces a smaller, valid PDF and reports progress', { timeout: 120_000 }, async () => {
    const pdf = await makeImagePdf(await makeNoiseImage('jpeg', 1200, 900), 'jpeg', [612, 792]);
    const onProgress = vi.fn();
    const output = await ghostscriptCompress(pdf, BASE, onProgress);
    expect(output.length).toBeLessThan(pdf.length);
    expect((await PDFDocument.load(output)).getPageCount()).toBe(1);
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('fails with ENGINE_LOAD_FAILED when the engine files are missing', async () => {
    const pdf = await makeImagePdf(await makeNoiseImage('jpeg', 50, 50), 'jpeg');
    await expect(ghostscriptCompress(pdf, `${location.origin}/missing/`, () => {})).rejects.toMatchObject({
      code: 'ENGINE_LOAD_FAILED',
    });
  });
});

describe('compressPdf (maximum)', () => {
  it('uses Ghostscript and requires the base URL', { timeout: 120_000 }, async () => {
    const pdf = await makeImagePdf(await makeNoiseImage('jpeg', 1200, 900), 'jpeg', [612, 792]);
    await expect(compressPdf(pdf, 'maximum')).rejects.toMatchObject({ code: 'ENGINE_LOAD_FAILED' });
    const result = await compressPdf(pdf, 'maximum', { ghostscriptBaseUrl: BASE });
    expect(result.usedOriginal).toBe(false);
  });
});
