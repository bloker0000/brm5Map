// shape of src/data/brm5-missions.json, written by tools/gen-missions.mjs

export interface MissionTask {
  type: string;
  tagline?: string;
  item?: string;
  pos?: number[];
  // the game has a position for this but deliberately withholds the waypoint
  hidden?: boolean;
  args?: Record<string, string>;
}

export interface MissionStep {
  desc: string;
  tasks: MissionTask[];
}

export interface HiddenObjective {
  variant: number;
  step: number;
  tagline?: string;
  item?: string;
  pos: number[];
}

// the paired numbers are the first-completion and the repeat payout
export interface MissionRewards {
  Money?: number[];
  EXP?: number[];
  OperatorTokens?: number[];
  Items?: string[];
  Vouchers?: string[];
  Resources?: string;
}

export interface Mission {
  id: string;
  name: string;
  giver: string;
  faction?: string;
  level: number;
  difficulty: number | null;
  extraction: boolean;
  gasmask: boolean;
  exclusive: boolean;
  raid: boolean;
  prerequisites: string[];
  rewards: MissionRewards;
  briefing?: string;
  debriefing?: string;
  // the server rolls one variant per run and never tells you which
  variants: MissionStep[][];
  stepCount: number;
  positionCount: number;
  hidden: HiddenObjective[];
  // still a placeholder in the configs, not playable yet
  stub: boolean;
}

export const MAX_DIFFICULTY = 4;
