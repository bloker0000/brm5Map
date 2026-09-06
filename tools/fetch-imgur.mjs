// pulls every imgur url in the locations data down to info/imgur so they can be
// re-hosted from public/. imgur is blocked outright in a few countries, so those
// visitors currently see nothing at all. run this first, then gen-imgur-images:
//   node tools/fetch-imgur.mjs
//
// already downloaded files are skipped, so a re-run only picks up what is new or
// what failed last time.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'info/imgur');
const DATA = resolve(root, 'src/data/brm5-locations.json');

const CONCURRENCY = 6;
const RETRIES = 3;

// imgur serves a placeholder rather than a 404 when an upload is gone
const REMOVED_BYTES = 503;

const locations = JSON.parse(readFileSync(DATA, 'utf8'));

const urls = new Map();
for (const location of locations) {
  for (const image of location.images ?? []) {
    const match = /imgur\.com\/([A-Za-z0-9]+)\.(png|jpe?g|gif)/.exec(image.url ?? '');
    if (!match) continue;
    const [, id, ext] = match;
    if (!urls.has(id)) urls.set(id, { id, ext, url: image.url, users: [] });
    urls.get(id).users.push(location.name);
  }
}

mkdirSync(OUT, { recursive: true });

const failed = [];
let fetched = 0;
let skipped = 0;
let bytes = 0;

async function download(entry) {
  const file = join(OUT, `${entry.id}.${entry.ext}`);
  if (existsSync(file) && statSync(file).size > REMOVED_BYTES) {
    skipped++;
    bytes += statSync(file).size;
    return;
  }

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(entry.url, {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        redirect: 'follow',
      });
      if (!response.ok) throw new Error(`http ${response.status}`);
      if (/removed\.(png|gif)/.test(response.url)) throw new Error('removed from imgur');

      const body = Buffer.from(await response.arrayBuffer());
      if (body.length <= REMOVED_BYTES) throw new Error(`placeholder, ${body.length} bytes`);

      writeFileSync(file, body);
      fetched++;
      bytes += body.length;
      return;
    } catch (error) {
      if (attempt === RETRIES) {
        failed.push({ ...entry, reason: error.message });
        return;
      }
      await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
}

const queue = [...urls.values()];
const progress = setInterval(() => {
  process.stdout.write(`\r${fetched + skipped + failed.length}/${queue.length}`);
}, 500);

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    let next;
    while ((next = queue.pop())) await download(next);
  })
);

clearInterval(progress);
process.stdout.write('\r');

console.log(
  `${fetched} downloaded, ${skipped} already on disk, ${failed.length} failed ` +
  `-> info/imgur (${(bytes / 1024 / 1024).toFixed(0)} MB)`
);

if (failed.length) {
  console.log(`\nthese ${failed.length} could not be fetched:`);
  for (const f of failed) console.log(`  ${f.url}  ${f.reason}  [${[...new Set(f.users)].join(', ')}]`);
  writeFileSync(join(OUT, 'failed.json'), JSON.stringify(failed, null, 2) + '\n');
}
