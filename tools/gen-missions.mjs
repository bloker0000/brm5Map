// turns the MISSIONS.md dump into src/data/brm5-missions.json
// MISSIONS.md is gitignored, the json it produces is not. re-run after a re-dump:
//   node tools/gen-missions.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'MISSIONS.md');
const OUT = resolve(root, 'src/data/brm5-missions.json');

// places that are not the zombies mode
const EXCLUDED_PLACES = /^(OW_|DEV_)/;

const lines = readFileSync(SOURCE, 'utf8').split(/\r?\n/);

function sectionRange(heading) {
  const start = lines.findIndex(l => l === heading);
  if (start === -1) throw new Error(`missing section: ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break; }
  }
  return [start, end];
}

function cells(row) {
  return row.slice(1, -1).split('|').map(c => c.trim());
}

function stripCode(s) {
  return s.replace(/`/g, '').trim();
}

function num(s) {
  const n = Number(stripCode(s));
  return Number.isFinite(n) ? n : null;
}

// the giver and place columns of the index resolve per mission, unlike the
// "### Giver" headings which fall back to the module folder name
function parseIndex() {
  const [start, end] = sectionRange('## Index');
  const index = new Map();
  for (let i = start; i < end; i++) {
    const row = lines[i];
    if (!row.startsWith('| `')) continue;
    const c = cells(row);
    const places = stripCode(c[3]);
    index.set(stripCode(c[0]), {
      name: c[1].trim(),
      giver: c[2].trim(),
      places: places === '?' ? [] : places.split(',').map(p => p.trim()),
    });
  }
  return index;
}

const KEYED_ARG = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*)$/;
const VEC = /^(?:CFrame|Vector3)\(\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\)/;

function parseTask(text) {
  const parts = text.split(/\s{2,}/).filter(Boolean);
  const type = parts.shift();
  const args = {};
  for (const part of parts) {
    const m = part.match(KEYED_ARG);
    if (!m) throw new Error(`unparsed task arg "${part}" in: ${text}`);
    // the rotation matrix that trails a CFrame is noise for a reader
    const value = m[2].replace(/\s*full=\[[^\]]*\]\s*$/, '').trim();
    args[m[1]] = /^"[^"]*"$/.test(value) ? value.slice(1, -1) : value;
  }

  const task = { type };

  for (const key of ['CFrame', 'Position', 'Point']) {
    const hit = args[key] && args[key].match(VEC);
    if (hit) {
      task.pos = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
      delete args[key];
      break;
    }
  }

  if (args.Tagline) {
    task.tagline = args.Tagline;
    delete args.Tagline;
  }
  if (args.Item) {
    task.item = args.Item;
    delete args.Item;
  }

  // Marker = false and NoMarker = true are the game withholding the waypoint
  const noMarker = args.NoMarker === 'true';
  if (args.Marker === 'false' || noMarker) task.hidden = true;
  delete args.Marker;
  delete args.NoMarker;

  // the preload lists are hundreds of asset paths and say nothing to a player
  if (args.Assets) args.Assets = `${(args.Assets.match(/\[\[|\], \[/g) || []).length} assets`;

  if (Object.keys(args).length) task.args = args;
  return task;
}

function parseSteps(body) {
  const steps = [];
  for (const line of body) {
    const step = line.match(/^(\d+)\. (.*)$/);
    if (step) {
      steps.push(
        step[2] === '*(identical to variant 1)*'
          ? { same: true }
          : { desc: step[2], tasks: [] }
      );
      continue;
    }
    const task = line.match(/^ {4}- (.*)$/);
    if (task) {
      const current = steps[steps.length - 1];
      if (!current || current.same) throw new Error(`orphan task: ${line}`);
      current.tasks.push(parseTask(task[1]));
    }
  }
  return steps;
}

function parseRewards(text) {
  const rewards = {};
  for (const chunk of text.split(' | ')) {
    const m = chunk.match(KEYED_ARG);
    if (!m) continue;
    const [, key, value] = m;
    const pair = value.match(/^\[(-?\d+), (-?\d+)\]$/);
    if (pair) {
      const nums = [Number(pair[1]), Number(pair[2])];
      if (nums[0] || nums[1]) rewards[key] = nums;
    } else if (key === 'Items') {
      // [["Aviators", false, ["Character", "Eyewear", ...]]] -- only the display name
      const names = [...value.matchAll(/\["([^"]+)", (?:true|false)/g)].map(hit => hit[1].trim());
      if (names.length) rewards.Items = names;
    } else {
      rewards[key] = value;
    }
  }
  return rewards;
}

function parseMissions(index) {
  const [start, end] = sectionRange('## Missions');
  const missions = [];
  let mission = null;
  let bucket = null;
  let section = '?';

  const flush = () => {
    if (!mission) return;
    if (bucket) mission.variants.push(parseSteps(bucket));
    bucket = null;
    missions.push(mission);
    mission = null;
  };

  for (let i = start + 1; i < end; i++) {
    const line = lines[i];

    const giverHeading = line.match(/^### (.+)$/);
    if (giverHeading) {
      flush();
      section = giverHeading[1].trim();
      continue;
    }

    const header = line.match(/^#### `([^`]+)` -- (.*)$/);
    if (header) {
      flush();
      const meta = index.get(header[1]) || { giver: '?', places: [] };
      mission = {
        id: header[1],
        section,
        name: header[2].trim(),
        giver: meta.giver,
        places: meta.places,
        level: 0,
        difficulty: null,
        extraction: false,
        gasmask: false,
        exclusive: false,
        raid: false,
        prerequisites: [],
        rewards: {},
        variants: [],
      };
      continue;
    }
    if (!mission) continue;

    if (line.startsWith('- Level ')) {
      for (const part of line.slice(2).split(' | ')) {
        if (/^Level /.test(part)) mission.level = num(part.slice(6)) ?? 0;
        else if (/^Difficulty /.test(part)) mission.difficulty = num(part.slice(11));
        else if (/^Extraction: /.test(part)) mission.extraction = part.endsWith('true');
        else if (part === '**Gasmask required**') mission.gasmask = true;
        else if (part === 'Exclusive') mission.exclusive = true;
        else if (/^LobbyBox /.test(part)) mission.raid = true;
      }
      continue;
    }

    if (line.startsWith('- Rewards: ')) {
      mission.rewards = parseRewards(line.slice(11));
      continue;
    }

    if (line.startsWith('- Prerequisites: ')) {
      const value = line.slice(17);
      if (value !== 'none') {
        mission.prerequisites = value.split(', ').map(stripCode);
      }
      continue;
    }

    if (line.startsWith('- Vouchers: ')) {
      mission.rewards.Vouchers = [...line.matchAll(/\["[^"]*", "([^"]+)", (\d+)\]/g)]
        .map(hit => `${hit[2]}x ${hit[1]}`);
      continue;
    }

    const brief = line.match(/^> \*\*(Briefing|Debriefing)\.\*\* (.*)$/);
    if (brief) {
      mission[brief[1].toLowerCase()] = brief[2].trim();
      continue;
    }

    if (line.startsWith('**Objectives**') || /^\*\*Variant \d+ of \d+\*\*$/.test(line)) {
      if (bucket) mission.variants.push(parseSteps(bucket));
      bucket = [];
      continue;
    }

    if (bucket) bucket.push(line);
  }

  flush();
  return missions;
}

// a variant only prints the steps that differ from the first one
function resolveVariants(mission) {
  const [first] = mission.variants;
  if (!first) return;
  for (const variant of mission.variants) {
    variant.forEach((step, i) => {
      if (step.same) variant[i] = first[i];
    });
  }
}

// a mission the dump could not resolve gets the module folder name as its giver
// and no place. its siblings under the same folder know both, so borrow from them.
function fillFromSiblings(all) {
  const bySection = new Map();
  for (const m of all) {
    if (!bySection.has(m.section)) bySection.set(m.section, []);
    bySection.get(m.section).push(m);
  }
  for (const [section, group] of bySection) {
    const giver = group.map(m => m.giver).find(g => g.includes(';'));
    const places = group.map(m => m.places).find(p => p.length);
    for (const m of group) {
      if (m.giver === section && giver) m.giver = giver;
      if (!m.places.length && places) m.places = places;
      delete m.section;
    }
  }
}

const index = parseIndex();
const all = parseMissions(index);
fillFromSiblings(all);

const missions = all
  .filter(m => !m.places.some(p => EXCLUDED_PLACES.test(p)))
  .map(m => {
    resolveVariants(m);
    delete m.places;

    const [giver, faction] = m.giver.split(';').map(s => s.trim());
    // raids have no npc giver, the dump labels them with the module folder "Server"
    m.giver = m.raid ? 'Raids' : giver;
    if (faction && faction !== 'UNKNOWN') m.faction = faction;

    const positions = new Set();
    const hidden = [];
    for (const [vi, variant] of m.variants.entries()) {
      for (const [si, step] of variant.entries()) {
        for (const task of step.tasks) {
          if (!task.pos) continue;
          positions.add(task.pos.join());
          if (task.hidden) {
            hidden.push({ variant: vi + 1, step: si + 1, tagline: task.tagline, item: task.item, pos: task.pos });
          }
        }
      }
    }

    m.stepCount = m.variants[0]?.length ?? 0;
    m.positionCount = positions.size;
    m.hidden = hidden;
    // no steps at all, or every position is the 1,1,1 placeholder
    m.stub = m.stepCount === 0 || (positions.size > 0 && [...positions].every(p => p === '1,1,1'));
    return m;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(OUT, JSON.stringify(missions, null, 1) + '\n');

const stubs = missions.filter(m => m.stub).length;
console.log(
  `${missions.length} missions (${stubs} unreleased) of ${all.length} total ` +
  `-> ${OUT} (${(JSON.stringify(missions).length / 1024).toFixed(0)} kB)`
);
