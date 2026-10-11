import { PDFDocument, type PDFImage } from 'pdf-lib';
import { ToolError, toToolError } from './errors';
import { prepareImage, type ImageInput } from './image/prepare';

export type { ImageInput } from './image/prepare';

export interface ImagesToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'large';
  quality: 'original' | 'reduced';
}

export const DEFAULT_IMAGES_TO_PDF_OPTIONS: ImagesToPdfOptions = {
  pageSize: 'fit',
  orientation: 'auto',
  margin: 'none',
  quality: 'original',
};

const PX_TO_PT = 0.75;
const mmToPt = (mm: number) => (mm * 72) / 25.4;
const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;
const MARGINS = { none: 0, small: mmToPt(10), large: mmToPt(20) } as const;

export async function imagesToPdf(
  images: ImageInput[],
  options: ImagesToPdfOptions,
  onProgress: (value: number) => void = () => {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    let image: PDFImage;
    try {
      const prepared = await prepareImage(images[i], options.quality);
      image = prepared.format === 'jpeg' ? await doc.embedJpg(prepared.bytes) : await doc.embedPng(prepared.bytes);
    } catch (err) {
      throw err instanceof ToolError || err instanceof RangeError
        ? toToolError(err, i)
        : new ToolError('CORRUPT_FILE', 'Could not read this image.', i);
    }
    addImagePage(doc, image, options);
    onProgress((i + 1) / images.length);
  }
  return doc.save({ useObjectStreams: true });
}

function addImagePage(doc: PDFDocument, image: PDFImage, options: ImagesToPdfOptions): void {
  const margin = MARGINS[options.margin];
  const imageWidth = image.width * PX_TO_PT;
  const imageHeight = image.height * PX_TO_PT;

  let pageWidth: number;
  let pageHeight: number;
  if (options.pageSize === 'fit') {
    pageWidth = imageWidth + 2 * margin;
    pageHeight = imageHeight + 2 * margin;
  } else {
    const [short, long] = PAGE_SIZES[options.pageSize];
    const landscape =
      options.orientation === 'landscape' || (options.orientation === 'auto' && image.width > image.height);
    [pageWidth, pageHeight] = landscape ? [long, short] : [short, long];
  }

  const scale = Math.min((pageWidth - 2 * margin) / imageWidth, (pageHeight - 2 * margin) / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const page = doc.addPage([pageWidth, pageHeight]);
  page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
}
