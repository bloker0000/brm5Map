import type { MapLocation, LocationImage } from '../types/location';
import { isLocationCategory } from '../types/location';
import locationsData from './brm5-locations.json';

export const defaultLocations: MapLocation[] = locationsData as MapLocation[];

export function loadLocations(): MapLocation[] {
  return [...defaultLocations];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function sanitizeImages(raw: unknown): LocationImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((img) => {
      if (typeof img === 'string') return { url: img.trim() };
      if (!img || typeof img !== 'object') return null;
      const { url, description } = img as Partial<LocationImage>;
      if (typeof url !== 'string' || !url.trim()) return null;
      return {
        url: url.trim(),
        ...(typeof description === 'string' && description.trim()
          ? { description: description.trim() }
          : {}),
      };
    })
    .filter((img): img is LocationImage => img !== null);
}

// imported json is user supplied, so assume nothing about its shape
export function sanitizeLocation(raw: unknown): MapLocation | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const loc = raw as Record<string, unknown>;

  const name = typeof loc.name === 'string' ? loc.name.trim() : '';
  if (!name) return null;

  const x = Number(loc.x);
  const y = Number(loc.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  const images = sanitizeImages(loc.images);
  if (images.length === 0 && typeof loc.image === 'string' && loc.image.trim()) {
    images.push({ url: loc.image.trim() });
  }

  const shortDescription =
    typeof loc.shortDescription === 'string' ? loc.shortDescription.trim() : '';

  return {
    id: typeof loc.id === 'string' && loc.id.trim() ? loc.id.trim() : generateId(),
    name,
    x: Math.round(x),
    y: Math.round(y),
    description: typeof loc.description === 'string' ? loc.description : '',
    category: isLocationCategory(loc.category) ? loc.category : 'Other',
    ...(shortDescription ? { shortDescription } : {}),
    ...(images.length > 0 ? { images } : {}),
  };
}
