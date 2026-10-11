import { cp, mkdir } from 'node:fs/promises';

const from = 'node_modules/@jspawn/ghostscript-wasm';
const to = 'public/vendor/ghostscript';

await mkdir(to, { recursive: true });
for (const file of ['gs.mjs', 'gs.js', 'browser.js', 'gs.wasm', 'LICENSE']) {
  await cp(`${from}/${file}`, `${to}/${file}`);
}
