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
  'Spawnpoint': '#44cc88',
  'Building': '#6699cc',
  'Residence': '#6699cc',
  'Office Building Small': '#6699cc',
  'Office Building Large': '#6699cc',
  'Extraction Point': '#44cc88',
  'Enemy Outpost': '#cc4444',
  'Zombie Nest': '#cc4444',
  'Key Spawn Location': '#d4a544',
  'Key Use Location': '#d4a544',
  'Quarantine Zone': '#cc8844',
  'Medical': '#44aacc',
  'Shop': '#aa88cc',
  'Landmark': '#cccc44',
  'Other': '#888888',
};

