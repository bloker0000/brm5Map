import type { Mission } from '../types/mission';
import missionsData from './brm5-missions.json';

// the json is only ever read, so the double cast beats teaching tsc the literal type
export const MISSIONS = missionsData as unknown as Mission[];

export const MISSIONS_BY_ID = new Map(MISSIONS.map(mission => [mission.id, mission]));

// biggest questlines first, which puts the two story givers at the top and the
// one-off HQ givers at the bottom
export const MISSION_GIVERS = [...new Set(MISSIONS.map(mission => mission.giver))].sort(
  (a, b) =>
    MISSIONS.filter(m => m.giver === b).length - MISSIONS.filter(m => m.giver === a).length
);
