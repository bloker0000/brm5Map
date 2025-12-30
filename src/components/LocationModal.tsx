import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon, CloseIcon } from './Icons';
import './LocationModal.css';

interface LocationModalProps {
  location: MapLocation | null;
  onClose: () => void;
}

export function LocationModal({ location, onClose }: LocationModalProps) {
  if (!location) return null;

  const color = CATEGORY_COLORS[location.category];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ '--modal-color': color } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <CloseIcon size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <CategoryIcon category={location.category} size={28} color={color} />
          </div>
          <div className="modal-title-group">
            <h2 className="modal-title">{location.name}</h2>
            <div className="modal-category">{location.category}</div>
          </div>
        </div>

        {location.image && (
          <div className="modal-image">
            <img src={location.image} alt={location.name} />
          </div>
        )}

        <div className="modal-description">{location.description}</div>

        <div className="modal-coords">
          <span className="modal-coords-label">Coordinates:</span>
          <span className="modal-coords-value">
            X: {location.x} | Y: {location.y}
          </span>
        </div>
      </div>
    </div>
  );
}
