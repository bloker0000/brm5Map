// converts what fetch-imgur.mjs pulled down into public/shots and points the
// locations data at it, so nothing loads from imgur any more. imgur is blocked
// in a few countries, where every one of these was an empty frame.
//   node tools/fetch-imgur.mjs && node tools/gen-imgur-images.mjs
//
// unlike gen-location-images.mjs this does not own any location's gallery. it
// only swaps the url of an image that still points at imgur, leaving the caption
// and the order alone, so the json stays the source of truth and the admin panel
// can keep editing these. re-running it is a no-op once everything is local.
//
// files are named by imgur id: it survives a caption edit, it dedupes the handful
// of shots two locations share, and it is the only trace of where a shot came from.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'info/imgur');
const OUT_DIR = resolve(root, 'public/shots');
const DATA = resolve(root, 'src/data/brm5-locations.json');

const MAGICK = 'C:/Program Files/ImageMagick-7.1.2-Q16/magick';

const THUMB = { width: 640, quality: 82, suffix: '@thumb' };
const FULL = { width: 1920, quality: 90, suffix: '' };

// the roblox topbar pills end about 53px down on a 1440p shot. most of these were
// already cropped by hand before upload, which is why so few are still 16/9, so
// the crop is decided per shot rather than applied to everything
const CROP_TOP = 100 / 1440;

// the roblox logo pill, as a fraction of the frame: a flat dark circle with a white
// glyph in it. a dark scene matches the dark, only the pill matches both
const PILL = { x0: 0.0063, x1: 0.0223, y0: 0.0083, y1: 0.0361 };

function dimensions(file) {
  const [w, h] = execFileSync(MAGICK, ['identify', '-format', '%w %h', file], { encoding: 'utf8' })
    .split(' ')
    .map(Number);
  if (!w || !h) throw new Error(`could not read the size of ${file}`);
  return [w, h];
}

function hasTopbar(file, width, height) {
  const box = [
    Math.max(4, Math.round((PILL.x1 - PILL.x0) * width)),
    Math.max(4, Math.round((PILL.y1 - PILL.y0) * height)),
    Math.round(PILL.x0 * width),
    Math.round(PILL.y0 * height),
  ];
  const out = execFileSync(MAGICK, [
    file,
    '-crop', `${box[0]}x${box[1]}+${box[2]}+${box[3]}`, '+repage',
    '-resize', '32x32!',
    '-colorspace', 'gray', '-depth', '8',
    'txt:-',
  ], { encoding: 'utf8' });

  const values = [...out.matchAll(/gray\((\d+)\)/g)].map(m => Number(m[1]) / 255);
  if (!values.length) throw new Error(`no pixels sampled from ${file}`);
  const dark = values.filter(v => v < 0.2).length / values.length;
  const glyph = values.filter(v => v > 0.8).length / values.length;
  return dark > 0.5 && glyph > 0.03;
}

let bytes = 0;
let sourceBytes = 0;
let cropped = 0;

function convert(source, id) {
  const [width, height] = dimensions(source);
  const crop = hasTopbar(source, width, height) ? Math.round(CROP_TOP * height) : 0;
  if (crop) cropped++;

  for (const variant of [THUMB, FULL]) {
    const out = join(OUT_DIR, `${id}${variant.suffix}.webp`);
    const args = [source];
    if (crop) args.push('-crop', `${width}x${height - crop}+0+${crop}`, '+repage');
    args.push(
      '-resize', `${variant.width}x>`,
      '-quality', String(variant.quality),
      '-define', 'webp:method=6',
      '-strip',
      out,
    );
    execFileSync(MAGICK, args);
    bytes += statSync(out).size;
  }
  sourceBytes += statSync(source).size;

  return { url: `/shots/${id}${FULL.suffix}.webp`, thumb: `/shots/${id}${THUMB.suffix}.webp` };
}

if (!existsSync(SOURCE)) throw new Error(`missing ${SOURCE}, run tools/fetch-imgur.mjs first`);
mkdirSync(OUT_DIR, { recursive: true });

const locations = JSON.parse(readFileSync(DATA, 'utf8'));

const done = new Map();
const missing = [];
let rewritten = 0;

for (const location of locations) {
  for (const image of location.images ?? []) {
    const match = /imgur\.com\/([A-Za-z0-9]+)\.(png|jpe?g|gif)/.exec(image.url ?? '');
    if (!match) continue;
    const [, id, ext] = match;

    if (!done.has(id)) {
      const source = join(SOURCE, `${id}.${ext}`);
      if (!existsSync(source)) {
        missing.push({ id, url: image.url, location: location.name });
        continue;
      }
      done.set(id, convert(source, id));
    }

    // the caption and the position in the gallery are the json's, not ours
    Object.assign(image, done.get(id));
    rewritten++;
  }
}

// a shot nobody could fetch has to stay on imgur rather than become a dead local
// path, so stop before writing anything if any are still outstanding
if (missing.length) {
  console.error(`${missing.length} shots are not in info/imgur, re-run tools/fetch-imgur.mjs:`);
  for (const m of missing) console.error(`  ${m.url}  [${m.location}]`);
  process.exit(1);
}

writeFileSync(DATA, JSON.stringify(locations, null, 2) + '\n');

console.log(
  `${done.size} shots -> public/shots (${(bytes / 1024 / 1024).toFixed(1)} MB in two sizes, ` +
  `from ${(sourceBytes / 1024 / 1024).toFixed(0)} MB), ${cropped} had a topbar to crop`
);
console.log(`${rewritten} urls rewritten across ${locations.filter(l => (l.images ?? []).some(i => i.url.startsWith('/shots/'))).length} locations`);

const stillRemote = locations.flatMap(l => l.images ?? []).filter(i => !i.url.startsWith('/'));
console.log(stillRemote.length ? `\n${stillRemote.length} urls still point off site` : '\nno location image loads from imgur any more');
