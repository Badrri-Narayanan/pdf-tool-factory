import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const failures = [];

const html = await readFile(join(DIST, 'index.html'), 'utf8');
if (!html.includes('http-equiv="Content-Security-Policy"')) {
  failures.push('dist/index.html is missing the Content-Security-Policy meta tag');
}
for (const match of html.matchAll(/\s(?:src|href)="((?:https?:)?\/\/[^"]+)"/g)) {
  failures.push(`dist/index.html loads an external resource: ${match[1]}`);
}

const NETWORK_CALL = /(?:fetch|importScripts|sendBeacon|new\s+WebSocket|new\s+EventSource)\(\s*["'`](?:https?:|wss?:)?\/\//g;
for (const file of await listFiles(DIST)) {
  if (!/\.m?js$/.test(file)) continue;
  const code = await readFile(file, 'utf8');
  for (const match of code.matchAll(NETWORK_CALL)) failures.push(`${file}: network call to a literal URL: ${match[0]}`);
}

if (failures.length) {
  console.error(`Privacy check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Privacy check passed.');

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)])),
  );
  return nested.flat();
}
