const SOI = 0xffd8;
const APP1 = 0xffe1;
const SOS = 0xffda;
const EXIF_HEADER = 0x45786966; // "Exif"
const ORIENTATION_TAG = 0x0112;

export function readJpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== SOI) return 1;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00 || marker === SOS) return 1;
    const size = view.getUint16(offset + 2);
    if (marker === APP1) {
      const orientation = parseExifOrientation(view, offset + 4, size - 2);
      if (orientation !== null) return orientation;
    }
    offset += 2 + size;
  }
  return 1;
}

/** Returns null when the segment is not EXIF, so the caller keeps scanning. */
function parseExifOrientation(view: DataView, start: number, length: number): number | null {
  if (start + 4 > view.byteLength || view.getUint32(start) !== EXIF_HEADER) return null;
  const end = start + length;
  if (length < 14 || end > view.byteLength) return 1;
  const tiff = start + 6;
  const littleEndian = view.getUint16(tiff) === 0x4949;
  const ifd0 = tiff + view.getUint32(tiff + 4, littleEndian);
  if (ifd0 + 2 > end) return 1;
  const count = view.getUint16(ifd0, littleEndian);
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > end) return 1;
    if (view.getUint16(entry, littleEndian) === ORIENTATION_TAG) {
      const value = view.getUint16(entry + 8, littleEndian);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}
