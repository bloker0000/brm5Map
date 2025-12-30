import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './Tooltip.css';

interface TooltipProps {
  location: MapLocation | null;
  mousePosition: { x: number; y: number };
}

function getFirstImage(location: MapLocation): string | undefined {
  if (location.images && location.images.length > 0) {
    return location.images[0].url;
  }
  return location.image;
}

export function Tooltip({ location, mousePosition }: TooltipProps) {
  if (!location) return null;

  const color = CATEGORY_COLORS[location.category];
  const previewImage = getFirstImage(location);

  return (
    <div
      className="tooltip"
      style={{
        left: mousePosition.x + 15,
        top: mousePosition.y + 15,
        '--tooltip-color': color,
      } as React.CSSProperties}
    >
      {previewImage && (
        <div className="tooltip-image">
          <img src={previewImage} alt={location.name} />
        </div>
      )}
      <div className="tooltip-header">
        <CategoryIcon category={location.category} size={16} color={color} />
        <span className="tooltip-name">{location.name}</span>
      </div>
      <div className="tooltip-category">{location.category}</div>
      <div className="tooltip-hint">Click for details</div>
    </div>
  );
}
