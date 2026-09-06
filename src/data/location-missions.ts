import { MISSION_TITLES } from './mission-titles';

// which missions actually take place at a location, hand written. derived by
// projecting the missions' world positions onto the map (the transform is in
// tools/find-mission-transform.mjs) and then keeping only what the briefings and
// step text back up, so a mission that merely passes nearby is not listed here.
// keyed by location id, the name above each one is just to read by.
const LOCATION_MISSIONS: Record<string, string[]> = {
  // UNS New York
  'mk3xixs4jq4o0c2do9': ['Tutorial1', 'Introductions', 'ShallowEnd1'],
  // Metro New York Hospital
  'mjruy5f9grckcevy77f': ['ResearchFellow2', 'ResearchFellow4', 'Kismet3', 'Wetwork4', 'Christmas1'],
  // Hospital Helipad
  'mjrv19m6j8i15ykkmf': ['Kismet3'],
  // Ground Zero 2 (Site A)
  'mjrvvish6y9sad2bfmb': ['GroundZero1', 'DeepEnd1'],
  // Ground Zero 2 Garage
  'mjrvv68b48b96iwqjdc': ['DeepEnd1', 'ShadyBiz1', 'Christmas1'],
  // Improvised Meeting Room
  'mjrvw2jf49vtrwja4gr': ['DeepEnd1'],
  // Water Treatment Plant (Site C)
  'mjrurjdgevrvm94t688': ['DeepEnd2'],
  // Fulton x William Building
  'mnx960iwxpikfixs5l': ['DeepEnd3'],
  // Conference Room
  'mnc93y2zacdgll7hos': ['DeepEnd3'],
  // Federal Reserve Bank Raid
  'mnc8iejy54bz2ds97x': ['ReserveRaid'],
  // Vault Locker
  'mnmv6ti5vly2mg513ns': ['ReserveRaid'],
  // Kismet HQ Raid
  'mnc8hljtke7a8qwdteb': ['OfficeRaid'],
  // Sheepdog Stronghold Raid
  'mnc8l7rcg7dvxc7smrw': ['ConstructionRaid', 'HammerDown4', 'Journalist1'],
  // Fallen Construction Crane
  'mjztyhvdjwl1kgf5x9': ['Journalist1'],
  // Fortified Sheepdog Camp
  'mjt40ao50mx9h7pcc3j': ['HammerDown1'],
  // Whitehall Sheepdog Outpost
  'mjrvtq3vt1itadzeuss': ['HammerDown2', 'Journalist2'],
  // Military Checkpoint
  'mjrw01k5pt8lvq0z0c': ['HammerDown5', 'Stryker3'],
  // Military Checkpoint Garage
  'mjrvzs8dbgpc1cacni': ['Christmas1'],
  // Pier 17 Mall
  'mjrufsit5s55teg03a': ['HammerDown5'],
  // Pier 17 Mall Rooftop
  'mjrsuqm7is7kgdoys7': ['HammerDown5'],
  // Pier Sheepdog Camp
  'mjrugla1my8fmhkkaw': ['HammerDown5'],
  // Bridge Bandit Camp
  'mjrvdg92ey7j6v936t9': ['HammerDown5'],
  // Substation
  'mjrv5xcwy1hj2ugofn': ['Repair1', 'Repair2', 'Kismet2'],
  // NYPlug New York Power Group
  '1': ['Repair1'],
  // Carl's Cars Sheepdog Outpost
  'mjrvj0bwpto8itfovkp': ['Repair2'],
  // Abrams Square Drop-Off
  'mnc8m2pzfgy2of36ma9': ['Repair2'],
  // Liberty Bank
  'mjrvob8nmok6jfgzced': ['ShadyBiz1', 'Journalist2'],
  // Bank Security Gate
  'mn61mwlnfejyvbralv': ['ShadyBiz1'],
  // Fairfield Inn & Suites
  'mjrvh8tdvgr30i8ck1': ['ResearchFellow1', 'ResearchFellow3'],
  // Gym Panda
  'mk324slfjz6t2o891v': ['ResearchFellow3', 'Insurance1', 'Journalist2'],
  // Hot Mug Cafe
  'mn6czme0s96dde5vgyf': ['ResearchFellow3', 'Journalist2'],
  // Trashed Basketball Court
  'mnrin662uivi64wlm2f': ['ResearchFellow3'],
  // Dorsia
  'mjrvqwzr30168dstyr8': ['Dorsia1'],
  // Dorsia Bandit Camp
  'mjrvrqkf557nhfupfur': ['Dorsia1'],
  // Quill Clothing Outlet
  'mjrvrytly5lyzeir8k': ['Insurance1'],
  // Quill Jewellery Outlet
  'mnc8tvt4fxoocgsky3o': ['Insurance1'],
  // Triple R Diner
  'mjrvn6gujqbuynmtqz': ['Insurance1'],
  // Euro Deli
  'mjrv8r38qirhjh5858k': ['Defector2', 'WeissGift2', 'Insurance1'],
  // Activity-Full & Sphere Solutions
  '3': ['Gaming1', 'Insurance1'],
  // Locked Safe
  'mjrvoz6urfycx8xq8q': ['Gaming1'],
  // Player Spawn Acitivity Full
  'mjvl38frqesnehb57hm': ['Gaming1'],
  // Fluton Market
  'mjrvbvm2xw7dk78r5yb': ['WeissGift1', 'WeissGift2'],
  // Fresh Stop Supermarket
  'mjrv2vig3klf2lnqy9d': ['WeissGift2'],
  // Parking Lot
  'mjrvgrtswnpdlpuclgf': ['FixerIntro'],
  // Abrams Square Bandit Outpost
  'mjrvg2yu12fqri0iple': ['Journalist3', 'Journalist4'],
  // Carl's Cars
  'mjt4hf7ssf7dc0z70l': ['Journalist2'],
  // Damage Bridge1
  'mjrumdh97nqjpqv32an': ['Defector3'],
  // Peck Slip Plaza
  'mjrv576jhfopdf83x5i': ['Defector3'],
  // Whitehall Player Spawn
  'mjt4x7f9x4jf66sh7ae': ['Defector1'],
  // South-West Metro Station
  'mjvll2a7ck8qg0up0xl': ['Wetwork5'],
  // Southbridge Towers
  'mjrv4bp27lq8yth8pz6': ['Wetwork2'],
  // Garage Sheepdog Camp
  'mjrv9gckk0fdmss301l': ['Wetwork1'],
  // Ground Zero Gate
  'mjrvypk5pxrrb4sh73': ['Wetwork3'],
  // Gate Bandit Camp
  'mjrvyhprb84kvtssp2a': ['Wetwork3'],
  // Top of Raised Park
  'mjrvk7yp6ewdm0dtggd': ['Stryker2'],};

export interface MissionLink {
  id: string;
  name: string;
}

export function missionsAt(locationId: string): MissionLink[] {
  // gen-missions.mjs fails the build on an id that no longer exists, but a typo
  // added by hand between runs should still give a link you can follow
  return (LOCATION_MISSIONS[locationId] ?? []).map(id => ({ id, name: MISSION_TITLES[id] ?? id }));
}
