import { recompressImages, type RecompressSettings } from './recompressImages';

export type CompressionLevel = 'light' | 'medium';

export interface CompressOptions {
  onProgress?: (value: number) => void;
}

export interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  usedOriginal: boolean;
}

const IMAGE_SETTINGS: Record<CompressionLevel, RecompressSettings> = {
  light: { quality: 0.8, dpi: 200 },
  medium: { quality: 0.6, dpi: 120 },
};

export async function compressPdf(
  pdf: Uint8Array,
  level: CompressionLevel,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const output = await recompressImages(pdf, IMAGE_SETTINGS[level], options.onProgress);
  return pickSmaller(pdf, output);
}

function pickSmaller(original: Uint8Array, output: Uint8Array): CompressResult {
  if (output.length >= original.length) {
    return { bytes: original, originalSize: original.length, compressedSize: original.length, usedOriginal: true };
  }
  return { bytes: output, originalSize: original.length, compressedSize: output.length, usedOriginal: false };
}
