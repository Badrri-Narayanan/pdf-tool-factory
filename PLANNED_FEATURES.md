# Planned Features

What v1 doesn't do yet. Every item must keep the core promise: files are processed on the device and never uploaded.

Items are grouped by priority: **Next** is the most useful for the effort, **Later** is worth doing, and **Someday** is a nice-to-have.

## New tools

### Next

- **Page tools for PDFs:** split a PDF, extract pages, delete pages, rotate single pages, and reorder pages from a thumbnail grid. This grid is the base for several later tools.
  - Start from `pdf-lib` (`copyPages`, `removePage`, `setRotation`) and the existing pdf.js thumbnail code in `src/lib/inspect.ts`.
- **Image tools:** compress, resize and convert images (JPEG, PNG, WebP, HEIC → JPG).
  - Reuses `src/core/image/*` (decode, render, encode).
  - HEIC → JPG matters most for iPhone users.
- **Remove photo location data:** strip EXIF metadata, including GPS location, from photos before sharing them.
- **"Make it under X MB":** compress again and again until a file fits a size limit, such as an upload form's 2 MB cap.
- **Download many files as a ZIP:** for batch results, using a small client-side ZIP library.

### Later

- **Camera scan to PDF:** take a photo of a document on the phone. The app finds the edges, straightens the page, and switches to black-and-white for a clean "scanned" look.
- **Chain tools:** for example images → PDF → compress → download, in one go.
- **PDF → images:** export pages as PNG or JPEG using pdf.js.
- **Sign a PDF:** draw or type a signature and place it on a page.
- **Watermark, page numbers, headers and footers.**
- **Password-protect or unlock a PDF:** qpdf compiled to WebAssembly.
- **Fill in PDF forms:** pdf-lib supports AcroForm fields.
- **Android share target:** "Share → PDF Tool Factory" from the gallery, through the web app manifest's `share_target`.

### Someday

- **OCR:** make scanned PDFs searchable with tesseract.js. It's a large download, so load it only when used.
- **Redaction:** truly remove text and images, not just cover them with black boxes.
- **Edit metadata:** title, author and subject.
- **Compare two PDFs.**
- **Multiple pages per sheet, or booklet printing.**
- **Crop and flatten pages.**
- **Passport / ID photo maker:** several photos on one printable sheet.
- **Receipt bundler:** a month of receipt photos into one PDF for expense claims.

## Improvements to existing tools

These came up during code review and were deliberately left out of v1.

- **Keep error marks on files:** a file's red error mark currently disappears when you edit the list, and comes back only on the next run.
  - Fix: store per-file errors in `useFileList` state instead of deriving them from the last job (`applyJobError` in `src/lib/fileList.ts`).
- **Download the Maximum engine only once:** on the very first visit the 16 MB Ghostscript engine can download twice. Progress also jumps ahead when the server compresses the download.
  - Fix: load the wasm through Emscripten's `instantiateWasm` hook with a single streamed fetch, and consider `clientsClaim` in the service worker.
- **Lighter on phones when many files are added:** every PDF is read and parsed at the same time, and photo previews are full resolution.
  - Fix: check files one at a time, and use small downscaled thumbnails.
- **Lossless rotation:** rotating a photo at Original quality redraws it on a canvas. Very large photos (over about 16.7 MP) can come out blank on iPhones.
  - Fix: rotate the PDF page instead of the image, which is lossless and avoids the canvas.
- **Clearer error when Maximum runs out of memory:** this currently says the file is damaged. It should say the device ran out of memory.
- **Compress more image types:** Light and Medium skip black-and-white scan formats (JBIG2, CCITT) and some compressed image layouts. They also drop colour profiles when re-encoding.
- **Dropped files:** files dropped onto the page skip the file picker's type filter. They're caught later, but could be filtered right away.

## Quality and tech debt

- Type-check `vitest.config.ts`, `playwright.config.ts` and `e2e/**` by adding them to a tsconfig.
- Catch security-policy violations inside Web Workers in the e2e privacy guard, not just on the page.
- Make the e2e security-policy test compare the whole policy, not one directive.
- Strengthen `scripts/check-privacy.mjs`. It misses `XMLHttpRequest`, `new Request(...)` and URLs built from variables. The Content-Security-Policy remains the real guarantee.
- Add tests for:
  - big-endian EXIF data
  - grayscale and colour-profile images in compression
  - error paths in the image and compress workers
  - the "file removed while still being checked" case in `useFileList`
  - rotation direction, not just dimensions
- UI polish:
  - add iPhone safe-area padding and a stacking order to the mobile action bar
  - keep the progress bar's value between 0 and 100%
  - make labels unique when two files have the same name
  - use consistent keyboard focus styles
  - fix the drag overlay flicker in Safari
- CI:
  - avoid running twice on PR branches (push + pull_request)
  - avoid building twice in `npm run verify`

## Deployment

- **Full security policy for workers:** GitHub Pages can't send custom headers, so the policy is applied by a meta tag, which doesn't cover Web Workers. Moving to Cloudflare Pages or Netlify would serve `public/_headers` and close that gap.

## Still to check by hand

- Convert a real iPhone HEIC photo in Chrome or Firefox.
- Run Maximum compression on a phone.
- Install the app on iPhone and Android, use it offline, and try the Share button.
