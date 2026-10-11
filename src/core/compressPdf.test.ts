import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { compressPdf } from './compressPdf';
import { imageStreams, makeEncryptedPdf, makeImagePdf, makeNoiseImage, makeTextPdf, makeTransparentPng } from '../test/fixtures';

describe('compressPdf (light/medium)', () => {
  it('shrinks a photo-heavy PDF and keeps it valid', async () => {
    const pdf = await makeImagePdf(await makeNoiseImage('jpeg', 1200, 900), 'jpeg');
    const result = await compressPdf(pdf, 'light');
    expect(result.usedOriginal).toBe(false);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
    expect(result.compressedSize).toBe(result.bytes.length);
    expect((await PDFDocument.load(result.bytes)).getPageCount()).toBe(1);
  });

  it('downsamples to the DPI limit measured against the page size', async () => {
    // 200 pt wide page at 200 DPI → at most round(200 / 72 * 200) = 556 px.
    const pdf = await makeImagePdf(await makeNoiseImage('jpeg', 1200, 900), 'jpeg');
    const [image] = await imageStreams((await compressPdf(pdf, 'light')).bytes);
    expect(image.width).toBeLessThanOrEqual(556);
  });

  it('compresses harder at medium than at light', async () => {
    const pdf = await makeImagePdf(await makeNoiseImage('jpeg', 1200, 900), 'jpeg');
    const light = await compressPdf(pdf, 'light');
    const medium = await compressPdf(pdf, 'medium');
    expect(medium.compressedSize).toBeLessThan(light.compressedSize);
  });

  it('re-encodes uncompressed (Flate) RGB images as JPEG', async () => {
    const pdf = await makeImagePdf(await makeNoiseImage('png', 800, 600), 'png');
    const [image] = await imageStreams((await compressPdf(pdf, 'light')).bytes);
    expect(image.filter).toBe('/DCTDecode');
  });

  it('returns the original unchanged when there is nothing to shrink', async () => {
    const pdf = await makeTextPdf();
    const result = await compressPdf(pdf, 'medium');
    expect(result).toEqual({ bytes: pdf, originalSize: pdf.length, compressedSize: pdf.length, usedOriginal: true });
    expect(result.bytes).toBe(pdf);
  });

  it('leaves images with transparency alone', async () => {
    const pdf = await makeImagePdf(await makeTransparentPng(400, 300), 'png');
    const result = await compressPdf(pdf, 'medium');
    const [image] = await imageStreams(result.bytes);
    expect(image.hasSMask).toBe(true);
    expect(image.filter).not.toBe('/DCTDecode');
  });

  it('rejects password-protected PDFs', async () => {
    await expect(compressPdf(await makeEncryptedPdf(), 'light')).rejects.toMatchObject({ code: 'ENCRYPTED_PDF' });
  });
});
