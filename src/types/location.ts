export type LocationCategory =
  | 'Spawnpoint'
  | 'Building'
  | 'Residence'
  | 'Office Building Small'
  | 'Office Building Large'
  | 'Extraction Point'
  | 'Enemy Outpost'
  | 'Zombie Nest'
  | 'Key Spawn Location'
  | 'Key Use Location'
  | 'Quarantine Zone'
  | 'Medical'
  | 'Shop'
  | 'Landmark'
  | 'Other';

export interface MapLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
  category: LocationCategory;
  image?: string;
}

export const CATEGORY_COLORS: Record<LocationCategory, string> = {
  'Spawnpoint': '#ff4444',
  'Building': '#4488ff',
  'Residence': '#4488ff',
  'Office Building Small': '#4488ff',
  'Office Building Large': '#4488ff',
  'Extraction Point': '#00ff88',
  'Enemy Outpost': '#aa44ff',
  'Zombie Nest': '#cc0000',
  'Key Spawn Location': '#ff8844',
  'Key Use Location': '#ffaa33',
  'Quarantine Zone': '#ffdd44',
  'Medical': '#4488ff',
  'Shop': '#4488ff',
  'Landmark': '#4488ff',
  'Other': '#4488ff',
};

