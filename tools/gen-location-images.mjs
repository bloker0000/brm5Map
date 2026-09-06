// packs info/images into public/locations and writes the images array of the
// locations it maps to, straight into src/data/brm5-locations.json. the source
// shots are 2560x1440 png at ~4 MB each, which is why nothing points at info/
// directly. re-run after adding shots:
//   node tools/gen-location-images.mjs
//
// every other location's images are imgur urls added by hand or through the
// admin panel. only the ids listed in SOURCES below are rewritten, and they are
// rewritten wholesale, so for those the files on disk are the source of truth.

import { readdirSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'info/images');
const OUT_DIR = resolve(root, 'public/locations');
const DATA = resolve(root, 'src/data/brm5-locations.json');

const MAGICK = 'C:/Program Files/ImageMagick-7.1.2-Q16/magick';

// the roblox topbar pills end about 53px down on a 1440p shot, so this takes them
// off with roughly as much again for headroom. the imgur shots are cropped the
// same way, which is why they come back 2517x1354 rather than 16/9
const CROP_TOP = 100;

// the modal shows the full file and the lightbox zooms it, so only the strips get
// the small one
const THUMB = { width: 640, quality: 82, suffix: '@thumb' };
const FULL = { width: 1920, quality: 90, suffix: '' };

// a key is a folder under info/images, whose shots become one gallery, or a single
// file when the location only has the one. `strip` drops the repeated prefix from
// the captions, `order` leads the gallery and the rest follow alphabetically, and
// `labels` overrides a caption whose file name reads wrong.
const SOURCES = {
  'bridge/DamagedBridge1.png': { location: 'mjrumdh97nqjpqv32an' }, // Damage Bridge1
  'bridge/DamagedBridge2.png': { location: 'mjrumoor2ejyp50h2h9' }, // Damaged Bridge2
  'ParkingLot.png': { location: 'mjrvgrtswnpdlpuclgf' }, // Parking Lot
  'PeckSlipPlaza.png': { location: 'mjrv576jhfopdf83x5i' }, // Peck Slip Plaza
  hospitalheliplatform: { location: 'mjrv19m6j8i15ykkmf' }, // Hospital Helipad
  FairfieldInn: {
    location: 'mjrvh8tdvgr30i8ck1', // Fairfield Inn & Suites
    strip: 'FairfieldInn_',
    order: [
      'FairfieldInn_Outside1',
      'FairfieldInn_Outside2',
      'FairfieldInn_FisrtFloorEntrance',
      'FairfieldInn_FirstFloorLounge',
      'FairfieldInn_FirstFloorStorageRoom',
      'FairfieldInn_SecondFloorStairs',
      'FairfieldInn_SecondFloorApartment1',
      'FairfieldInn_SecondFloorApartment2',
      'FairfieldInn_SecondFloorAparatment3',
      'FairfieldInn_ThirdFloorBurnedApartment1',
      'FairfieldInn_ThirdFloorBurnedApartment2',
      'FairfieldInn_ThirdFloorBurnedApartment_Safe',
    ],
    labels: {
      FairfieldInn_FisrtFloorEntrance: 'First Floor Entrance',
      FairfieldInn_SecondFloorAparatment3: 'Second Floor Apartment 3',
    },
  },
  flutonMarket: {
    location: 'mjrvbvm2xw7dk78r5yb', // Fluton Market
    strip: 'FlutonMarket_',
    order: [
      'FlutonMarket_Outside',
      'FlutonMarket_FirstFloor',
      'FlutonMarket_EZMart',
      'FlutonMarket_Quill1',
      'FlutonMarket_Quill2',
      'FlutonMarket_SecondFloor',
      'FlutonMarket_ThirdFloor',
      'FlutonMarket_topFloor',
      'FlutonMarket_TopFloorBalconyOutpost',
    ],
  },
};

function label(name, { strip, labels }) {
  if (labels?.[name]) return labels[name];

  const words = (strip && name.startsWith(strip) ? name.slice(strip.length) : name)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// png header: width and height are the two big endian uint32 after the IHDR tag
function dimensions(file) {
  const head = readFileSync(file).subarray(0, 33);
  return [head.readUInt32BE(16), head.readUInt32BE(20)];
}

let bytes = 0;
let sourceBytes = 0;

function convert(source, outSubdir, name) {
  const [width, height] = dimensions(source);
  if (height <= CROP_TOP) throw new Error(`${name} is shorter than the crop`);

  mkdirSync(join(OUT_DIR, outSubdir), { recursive: true });
  for (const variant of [THUMB, FULL]) {
    const out = join(OUT_DIR, outSubdir, `${name}${variant.suffix}.webp`);
    execFileSync(MAGICK, [
      source,
      '-crop', `${width}x${height - CROP_TOP}+0+${CROP_TOP}`,
      '+repage',
      '-resize', `${variant.width}x>`,
      '-quality', String(variant.quality),
      '-define', 'webp:method=6',
      '-strip',
      out,
    ]);
    bytes += statSync(out).size;
  }
  sourceBytes += statSync(source).size;

  const base = `/locations/${outSubdir ? `${outSubdir}/` : ''}${name}`;
  return { url: `${base}${FULL.suffix}.webp`, thumb: `${base}${THUMB.suffix}.webp` };
}

// a listed file leads in the order it is given, anything unlisted follows by name
function sorted(files, order = []) {
  const unknown = order.filter(n => !files.includes(n));
  if (unknown.length) throw new Error(`ordered but not on disk: ${unknown.join(', ')}`);
  const rest = files.filter(n => !order.includes(n)).sort((a, b) => a.localeCompare(b));
  return [...order, ...rest];
}

if (!existsSync(SOURCE)) throw new Error(`missing source folder: ${SOURCE}`);

// anything under info/images that no location claims is a shot that would never
// ship, so say so rather than dropping it quietly
const claimed = new Set(Object.keys(SOURCES));
const stray = readdirSync(SOURCE).flatMap(entry => {
  if (claimed.has(entry)) return [];
  if (!statSync(resolve(SOURCE, entry)).isDirectory()) return [entry];
  return readdirSync(resolve(SOURCE, entry))
    .map(file => `${entry}/${file}`)
    .filter(path => !claimed.has(path));
});
if (stray.length) throw new Error(`nothing maps info/images/${stray.join(', info/images/')}`);

rmSync(OUT_DIR, { recursive: true, force: true });

const galleries = {};
let converted = 0;

for (const [key, config] of Object.entries(SOURCES)) {
  const path = resolve(SOURCE, key);
  if (!existsSync(path)) throw new Error(`no such source: info/images/${key}`);

  if (statSync(path).isDirectory()) {
    const files = readdirSync(path).filter(f => /\.(png|jpe?g)$/i.test(f));
    if (!files.length) throw new Error(`info/images/${key} has no shots`);

    galleries[config.location] = sorted(files.map(f => parse(f).name), config.order).map(name => {
      const file = files.find(f => parse(f).name === name);
      converted++;
      return { ...convert(join(path, file), key, name), description: label(name, config) };
    });
  } else {
    // no caption on a lone shot, it would only repeat the name in the modal header
    const { name } = parse(key);
    const folder = dirname(key) === '.' ? '' : dirname(key);
    converted++;
    galleries[config.location] = [convert(path, folder, name)];
  }
}

const locations = JSON.parse(readFileSync(DATA, 'utf8'));
for (const [id, images] of Object.entries(galleries)) {
  const location = locations.find(l => l.id === id);
  if (!location) throw new Error(`no location with id ${id}`);
  location.images = images;
  delete location.image;
}
writeFileSync(DATA, JSON.stringify(locations, null, 2) + '\n');

console.log(
  `${converted} shots across ${Object.keys(galleries).length} locations -> public/locations ` +
  `(${(bytes / 1024 / 1024).toFixed(1)} MB in two sizes, from ${(sourceBytes / 1024 / 1024).toFixed(0)} MB of png), ` +
  `cropped ${CROP_TOP}px off the top`
);

const missing = locations.filter(l => !l.images?.length);
if (missing.length) {
  console.log(`\nstill no images on these ${missing.length}:`);
  for (const l of missing) console.log(`  ${l.name} (${l.category})`);
}
