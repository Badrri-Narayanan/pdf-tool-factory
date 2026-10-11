import { ToolError } from './errors';
import { ghostscriptCompress } from './ghostscript';
import { recompressImages, type RecompressSettings } from './recompressImages';

export type CompressionLevel = 'light' | 'medium' | 'maximum';

export interface CompressOptions {
  onProgress?: (value: number) => void;
  /** App root URL (the page's document.baseURI); required for 'maximum'. */
  ghostscriptBaseUrl?: string;
}

export interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  usedOriginal: boolean;
}

const IMAGE_SETTINGS: Record<Exclude<CompressionLevel, 'maximum'>, RecompressSettings> = {
  light: { quality: 0.8, dpi: 200 },
  medium: { quality: 0.6, dpi: 120 },
};

export async function compressPdf(
  pdf: Uint8Array,
  level: CompressionLevel,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const onProgress = options.onProgress ?? (() => {});
  let output: Uint8Array;
  if (level === 'maximum') {
    if (!options.ghostscriptBaseUrl) {
      throw new ToolError('ENGINE_LOAD_FAILED', 'No location was given for the compression engine.');
    }
    output = await ghostscriptCompress(pdf, options.ghostscriptBaseUrl, onProgress);
  } else {
    output = await recompressImages(pdf, IMAGE_SETTINGS[level], onProgress);
  }
  return pickSmaller(pdf, output);
}

function pickSmaller(original: Uint8Array, output: Uint8Array): CompressResult {
  if (output.length >= original.length) {
    return { bytes: original, originalSize: original.length, compressedSize: original.length, usedOriginal: true };
  }
  return { bytes: output, originalSize: original.length, compressedSize: output.length, usedOriginal: false };
}
