import type { MapLocation } from '../types/location';

const STORAGE_KEY = 'brm5_map_locations';

export const defaultLocations: MapLocation[] = [
  {
    "id": "1",
    "name": "NYPlug",
    "x": 1059,
    "y": 2165,
    "description": "Entrance and exit to a building. At the rear, there is a spawn point and an additional entrance. The building has multiple stories.",
    "category": "Building"
  },
  {
    "id": "2",
    "name": "Stone 6 (Saul & Co)",
    "x": 1215,
    "y": 2105,
    "description": "A three-story office building. Access to the third-floor office requires a key.",
    "category": "Office Building Small"
  },
  {
    "id": "3",
    "name": "Activity-Full Sphere Solutions",
    "x": 1015,
    "y": 1960,
    "description": "A multi-story office building. The penultimate floor contains a safe that can be opened with a key. Two staircases provide access to this floor: the staircase closest to the front of the building, which faces southwest, continues to the top of the building, while the other terminates at the penultimate floor.",
    "category": "Office Building Large"
  },
  {
    "id": "4",
    "name": "Spawnpoint near NYPlug",
    "x": 929,
    "y": 2251,
    "description": "A spawn point. This is where players may spawn on the second or third floor of the building.",
    "category": "Residence"
  },
  {
    "id": "5",
    "name": "Extract Whitehall",
    "x": 753,
    "y": 2038,
    "description": "An extraction point. An enemy outpost, where two enemies may spawn, is located at the ladder leading to the extraction point.",
    "category": "Extraction Point"
  },
  {
    "name": "Extraction Point Pier",
    "x": 2653,
    "y": 744,
    "description": "An extraction point located on the rooftop of this building. Use the escalators to reach the top. In PvP, players often camp or loot this area, so proceed with caution.",
    "category": "Extraction Point",
    "id": "mjrsuqm7is7kgdoys7"
  },
  {
    "name": "Booth",
    "x": 2328,
    "y": 998,
    "description": "A small booth, can be entered.",
    "category": "Building",
    "id": "mjru18uyt94j1yss0i"
  },
  {
    "name": "Cobble Fish",
    "x": 2444,
    "y": 977,
    "description": "A small building. Cannot be entered. Probably used for storage",
    "category": "Building",
    "id": "mjru2z86li39r26htj"
  },
  {
    "name": "Pier 17",
    "x": 2540,
    "y": 739,
    "description": "A medium-to-large building with multiple floors, resembling a former shopping center. On the northeast side, directly next to the building, there is a medium-sized enemy outpost.",
    "category": "Building",
    "id": "mjrufsit5s55teg03a"
  },
  {
    "name": "Pier Enemy Outpost",
    "x": 2615,
    "y": 635,
    "description": "An enemy outpost near Pier 17.",
    "category": "Enemy Outpost",
    "id": "mjrugla1my8fmhkkaw"
  },
  {
    "name": "Tin Building Market Flood Hall",
    "x": 2331,
    "y": 732,
    "description": "TBA",
    "category": "Other",
    "id": "mjruiv7hrbxfyt6d6cc"
  },
  {
    "name": "Damage Bridge1",
    "x": 2228,
    "y": 469,
    "description": "This area of the bridge is damaged.",
    "category": "Landmark",
    "id": "mjrumdh97nqjpqv32an"
  },
  {
    "name": "Damaged Bridge2",
    "x": 2224,
    "y": 1365,
    "description": "This area of the bridge is damaged.",
    "category": "Landmark",
    "id": "mjrumoor2ejyp50h2h9"
  },
  {
    "name": "Water Treatment Plant",
    "x": 2224,
    "y": 1768,
    "description": "An area with a very high zombie population. Raiding this location is strongly recommended with multiple team members.",
    "category": "Zombie Nest",
    "id": "mjrurjdgevrvm94t688"
  },
  {
    "name": "Hospital",
    "x": 1367,
    "y": 468,
    "description": "A highly populated zombie area centered around a large hospital. Enter with caution. The area can be accessed from the southeast via the Southbridge Towers, or from the west by passing through the buildings on William Street and entering through the gate. The gate may require a key if it is not already open. Enemy spawns may also occur between the buildings.",
    "category": "Quarantine Zone",
    "id": "mjruy5f9grckcevy77f"
  },
  {
    "name": "Extraction point hospital",
    "x": 1471,
    "y": 381,
    "description": "The exact conditions for using this extraction point are unclear for me, but it appears to be used by a helicopter when extracting from the hospital quarantine zone via the CSEL extraction radio. The helicopter lands on the highest accessible floor of the helicopter landing pad.",
    "category": "Extraction Point",
    "id": "mjrv19m6j8i15ykkmf"
  },
  {
    "name": "Crashed Helicopter",
    "x": 1379,
    "y": 324,
    "description": "A crashed helicopter right next to the hospital building.",
    "category": "Landmark",
    "id": "mjrv23gm29chalazqa"
  },
  {
    "name": "Saul Mart",
    "x": 1654,
    "y": 226,
    "description": "TBA",
    "category": "Building",
    "id": "mjrv2vig3klf2lnqy9d"
  },
  {
    "name": "Southbridge Towers",
    "x": 1701,
    "y": 300,
    "description": "Two towers of varying height that can be used to access the hospital quarantine zone.",
    "category": "Building",
    "id": "mjrv4bp27lq8yth8pz6"
  },
  {
    "name": "Peck Slip Plaza",
    "x": 2029,
    "y": 467,
    "description": "TBA",
    "category": "Landmark",
    "id": "mjrv576jhfopdf83x5i"
  },
  {
    "name": "Substation",
    "x": 2104,
    "y": 294,
    "description": "Looks like some power plant, location is used for a PVE mission.",
    "category": "Building",
    "id": "mjrv5xcwy1hj2ugofn"
  },
  {
    "name": "Bandit Location",
    "x": 1966,
    "y": 371,
    "description": "Enemies may spawn here",
    "category": "Enemy Outpost",
    "id": "mjrv6sqgvldq0vwu2rs"
  },
  {
    "name": "Euro Deli",
    "x": 2125,
    "y": 635,
    "description": "A small, multi-story building that is excellent for scouting. It provides an almost complete view of the entire bridge, with the top floor offering a near 360-degree view.",
    "category": "Building",
    "id": "mjrv8r38qirhjh5858k"
  },
  {
    "name": "Enemy Outpost",
    "x": 1789,
    "y": 655,
    "description": "TBA",
    "category": "Enemy Outpost",
    "id": "mjrv9gckk0fdmss301l"
  },
  {
    "name": "Fluton Market",
    "x": 2072,
    "y": 1243,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvbvm2xw7dk78r5yb"
  },
  {
    "name": "Enemy Outpost",
    "x": 1934,
    "y": 874,
    "description": "TBA",
    "category": "Enemy Outpost",
    "id": "mjrvcgr8zcifyxvmm3"
  },
  {
    "name": "Enemy Outpost",
    "x": 2244,
    "y": 800,
    "description": "This is under the bridge",
    "category": "Enemy Outpost",
    "id": "mjrvdg92ey7j6v936t9"
  },
  {
    "name": "199 water street",
    "x": 1777,
    "y": 1133,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvegrhkx3df85yxgm"
  },
  {
    "name": "One Seaport Plaza",
    "x": 1774,
    "y": 1304,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvernx7yndcvyogsu"
  },
  {
    "name": "Imagination Playground",
    "x": 2015,
    "y": 1344,
    "description": "TBA",
    "category": "Landmark",
    "id": "mjrvfb5runy7yuzeu5c"
  },
  {
    "name": "Enemy Outpost",
    "x": 2103,
    "y": 1468,
    "description": "This outpost is near a drop off location. You may get shot at when getting dropped off here in PVE.",
    "category": "Enemy Outpost",
    "id": "mjrvg2yu12fqri0iple"
  },
  {
    "name": "Parking Lot",
    "x": 1948,
    "y": 1470,
    "description": "TBA",
    "category": "Landmark",
    "id": "mjrvgrtswnpdlpuclgf"
  },
  {
    "name": "Fairfield Inn & Suites",
    "x": 1946,
    "y": 1649,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvh8tdvgr30i8ck1"
  },
  {
    "name": "32 Slip Old Plaza",
    "x": 2001,
    "y": 1771,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvi2oysnybmrvr28"
  },
  {
    "name": "85 Broad Street Goldman Sachs",
    "x": 1773,
    "y": 1813,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvikn0jh6fgfp2wh"
  },
  {
    "name": "Enemy Location",
    "x": 1894,
    "y": 2009,
    "description": "They spawn as well as inside as outside.",
    "category": "Enemy Outpost",
    "id": "mjrvj0bwpto8itfovkp"
  },
  {
    "name": "Former NYPD Station",
    "x": 2016,
    "y": 2025,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvjqdpw63iztfj1v9"
  },
  {
    "name": "Extraction Point",
    "x": 2001,
    "y": 2179,
    "description": "It can be accessed via the southeast or northwest staircases.",
    "category": "Extraction Point",
    "id": "mjrvk7yp6ewdm0dtggd"
  },
  {
    "name": "Stone 16",
    "x": 1515,
    "y": 1976,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvn6gujqbuynmtqz"
  },
  {
    "name": "Enemy Outpost",
    "x": 1556,
    "y": 1985,
    "description": "TBA",
    "category": "Enemy Outpost",
    "id": "mjrvnhy0kng3cvc4i2q"
  },
  {
    "name": "Liberty Bank",
    "x": 1298,
    "y": 1987,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvob8nmok6jfgzced"
  },
  {
    "name": "Stone 8",
    "x": 1243,
    "y": 1979,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvol1mdop1ngywhtc"
  },
  {
    "name": "Safe",
    "x": 991,
    "y": 1936,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvoz6urfycx8xq8q"
  },
  {
    "name": "Westbridge Partners Office",
    "x": 1042,
    "y": 1638,
    "description": "TBA",
    "category": "Office Building Large",
    "id": "mjrvpwtv3pnawe7s3dp"
  },
  {
    "name": "05 Key",
    "x": 1067,
    "y": 1543,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvq6fklicvyaavd9o"
  },
  {
    "name": "Dorisa",
    "x": 814,
    "y": 1833,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvqwzr30168dstyr8"
  },
  {
    "name": "Maintance Key",
    "x": 845,
    "y": 1885,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvr8dbyfizchv9dae"
  },
  {
    "name": "Enemy Location",
    "x": 885,
    "y": 1925,
    "description": "TBA",
    "category": "Enemy Outpost",
    "id": "mjrvrqkf557nhfupfur"
  },
  {
    "name": "Quill",
    "x": 849,
    "y": 1960,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvrytly5lyzeir8k"
  },
  {
    "name": "Spawnpoint",
    "x": 964,
    "y": 2251,
    "description": "TBA",
    "category": "Spawnpoint",
    "id": "mjrvseahe6vji28wobj"
  },
  {
    "name": "Spawn Location",
    "x": 675,
    "y": 1925,
    "description": "TBA",
    "category": "Spawnpoint",
    "id": "mjrvt84rqomx0v3io8"
  },
  {
    "name": "Enemy Location",
    "x": 738,
    "y": 1983,
    "description": "TBA",
    "category": "Enemy Outpost",
    "id": "mjrvtq3vt1itadzeuss"
  },
  {
    "name": "Office key",
    "x": 1197,
    "y": 2099,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvuh1xeb2sx6scjg"
  },
  {
    "name": "Zombie Nest",
    "x": 653,
    "y": 1564,
    "description": "TBA",
    "category": "Zombie Nest",
    "id": "mjrvv68b48b96iwqjdc"
  },
  {
    "name": "Quarantine Zone",
    "x": 740,
    "y": 1461,
    "description": "TBA",
    "category": "Quarantine Zone",
    "id": "mjrvvish6y9sad2bfmb"
  },
  {
    "name": "Meeting Room Key",
    "x": 691,
    "y": 1555,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvw2jf49vtrwja4gr"
  },
  {
    "name": "Federal Reserve Bank of New York",
    "x": 775,
    "y": 1327,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvwm09mz9or34hjtp"
  },
  {
    "name": "33 Liberty Street",
    "x": 807,
    "y": 1123,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvwv7zsfug2sg7259"
  },
  {
    "name": "Trump Building",
    "x": 849,
    "y": 1020,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvx6wf2n1r8cqubta"
  },
  {
    "name": "Quill Jewerly",
    "x": 776,
    "y": 1019,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvxkgr2pbael5wj9q"
  },
  {
    "name": "40 Wall Street",
    "x": 774,
    "y": 923,
    "description": "TBA",
    "category": "Building",
    "id": "mjrvxu9xiwm5dp7kcbr"
  },
  {
    "name": "Spawn Location",
    "x": 966,
    "y": 885,
    "description": "TBA",
    "category": "Spawnpoint",
    "id": "mjrvy7p30pd1dveub0i"
  },
  {
    "name": "Enemy Location",
    "x": 1015,
    "y": 820,
    "description": "TBA",
    "category": "Enemy Outpost",
    "id": "mjrvyhprb84kvtssp2a"
  },
  {
    "name": "Gate",
    "x": 1035,
    "y": 824,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvypk5pxrrb4sh73"
  },
  {
    "name": "Armory",
    "x": 1504,
    "y": 1356,
    "description": "TBA",
    "category": "Key Use Location",
    "id": "mjrvzhe8153uoqgvi28"
  },
  {
    "name": "Zombie Nest",
    "x": 1523,
    "y": 1323,
    "description": "TBA",
    "category": "Zombie Nest",
    "id": "mjrvzs8dbgpc1cacni"
  },
  {
    "name": "Quarantine Zone",
    "x": 1617,
    "y": 1314,
    "description": "TBA",
    "category": "Quarantine Zone",
    "id": "mjrw01k5pt8lvq0z0c"
  },
  {
    "name": "Cities Service Building",
    "x": 1431,
    "y": 999,
    "description": "TBA",
    "category": "Building",
    "id": "mjrw0f5rf810z62ai7"
  },
  {
    "name": "70 Pine Street",
    "x": 1389,
    "y": 945,
    "description": "TBA",
    "category": "Building",
    "id": "mjrw0nfd49ydztq3o7g"
  },
  {
    "name": "RDII Mega Solution",
    "x": 1315,
    "y": 1126,
    "description": "TBA",
    "category": "Building",
    "id": "mjrw10kjfs3ptbcfmuh"
  },
  {
    "name": "Spawn Location",
    "x": 1291,
    "y": 1130,
    "description": "TBA",
    "category": "Spawnpoint",
    "id": "mjrw1c2nj7fo9rackf"
  },
  {
    "name": "Enemy Location",
    "x": 953,
    "y": 1150,
    "description": "TBA",
    "category": "Enemy Outpost",
    "id": "mjrw1r1ewvq9wl4885c"
  }
];

export function loadLocations(): MapLocation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load locations from storage:', e);
  }
  return defaultLocations;
}

export function saveLocations(locations: MapLocation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (e) {
    console.error('Failed to save locations to storage:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
