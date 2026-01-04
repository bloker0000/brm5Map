import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import './MapPin.css';

interface MapPinProps {
  location: MapLocation;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (location: MapLocation | null) => void;
  onClick: (location: MapLocation) => void;
  scale: number;
}

export function MapPin({ location, isHovered, isSelected, onHover, onClick, scale }: MapPinProps) {
  const color = CATEGORY_COLORS[location.category];
  const pinSize = 12;

  return (
    <div
      className={`map-pin ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
      style={{
        left: location.x * scale,
        top: location.y * scale,
        '--pin-color': color,
        '--pin-size': `${pinSize}px`,
      } as React.CSSProperties}
      onMouseEnter={() => onHover(location)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(location);
      }}
    >
      <div className="pin-dot" />
    </div>
  );
}
