export type LocationCategory =
  | 'Spawnpoint'
  | 'Building'
  | 'Extraction Point'
  | 'Enemy Location'
  | 'Zombie Nest'
  | 'Key Spawn Location'
  | 'Locked Doors'
  | 'Quarantine Zone'
  | 'Medical'
  | 'Shop'
  | 'Landmark'
  | 'Subway Station'
  | 'Infiltration'
  | 'Raid'
  | 'Other';

export interface LocationImage {
  url: string;
  description?: string;
}

export interface ContentBlock {
  type: 'text' | 'image-left' | 'image-right' | 'gallery' | 'header' | 'divider';
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  level?: 1 | 2 | 3;
}

export interface MapLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
  category: LocationCategory;
  image?: string;
  images?: LocationImage[];
  richContent?: ContentBlock[];
  shortDescription?: string;
}

export const CATEGORY_COLORS: Record<LocationCategory, string> = {
  'Spawnpoint': '#44cc88',
  'Building': '#6699cc',
  'Extraction Point': '#ff6b9d',
  'Enemy Location': '#cc4444',
  'Zombie Nest': '#cc4444',
  'Key Spawn Location': '#d4a544',
  'Locked Doors': '#d4a544',
  'Quarantine Zone': '#cc8844',
  'Medical': '#44aacc',
  'Shop': '#aa88cc',
  'Landmark': '#cccc44',
  'Subway Station': '#9966cc',
  'Infiltration': '#5599dd',
  'Raid': '#dd5555',
  'Other': '#888888',
};

