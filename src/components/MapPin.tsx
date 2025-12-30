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
  const pinSize = Math.max(12, 16 / scale);
  const fontSize = Math.max(10, 12 / scale);

  return (
    <div
      className={`map-pin ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
      style={{
        left: location.x,
        top: location.y,
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
      {(isHovered || isSelected) && (
        <div className="pin-label" style={{ fontSize }}>
          {location.name}
        </div>
      )}
    </div>
  );
}
