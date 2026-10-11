import { ToolError } from './errors';

interface GhostscriptModule {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
  };
  callMain(args: string[]): number;
}

type CreateGhostscript = (options: Record<string, unknown>) => Promise<GhostscriptModule>;

const ENGINE_DIR = 'vendor/ghostscript/';
// /ebook alone only downsamples images above ~225 dpi and passes JPEGs through untouched, so typical
// scans would not shrink. The explicit image settings make Maximum at least as aggressive as Medium.
const ARGS = [
  '-sDEVICE=pdfwrite',
  '-dCompatibilityLevel=1.5',
  '-dPDFSETTINGS=/ebook',
  '-dPassThroughJPEGImages=false',
  '-dDownsampleColorImages=true',
  '-dColorImageDownsampleType=/Bicubic',
  '-dColorImageResolution=120',
  '-dColorImageDownsampleThreshold=1.0',
  '-dDownsampleGrayImages=true',
  '-dGrayImageDownsampleType=/Bicubic',
  '-dGrayImageResolution=120',
  '-dGrayImageDownsampleThreshold=1.0',
  '-dJPEGQ=60',
  '-dNOPAUSE',
  '-dQUIET',
  '-dBATCH',
  '-dSAFER',
  '-sOutputFile=/out.pdf',
  '/in.pdf',
];
const DOWNLOAD_SHARE = 0.5;

export async function ghostscriptCompress(
  pdf: Uint8Array,
  baseUrl: string,
  onProgress: (value: number) => void,
): Promise<Uint8Array> {
  const engineRoot = new URL(ENGINE_DIR, baseUrl);
  const wasmUrl = new URL('gs.wasm', engineRoot).href;

  let gs: GhostscriptModule;
  try {
    // Download first with progress; the engine's own fetch then hits the browser/service-worker cache.
    await downloadWithProgress(wasmUrl, (value) => onProgress(value * DOWNLOAD_SHARE));
    const { default: createGhostscript } = (await import(
      /* @vite-ignore */ new URL('gs.mjs', engineRoot).href
    )) as { default: CreateGhostscript };
    gs = await createGhostscript({ noInitialRun: true, locateFile: () => wasmUrl, print: () => {}, printErr: () => {} });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new ToolError('ENGINE_LOAD_FAILED', `Could not load the compression engine: ${reason}`);
  }
  onProgress(0.6);

  try {
    gs.FS.writeFile('/in.pdf', pdf);
    const exitCode = gs.callMain(ARGS);
    if (exitCode !== 0) throw new Error(`exit code ${exitCode}`);
    const output = gs.FS.readFile('/out.pdf');
    onProgress(1);
    return output;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new ToolError('CORRUPT_FILE', `Ghostscript could not process this PDF (${reason}).`);
  }
}

async function downloadWithProgress(url: string, onProgress: (value: number) => void): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} for ${url}`);
  const total = Number(response.headers.get('Content-Length')) || 0;
  const reader = response.body.getReader();
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    if (total) onProgress(Math.min(1, received / total));
  }
  onProgress(1);
}
