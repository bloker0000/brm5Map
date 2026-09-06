// works out where a mission happens on the map, which the game data does not say.
// mission task positions are game world studs, location pins are SVG units, and the
// two are related by a plain rotate-and-scale, so a handful of objectives that the
// briefings pin to a named place is enough to solve for it:
//   node tools/find-mission-transform.mjs           the fit, then every mission
//   node tools/find-mission-transform.mjs Kismet2   one mission
//
// nothing at runtime uses this. it is how src/data/location-missions.ts was written,
// and how to extend that table after a re-dump.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const locations = JSON.parse(readFileSync(resolve(root, 'src/data/brm5-locations.json'), 'utf8'));
const missions = JSON.parse(readFileSync(resolve(root, 'src/data/brm5-missions.json'), 'utf8'));

// [world x, world z] of an objective whose briefing or step text names the place it
// is at, paired with the location marking that place. world y is the height, which
// the map has no axis for. every one of these is quoted from the mission itself.
const ANCHORS = [
  [[-72, -39],   'Ground Zero 2 (Site A)',         'GroundZero1 "Photograph the M.Q.I.U from all sides"'],
  [[-303, -44],  'Ground Zero 2 Garage',           'ShadyBiz1 "Find the parking garage ... in New Ground Zero"'],
  [[-239, 377],  'Dorsia',                         'Dorsia1 "Locate the restaurant at 64 S William St"'],
  [[-41, 717],   'Liberty Bank',                   'ShadyBiz1 "Head to the Liberty Bank branch on Stone x Pearl"'],
  [[654, 657],   'Fallen Construction Crane',      'Journalist1 "Photograph the downed crane construction site"'],
  [[785, -603],  'Fulton x William Building',      'DeepEnd3 "Locate the building on William and Fulton"'],
  [[802, 1330],  'Water Treatment Plant (Site C)', 'DeepEnd2 "Locate the water treatment plant"'],
  [[1100, -450], 'Metro New York Hospital',        'Kismet3 "the phone is ... near the entrance to the Metro Hospital"'],
  [[1175, 667],  'Fluton Market',                  'WeissGift2 "Find EZ-Mart"'],
  [[1471, -355], 'Fresh Stop Supermarket',         'WeissGift2 "Find the supermarket near the hospital"'],
  [[1645, 198],  'Euro Deli',                      'WeissGift2 "Find the Euro Deli"'],
  [[1859, -88],  'Substation',                     'Repair1 "Reach the transmission substation near the Brooklyn Bridge"'],
];

// solved as one complex multiply, q = a*p + b, which is exactly a rotation and a
// uniform scale. least squares over every anchor rather than two of them, so one
// pin sitting a little off its building does not tilt the whole thing
function solve(pairs) {
  const n = pairs.length;
  const mean = i => pairs.reduce((s, p) => s + p[i][0], 0) / n;
  const meanY = i => pairs.reduce((s, p) => s + p[i][1], 0) / n;
  const cp = [mean(0), meanY(0)];
  const cq = [mean(1), meanY(1)];
  let re = 0, im = 0, den = 0;
  for (const [p, q] of pairs) {
    const px = p[0] - cp[0], py = p[1] - cp[1];
    const qx = q[0] - cq[0], qy = q[1] - cq[1];
    re += qx * px + qy * py;
    im += qy * px - qx * py;
    den += px * px + py * py;
  }
  const a = [re / den, im / den];
  const b = [cq[0] - (a[0] * cp[0] - a[1] * cp[1]), cq[1] - (a[0] * cp[1] + a[1] * cp[0])];
  return {
    scale: Math.hypot(a[0], a[1]),
    degrees: Math.atan2(a[1], a[0]) * 180 / Math.PI,
    // a task position is [x, y, z]; y is height, the map is flat
    project: ([x, , z]) => [a[0] * x - a[1] * z + b[0], a[0] * z + a[1] * x + b[1]],
  };
}

const byName = name => {
  const found = locations.filter(l => l.name === name);
  if (found.length !== 1) throw new Error(`${found.length} locations named ${name}`);
  return [found[0].x, found[0].y];
};
const fit = solve(ANCHORS.map(([world, name]) => [world, byName(name)]));

const nearest = ([x, y], count) => locations
  .map(l => ({ name: l.name, away: Math.hypot(l.x - x, l.y - y) }))
  .sort((p, q) => p.away - q.away)
  .slice(0, count);

// the map's own scale legend reads 100 studs = 91.9 px, and the app's default map
// rotation is 40 degrees, which is what makes north point up. both fall out of the
// fit on their own, which is the real check that it is right
console.log(
  `${fit.scale.toFixed(4)} px per stud (legend says 0.919), ` +
  `rotated ${fit.degrees.toFixed(2)} degrees (the app's default rotation is 40)`
);
console.log('\nhow far each anchor lands from its pin:');
for (const [world, name, source] of ANCHORS) {
  const away = Math.hypot(...fit.project([world[0], 0, world[1]]).map((v, i) => v - byName(name)[i]));
  console.log(`  ${away.toFixed(0).padStart(4)}px  ${name.padEnd(32)} ${source}`);
}

const only = process.argv[2];
console.log('\nwhere every objective lands:');
for (const mission of missions) {
  if (only && mission.id !== only) continue;
  const rows = [];
  for (const [vi, variant] of (mission.variants ?? []).entries()) {
    for (const step of variant) {
      for (const task of step.tasks) {
        // 1,1,1 is the placeholder an unreleased mission carries
        if (!task.pos || task.pos.every(v => v === 1)) continue;
        const at = fit.project(task.pos);
        const label = `${task.type}${task.tagline ? ` "${task.tagline}"` : ''}` +
          (mission.variants.length > 1 ? ` v${vi + 1}` : '');
        rows.push(`   ${label.padEnd(38)} -> ` +
          nearest(at, 3).map(h => `${h.name} (${h.away.toFixed(0)})`).join('  |  '));
      }
    }
  }
  if (!rows.length) continue;
  console.log(`\n=== ${mission.id} :: ${mission.name}`);
  console.log([...new Set(rows)].join('\n'));
}
