// hand written hints for an unmarked objective, keyed by mission id and then by
// the shot's file name. kept out of mission-spots.ts because the image generator
// overwrites that file every run.

// for a mission whose spots are spread over one building, the order to sweep them
// in is worth more than any single spot. shown above the shots.
export const MISSION_ROUTES: Record<string, string> = {
  Kismet3:
    'Go in the main southwest entrance. Check 3 outside it, then 2 just inside, then head ' +
    'right for 1. Carry straight on, take the left turn into Wing C for 4. Come back the way ' +
    'you came and into Wing A, where 5 sits by the northeast stairs. Up those stairs, off at ' +
    'the second floor, into O.R. 3 for 6. If it is none of them it is 7, all the way up on ' +
    'floor 15 by the southwest stairs next to the heli platform.',
};

export function routeFor(missionId: string): string | undefined {
  return MISSION_ROUTES[missionId];
}

export const SPOT_NOTES: Record<string, Record<string, string>> = {
  DeepEnd1: {
    ResearchGateKey: 'Next to the red car on the lowest floor of the parking garage.',
  },
  Eye1: {
    case: "Behind the pilot's seat.",
  },
  Kismet3: {
    '1': 'Inside the main southwest entrance, off to the right.',
    '2': 'Just inside the main southwest entrance.',
    '3': 'Outside the main southwest entrance.',
    '4': 'Wing C. Straight on from the entrance, then the left turn.',
    '5': 'Wing A, by the entrance to the northeast stairs.',
    '6': 'Second floor, O.R. 3, up the northeast stairs.',
    '7': 'Floor 15, by the southwest stairs next to the heli platform.',
  },
  ResearchFellow3: {
    SafeKey1: 'At the basketball court.',
    SafeKey2: 'At the cafe.',
    SafeKey3: 'At the gym.',
  },
};

export function noteFor(missionId: string, src: string): string | undefined {
  // "/missions/DeepEnd1/ResearchGateKey.webp" -> "ResearchGateKey"
  const file = src.slice(src.lastIndexOf('/') + 1, src.lastIndexOf('.'));
  return SPOT_NOTES[missionId]?.[file];
}
