import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import Fuse from 'fuse.js';
import { MISSIONS, MISSIONS_BY_ID, MISSION_GIVERS } from '../data/missions';
import { BG_IMAGES, BG_CREDITS, randomBgIndex } from '../data/backgrounds';
import { spotsFor, SPOT_ASPECT } from '../data/mission-spots';
import { noteFor, routeFor } from '../data/mission-notes';
import { ImageLightbox } from './ImageLightbox';
import { MAX_DIFFICULTY } from '../types/mission';
import type { Mission, MissionStep, MissionTask } from '../types/mission';
import './MissionsPage.css';

interface MissionsPageProps {
  missionId: string | null;
  onSelectMission: (id: string | null) => void;
  onExit: () => void;
}

type Filter = 'unmarked' | 'variants' | 'gasmask' | 'raid' | 'released';

const FILTERS: { key: Filter; label: string; test: (m: Mission) => boolean }[] = [
  { key: 'released', label: 'In game', test: m => !m.stub },
  { key: 'unmarked', label: 'Unmarked spots', test: m => spotsFor(m.id).length > 0 },
  { key: 'variants', label: 'Random spawns', test: m => m.variants.length > 1 },
  { key: 'gasmask', label: 'Gasmask', test: m => m.gasmask },
  { key: 'raid', label: 'Raid', test: m => m.raid },
];

// the mission list never changes, so the index is built once at module load.
// ignoreLocation matters here: without it a briefing only matches near its start
const FUSE = new Fuse(
  MISSIONS.map(mission => ({
    id: mission.id,
    name: mission.name,
    giver: mission.giver,
    briefing: mission.briefing ?? '',
    objectives: (mission.variants[0] ?? []).map(step => step.desc).join(' '),
  })),
  {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'id', weight: 2 },
      { name: 'giver', weight: 1.5 },
      { name: 'objectives', weight: 1 },
      { name: 'briefing', weight: 0.5 },
    ],
    // 0.4 (what the location search uses) is too loose against the long briefing
    // text, where it starts matching almost anything
    threshold: 0.3,
    minMatchCharLength: 2,
    ignoreLocation: true,
  }
);

// briefings come out of the game config with <b> and <i> in them
function RichText({ text }: { text: string }) {
  const parts = text.split(/(<\/?[bi]>)/);
  let bold = 0;
  let italic = 0;

  return (
    <>
      {parts.map((part, i) => {
        if (part === '<b>') { bold++; return null; }
        if (part === '</b>') { bold--; return null; }
        if (part === '<i>') { italic++; return null; }
        if (part === '</i>') { italic--; return null; }
        if (!part) return null;
        let node = <>{part}</>;
        if (italic > 0) node = <em>{node}</em>;
        if (bold > 0) node = <strong>{node}</strong>;
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

// the label is wrapped so the trailing letter-spacing after the last letter can be
// pulled back off, otherwise the text sits left of centre in the box
function Badge({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span className={`mission-badge${className ? ` ${className}` : ''}`}>
      <span className="mission-badge-label">{label}</span>
      {children}
    </span>
  );
}

function Difficulty({ value }: { value: number }) {
  return (
    <span className="mission-difficulty" title={`Difficulty ${value} of ${MAX_DIFFICULTY}`}>
      {Array.from({ length: MAX_DIFFICULTY }, (_, i) => (
        <span key={i} className={`mission-pip${i < value ? ' filled' : ''}`} />
      ))}
    </span>
  );
}

function formatPos(pos: number[]) {
  return pos.map(n => Math.round(n)).join(', ');
}

function Task({ task }: { task: MissionTask }) {
  const args = Object.entries(task.args ?? {});
  return (
    <li className={`mission-task${task.hidden ? ' hidden-task' : ''}`}>
      <span className="mission-task-type">{task.type}</span>
      {task.tagline && <span className="mission-task-tagline">{task.tagline}</span>}
      {task.item && <span className="mission-task-item">{task.item}</span>}
      {task.pos && (
        <span className="mission-task-pos tabular">
          {formatPos(task.pos)}
          {task.hidden && <span className="mission-task-flag">no waypoint</span>}
        </span>
      )}
      {args.length > 0 && (
        <span className="mission-task-args">
          {args.map(([key, value]) => (
            <span key={key}>
              {key} = {value}
            </span>
          ))}
        </span>
      )}
    </li>
  );
}

function Steps({ steps, technical }: { steps: MissionStep[]; technical: boolean }) {
  return (
    <ol className="mission-steps">
      {steps.map((step, i) => (
        <li key={i} className="mission-step">
          <span className="mission-step-num tabular">{String(i + 1).padStart(2, '0')}</span>
          <div className="mission-step-body">
            <p className="mission-step-desc">{step.desc}</p>
            {!technical && (
              <div className="mission-step-taglines">
                {step.tasks
                  .filter(task => task.tagline)
                  .map((task, j) => (
                    <span key={j} className={`mission-chip${task.hidden ? ' hidden-chip' : ''}`}>
                      {task.tagline}
                    </span>
                  ))}
              </div>
            )}
            {technical && step.tasks.length > 0 && (
              <ul className="mission-tasks">
                {step.tasks.map((task, j) => (
                  <Task key={j} task={task} />
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Rewards({ mission }: { mission: Mission }) {
  const { Money, EXP, OperatorTokens, Items, Vouchers } = mission.rewards;
  const pairs: [string, number[]][] = [];
  if (Money) pairs.push(['Money', Money]);
  if (EXP) pairs.push(['EXP', EXP]);
  if (OperatorTokens) pairs.push(['Tokens', OperatorTokens]);

  const unlocks = [...(Items ?? []), ...(Vouchers ?? [])];
  if (!pairs.length && !unlocks.length) return null;

  return (
    <div className="mission-rewards">
      {pairs.length > 0 && (
        <dl className="mission-payout">
          {pairs.map(([label, [first, repeat]]) => (
            <div key={label} className="mission-payout-item">
              <dt className="mission-payout-label">{label}</dt>
              <dd className="mission-payout-value tabular">{first.toLocaleString()}</dd>
              <dd className="mission-payout-repeat tabular">{repeat.toLocaleString()} on repeat</dd>
            </div>
          ))}
        </dl>
      )}
      {unlocks.length > 0 && (
        <p className="mission-unlocks">
          <span className="mission-unlocks-label">Unlocks</span>
          {unlocks.join(', ')}
        </p>
      )}
    </div>
  );
}

function Detail({
  mission,
  onSelectMission,
}: {
  mission: Mission;
  onSelectMission: (id: string) => void;
}) {
  const [variant, setVariant] = useState(0);
  const [technical, setTechnical] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const steps = mission.variants[variant] ?? [];
  const spots = spotsFor(mission.id);
  const route = routeFor(mission.id);

  return (
    <div className="mission-detail">
      <div className="mission-detail-inner brm-panel-anim">
        <header className="mission-detail-head">
          <p className="mission-detail-giver">
            {mission.giver}
            {mission.faction && <span className="mission-detail-faction">{mission.faction}</span>}
          </p>
          <h1 className="mission-detail-name">{mission.name}</h1>
          <div className="mission-detail-badges">
            <Badge label={`Lvl ${mission.level}`} />
            {mission.difficulty !== null && (
              <Badge label="Difficulty">
                <Difficulty value={mission.difficulty} />
              </Badge>
            )}
            {mission.gasmask && <Badge label="Gasmask required" className="warn" />}
            {mission.extraction && <Badge label="Extraction" />}
            {mission.exclusive && <Badge label="Exclusive" />}
            {mission.raid && <Badge label="Raid" />}
            {mission.stub && <Badge label="Not in game yet" className="warn" />}
            <Badge label={mission.id} className="mission-badge--id" />
          </div>
        </header>

        <Rewards mission={mission} />

        {mission.prerequisites.length > 0 && (
          <section className="mission-section">
            <h2 className="brm-section-title">Unlocked by</h2>
            <div className="mission-prereqs">
              {mission.prerequisites.map(id => {
                const prereq = MISSIONS_BY_ID.get(id);
                return prereq ? (
                  <button key={id} className="mission-prereq" onClick={() => onSelectMission(id)}>
                    {prereq.name}
                  </button>
                ) : (
                  <span key={id} className="mission-prereq disabled" title="Not a zombies mission">
                    {id}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {mission.briefing && (
          <section className="mission-section">
            <h2 className="brm-section-title">Briefing</h2>
            <blockquote className="mission-brief">
              <RichText text={mission.briefing} />
            </blockquote>
          </section>
        )}

        {spots.length > 0 && (
          <section className="mission-section">
            <h2 className="brm-section-title">Unmarked objectives</h2>
            <p className="mission-note">
              The game never puts a waypoint on these.
              {spots.length > 1 && mission.variants.length > 1
                ? ' Only one spot is live per run, so work through them in turn.'
                : ''}
            </p>
            {route && (
              <p className="mission-route">
                <span className="mission-route-label">Suggested route</span>
                {route}
              </p>
            )}
            <div className="mission-spots" style={{ '--spot-aspect': SPOT_ASPECT } as CSSProperties}>
              {spots.map((spot, i) => {
                const note = noteFor(mission.id, spot.src);
                return (
                  <button
                    key={spot.src}
                    className="mission-spot"
                    onClick={() => setLightbox(i)}
                    title="Open full size"
                  >
                    <img src={spot.src} alt={spot.label} loading="lazy" decoding="async" />
                    <span className="mission-spot-text">
                      <span className="mission-spot-label">{spot.label}</span>
                      {note && <span className="mission-spot-note">{note}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="mission-section">
          <div className="mission-objectives-head">
            <h2 className="brm-section-title">Objectives</h2>
            <button
              className="mission-toggle"
              aria-pressed={technical}
              onClick={() => setTechnical(t => !t)}
            >
              {technical ? 'Simple' : 'Technical'}
            </button>
          </div>

          {mission.variants.length > 1 && (
            <>
              <p className="mission-note">
                This mission has {mission.variants.length} variants. The server picks one at the
                start of a run and does not tell you which, so every listed spot is a candidate.
              </p>
              <div className="mission-variants">
                {mission.variants.map((_, i) => (
                  <button
                    key={i}
                    className="mission-variant"
                    aria-pressed={i === variant}
                    onClick={() => setVariant(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}

          {steps.length > 0 ? (
            <Steps steps={steps} technical={technical} />
          ) : (
            <p className="mission-note">No objectives defined in the config.</p>
          )}
        </section>

        {mission.debriefing && (
          <section className="mission-section">
            <h2 className="brm-section-title">Debriefing</h2>
            <blockquote className="mission-brief">
              <RichText text={mission.debriefing} />
            </blockquote>
          </section>
        )}
      </div>

      {lightbox !== null && (
        <ImageLightbox
          images={spots.map(spot => {
            const note = noteFor(mission.id, spot.src);
            return {
              url: spot.full,
              thumb: spot.src,
              description: note ? `${spot.label} - ${note}` : spot.label,
            };
          })}
          initialIndex={lightbox}
          onClose={() => setLightbox(null)}
          locationName={mission.name}
        />
      )}
    </div>
  );
}

export function MissionsPage({ missionId, onSelectMission, onExit }: MissionsPageProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Set<Filter>>(new Set(['released']));
  const [bgIndex] = useState(randomBgIndex);
  const listRef = useRef<HTMLDivElement>(null);

  const credit = BG_CREDITS[bgIndex];

  const selected = missionId ? MISSIONS_BY_ID.get(missionId) ?? null : null;

  const needle = query.trim();

  const visible = useMemo(() => {
    const passesFilters = (mission: Mission) =>
      FILTERS.every(({ key, test }) => !filters.has(key) || test(mission));

    if (!needle) return MISSIONS.filter(passesFilters);

    return FUSE.search(needle)
      .map(result => MISSIONS_BY_ID.get(result.item.id))
      .filter((mission): mission is Mission => mission !== undefined)
      .filter(passesFilters);
  }, [needle, filters]);

  // grouping by giver hides the relevance order fuse just worked out, so a
  // search flattens the list instead
  const groups = useMemo(() => {
    if (needle) return [{ giver: 'Results', missions: visible }];
    return MISSION_GIVERS.map(giver => ({
      giver,
      missions: visible.filter(mission => mission.giver === giver),
    })).filter(group => group.missions.length > 0);
  }, [visible, needle]);

  const toggleFilter = useCallback((key: Filter) => {
    setFilters(prev => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  // a mission reached from a prerequisite chip is usually filtered out of the list
  useEffect(() => {
    if (!selected) return;
    listRef.current
      ?.querySelector(`[data-mission="${selected.id}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <div className={`missions-page${selected ? ' has-detail' : ''}`}>
      <div
        className="missions-bg"
        style={{ backgroundImage: `url(${BG_IMAGES[bgIndex]})` }}
      />
      <div className="missions-bg-scrim" />

      <div className="missions-rail">
        <div className="missions-rail-head">
          <div className="missions-back-row">
            <button className="missions-back" onClick={onExit}>
              <span className="missions-back-glyph">◀</span>
              <span className="missions-back-label">Map</span>
            </button>
            {selected && (
              <button className="missions-back to-list" onClick={() => onSelectMission(null)}>
                <span className="missions-back-glyph">◀</span>
                <span className="missions-back-label">All missions</span>
              </button>
            )}
          </div>
          <div className="missions-lockup">
            <h1 className="missions-title">Mission Library</h1>
            <span className="missions-subtitle">Operation CRYO Zombies</span>
          </div>
        </div>

        <div className="missions-search locations-list-search">
          <input
            type="text"
            value={query}
            placeholder="Search missions"
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="locations-list-clear" onClick={() => setQuery('')}>
              X
            </button>
          )}
        </div>

        <div className="missions-filters">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              className="missions-filter"
              aria-pressed={filters.has(key)}
              onClick={() => toggleFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="missions-count">
          <span className="tabular">{visible.length}</span> of{' '}
          <span className="tabular">{MISSIONS.length}</span> missions
        </div>

        <div className="missions-list" ref={listRef}>
          {groups.map(group => (
            <section key={group.giver} className="missions-group">
              <h2 className="missions-group-name">
                {group.giver}
                <span className="missions-group-count tabular">{group.missions.length}</span>
              </h2>
              {group.missions.map(mission => (
                <button
                  key={mission.id}
                  data-mission={mission.id}
                  className={`missions-item${mission.id === missionId ? ' selected' : ''}`}
                  onClick={() => onSelectMission(mission.id)}
                >
                  <span className="missions-item-name">{mission.name}</span>
                  <span className="missions-item-meta">
                    {mission.difficulty !== null && <Difficulty value={mission.difficulty} />}
                    {spotsFor(mission.id).length > 0 && (
                      <span
                        className="missions-item-flag"
                        role="img"
                        aria-label="Has unmarked objectives"
                        title="Has unmarked objectives"
                      />
                    )}
                  </span>
                </button>
              ))}
            </section>
          ))}
          {groups.length === 0 && <p className="missions-empty">No missions match.</p>}
        </div>

        <div className="missions-rail-footer">
          <span className="footer-credit-label">Art</span>
          {credit?.url ? (
            <a href={credit.url} target="_blank" rel="noopener noreferrer">
              {credit.name}
            </a>
          ) : (
            <span>{credit?.name}</span>
          )}
        </div>
      </div>

      {selected ? (
        // remount per mission so the variant picker and the scroll position reset
        <Detail key={selected.id} mission={selected} onSelectMission={onSelectMission} />
      ) : (
        <div className="mission-detail mission-detail--empty">
          <div className="missions-placeholder">
            <p className="missions-placeholder-title">Select a mission</p>
            <p className="missions-placeholder-text">
              Every zombies mission pulled from the game's quest configs: briefings, step by
              step objectives, rewards, and the objective positions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
