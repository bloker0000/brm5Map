// packs info/missions/<folder>/*.png into public/missions and writes the index
// src/data/mission-spots.ts. the source shots are 2560x1440 png at ~4 MB each,
// which is why nothing points at info/ directly. re-run after adding shots:
//   node tools/gen-mission-images.mjs
//
// a hidden objective with no shot here is one that is obvious enough in game to
// not be worth documenting, and the site drops it rather than listing a position.

import { readdirSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'info/missions');
const OUT_DIR = resolve(root, 'public/missions');
const INDEX = resolve(root, 'src/data/mission-spots.ts');

const MAGICK = 'C:/Program Files/ImageMagick-7.1.2-Q16/magick';

// the roblox topbar pills end about 53px down on a 1440p shot, so this takes them
// off with roughly as much again for headroom
const CROP_TOP = 100;

// two sizes: the grid only ever shows a small card, the lightbox goes full screen
// and zooms, and the lightbox thumbnail strip reuses the grid file from cache
const THUMB = { width: 640, quality: 82, suffix: '' };
const FULL = { width: 1920, quality: 90, suffix: '@full' };

// folder names are informal, so the mission each one belongs to is spelled out.
// `rename` relabels a filename prefix when the file name reads worse than the
// mission's own wording for the same objective.
const FOLDERS = {
  ABiggerKindness: { mission: 'WeissGift2' },
  ASmallKindness: { mission: 'WeissGift1' },
  AssetReApropriation: { mission: 'ShadyBiz1', rename: { card: 'Keycard', goldbar: 'Silver bars' } },
  ConnectingTheDots: { mission: 'Journalist4' },
  Defectors: { mission: 'Defector2' },
  EyeForAnEye: { mission: 'Eye1' },
  EyesEverywhere: { mission: 'Kismet2' },
  ResearchFellow: { mission: 'ResearchFellow2' },
  TheDeepEnd: { mission: 'DeepEnd1' },
  TrailToACure: { mission: 'ResearchFellow4' },
  UnkownCaller: { mission: 'FixerIntro' },
  UpForSomeGaming: { mission: 'Gaming1' },
  needleinahaystack: { mission: 'Kismet3' },
  researchFellowpt3: { mission: 'ResearchFellow3', rename: { SafeKey: 'Safe key' } },
};

function label(name, rename) {
  // a bare number is the variant number, those missions roll one spot per run
  if (/^\d+$/.test(name)) return `Variant ${Number(name)}`;

  for (const [prefix, replacement] of Object.entries(rename ?? {})) {
    if (name.startsWith(prefix)) {
      const rest = name.slice(prefix.length).replace(/[_-]/g, ' ').trim();
      return rest ? `${replacement} ${rest}` : replacement;
    }
  }

  const words = name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// numeric names sort 1,2,10 rather than 1,10,2
function order(a, b) {
  const na = Number(parse(a).name);
  const nb = Number(parse(b).name);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return parse(a).name.localeCompare(parse(b).name);
}

// png header: width and height are the two big endian uint32 after the IHDR tag
function dimensions(file) {
  const head = readFileSync(file).subarray(0, 33);
  return [head.readUInt32BE(16), head.readUInt32BE(20)];
}

if (!existsSync(SOURCE)) throw new Error(`missing source folder: ${SOURCE}`);
rmSync(OUT_DIR, { recursive: true, force: true });

const spots = {};
const sizes = new Set();
let converted = 0;
let bytes = 0;
let sourceBytes = 0;

for (const folder of readdirSync(SOURCE)) {
  const config = FOLDERS[folder];
  if (!config) throw new Error(`no mission mapped for info/missions/${folder}`);

  const files = readdirSync(join(SOURCE, folder))
    .filter(f => /\.(png|jpe?g)$/i.test(f))
    .sort(order);
  if (!files.length) continue;

  mkdirSync(join(OUT_DIR, config.mission), { recursive: true });

  spots[config.mission] = files.map(file => {
    const { name } = parse(file);
    const source = join(SOURCE, folder, file);
    const [width, height] = dimensions(source);
    if (height <= CROP_TOP) throw new Error(`${file} is shorter than the crop`);
    sizes.add(`${width}x${height}`);

    for (const variant of [THUMB, FULL]) {
      const out = join(OUT_DIR, config.mission, `${name}${variant.suffix}.webp`);
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

    converted++;
    sourceBytes += statSync(source).size;
    const base = `/missions/${config.mission}/${name}`;
    return { src: `${base}.webp`, full: `${base}@full.webp`, label: label(name, config.rename) };
  });
}

if (sizes.size !== 1) throw new Error(`source shots are not all one size: ${[...sizes]}`);
const [srcW, srcH] = [...sizes][0].split('x').map(Number);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const cropped = srcH - CROP_TOP;
const divisor = gcd(srcW, cropped);

const body = `// generated by tools/gen-mission-images.mjs, do not edit by hand
// the shot showing where each unmarked objective actually is, keyed by mission id

export interface MissionSpot {
  /** small file for the grid card, reused by the lightbox thumbnail strip */
  src: string;
  /** full size for the lightbox viewer */
  full: string;
  label: string;
}

/** shape of the shots once the roblox topbar is cropped off, for the card slot */
export const SPOT_ASPECT = '${srcW / divisor} / ${cropped / divisor}';

export const MISSION_SPOTS: Record<string, MissionSpot[]> = ${JSON.stringify(spots, null, 2)};

export function spotsFor(missionId: string): MissionSpot[] {
  return MISSION_SPOTS[missionId] ?? [];
}
`;
writeFileSync(INDEX, body);

const missions = Object.keys(spots).length;
console.log(
  `${converted} shots across ${missions} missions -> public/missions ` +
  `(${(bytes / 1024 / 1024).toFixed(1)} MB in two sizes, from ${(sourceBytes / 1024 / 1024).toFixed(0)} MB of png), ` +
  `cropped ${CROP_TOP}px off the top, aspect ${srcW / divisor}/${cropped / divisor}`
);

// a mission with unmarked objectives but no shots is deliberate, those spots are
// obvious enough in game not to be worth documenting. printed so the gap is a
// choice you can see rather than something that quietly rots.
const undocumented = JSON.parse(
  readFileSync(resolve(root, 'src/data/brm5-missions.json'), 'utf8')
).filter(m => m.hidden.length > 0 && !spots[m.id]);

if (undocumented.length) {
  console.log(`\nno shots, so the site lists nothing for these ${undocumented.length}:`);
  for (const m of undocumented) console.log(`  ${m.name} (${m.hidden.length} unmarked)`);
}
