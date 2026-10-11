# PDF Tool Factory

A private, client-side PDF and image toolkit that runs entirely in the browser and installs as an offline PWA.

- **Images to PDF** - combine JPEG, PNG, WebP, GIF, BMP and HEIC/HEIF photos into one PDF (page size, orientation, margins, quality).
- **Merge PDFs** - join several PDFs in the order you choose.
- **Compress PDF** - Light, Medium or Maximum (Ghostscript, downloaded on demand) compression.

## Privacy model

Files are processed on your device. Nothing is uploaded.

- No network requests after load other than the app's own same-origin assets: no CDNs, web fonts or analytics.
- A strict Content-Security-Policy is applied as a meta tag in the built `index.html`, as a header from `vite preview`, and via `public/_headers` for static hosts.
- Files stay in memory; they are never written to localStorage, IndexedDB or Cache Storage.
- The Playwright e2e suite fails if any non-same-origin request is made or the CSP is violated, and `npm run check:privacy` scans the build output for external URLs.

## Requirements

Node >= 22.13 (required by pdfjs-dist 6).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the build (with the CSP header) |
| `npm test` | Unit tests (Vitest browser mode, Chromium) |
| `npm run test:e2e` | Playwright end-to-end tests (builds and previews on :4173) |
| `npm run check:privacy` | Scan the build for external URLs |
| `npm run verify` | Lint, unit tests, build, privacy check and e2e |

`public/vendor/ghostscript/` is generated from `node_modules` by the `pre*` scripts (`predev`, `prebuild`, `pretest`) and is not committed.

## Deployment

Build with `npm run build` and serve `dist/` from any static host. Use a host that honours `public/_headers` (Cloudflare Pages, Netlify) so Web Workers also receive the CSP. Hosts without custom headers, such as GitHub Pages, only get the meta-tag CSP, which does not cover workers. HTTPS is required for install, offline use and sharing.

This repo deploys to GitHub Pages through `.github/workflows/deploy.yml` on every push to `main` (Settings → Pages → Source: GitHub Actions). The workflow builds, runs the privacy check, and publishes `dist/`. The app uses relative paths and a hash router, so it works under the `/pdf-tool-factory/` sub-path.

## Third-party licences

- Ghostscript (wasm, `@jspawn/ghostscript-wasm`): AGPL-3.0. Fine for personal self-hosting; revisit before distributing.
- libheif-js: LGPL-3.0
- pdf-lib: MIT
- pdf.js (pdfjs-dist): Apache-2.0
