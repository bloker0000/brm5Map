export type LocationCategory =
  | 'Spawnpoint'
  | 'Building'
  | 'Extraction Point'
  | 'Enemy Location'
  | 'Zombie Nest'
  | 'Key Spawn Location'
  | 'Locked Door'
  | 'Quarantine Zone'
  | 'Medical'
  | 'Shop'
  | 'Landmark'
  | 'Subway Station'
  | 'Infiltration'
  | 'Raid'
  | 'Safe'
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
  'Spawnpoint': '#35d497',
  'Building': '#2d80d3',
  'Extraction Point': '#fa3073',
  'Enemy Location': '#eb3a3a',
  'Zombie Nest': '#759c1a',
  'Key Spawn Location': '#d4a544',
  'Locked Door': '#cc812b',
  'Quarantine Zone': '#d2df60',
  'Medical': '#44aacc',
  'Shop': '#aa88cc',
  'Landmark': '#d8d8b1',
  'Subway Station': '#9966cc',
  'Infiltration': '#6ac9e0',
  'Raid': '#e74818',
  'Safe': '#c8a84b',
  'Other': '#888888',
};

