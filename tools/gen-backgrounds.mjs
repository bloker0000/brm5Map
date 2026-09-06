// packs info/BG into public/BG as webp and rewrites the BG_IMAGES array in
// src/data/backgrounds.ts. the artwork arrives as png up to 7015x3543 and 10 MB,
// and two of them load on every single visit, which was more traffic than all 309
// location shots put together. re-run after adding artwork:
//   node tools/gen-backgrounds.mjs
//
// BG_CREDITS is indexed in lockstep with BG_IMAGES, so the order here is taken
// from the existing array rather than from readdir, and adding artwork means
// adding to both arrays by hand first.

import { readdirSync, mkdirSync, writeFileSync, readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'info/BG');
const OUT_DIR = resolve(root, 'public/BG');
const LIST = resolve(root, 'src/data/backgrounds.ts');

const MAGICK = 'C:/Program Files/ImageMagick-7.1.2-Q16/magick';

// the map and the preloader show these sharp under a dark overlay, the mission
// library blurs them by 40px. 2560 is the widest any of the three can use
const MAX_WIDTH = 2560;
const QUALITY = 82;

if (!existsSync(SOURCE)) throw new Error(`missing source folder: ${SOURCE}`);

const source = readFileSync(LIST, 'utf8');

const block = /export const BG_IMAGES = \[\n([\s\S]*?)\n\];/.exec(source);
if (!block) throw new Error('could not find the BG_IMAGES array in backgrounds.ts');

const names = [...block[1].matchAll(/'\/BG\/([^']+)'/g)].map(m => parse(m[1]).name);
if (!names.length) throw new Error('BG_IMAGES is empty');

const credits = /export const BG_CREDITS: BgCredit\[\] = \[\n([\s\S]*?)\n\];/.exec(source);
if (!credits) throw new Error('could not find the BG_CREDITS array in backgrounds.ts');
const creditCount = [...credits[1].matchAll(/\{\s*name:/g)].length;
if (creditCount !== names.length) {
  throw new Error(`${names.length} images but ${creditCount} credits, they are indexed in lockstep`);
}

const onDisk = readdirSync(SOURCE).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
const stray = onDisk.filter(f => !names.includes(parse(f).name));
if (stray.length) throw new Error(`nothing in BG_IMAGES points at info/BG/${stray.join(', info/BG/')}`);

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

let bytes = 0;
let sourceBytes = 0;
let shrunk = 0;

for (const name of names) {
  const file = onDisk.find(f => parse(f).name === name);
  if (!file) throw new Error(`BG_IMAGES wants ${name} but info/BG has no such file`);

  const from = join(SOURCE, file);
  const out = join(OUT_DIR, `${name}.webp`);
  const [width] = execFileSync(MAGICK, ['identify', '-format', '%w %h', from], { encoding: 'utf8' })
    .split(' ')
    .map(Number);
  if (width > MAX_WIDTH) shrunk++;

  execFileSync(MAGICK, [
    from,
    '-resize', `${MAX_WIDTH}x>`,
    '-quality', String(QUALITY),
    '-define', 'webp:method=6',
    '-strip',
    out,
  ]);
  bytes += statSync(out).size;
  sourceBytes += statSync(from).size;
}

const rewritten = source.replace(
  block[0],
  `export const BG_IMAGES = [\n${names.map(n => `  '/BG/${n}.webp',`).join('\n')}\n];`
);
writeFileSync(LIST, rewritten);

console.log(
  `${names.length} backgrounds -> public/BG ` +
  `(${(bytes / 1024 / 1024).toFixed(1)} MB, from ${(sourceBytes / 1024 / 1024).toFixed(0)} MB), ` +
  `${shrunk} were wider than ${MAX_WIDTH}px`
);
