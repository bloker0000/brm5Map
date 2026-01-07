export type LocationCategory =
  | 'Spawnpoint'
  | 'Building'
  | 'Extraction Point'
  | 'Enemy Outpost'
  | 'Zombie Nest'
  | 'Key Spawn Location'
  | 'Key Use Location'
  | 'Quarantine Zone'
  | 'Medical'
  | 'Shop'
  | 'Landmark'
  | 'Subway Station'
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
  'Enemy Outpost': '#cc4444',
  'Zombie Nest': '#cc4444',
  'Key Spawn Location': '#d4a544',
  'Key Use Location': '#d4a544',
  'Quarantine Zone': '#cc8844',
  'Medical': '#44aacc',
  'Shop': '#aa88cc',
  'Landmark': '#cccc44',
  'Subway Station': '#9966cc',
  'Other': '#888888',
};

