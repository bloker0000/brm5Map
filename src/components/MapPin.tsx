import { memo, useCallback, useRef } from 'react';
import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './MapPin.css';

interface MapPinProps {
  location: MapLocation;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (location: MapLocation | null) => void;
  onClick: (location: MapLocation) => void;
  scale: number;
  rotation: number;
  isDraggable?: boolean;
  onDrag?: (locationId: string, x: number, y: number) => void;
}

export const MapPin = memo(function MapPin({ location, isHovered, isSelected, onHover, onClick, scale, rotation, isDraggable, onDrag }: MapPinProps) {
  const color = CATEGORY_COLORS[location.category];
  const pinSize = 25;
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, locX: 0, locY: 0 });
  const pinRef = useRef<HTMLDivElement>(null);
  const finalPosRef = useRef({ x: 0, y: 0 });

  const handleMouseEnter = useCallback(() => onHover(location), [onHover, location]);
  const handleMouseLeave = useCallback(() => onHover(null), [onHover]);
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;
    onClick(location);
  }, [onClick, location]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDraggable || !onDrag || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, locX: location.x, locY: location.y };
    finalPosRef.current = { x: location.x, y: location.y };

    const rotationRad = -rotation * Math.PI / 180;
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      if (!isDraggingRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        isDraggingRef.current = true;
      }
      if (!isDraggingRef.current) return;

      const rotatedDx = (dx * cos - dy * sin) / scale;
      const rotatedDy = (dx * sin + dy * cos) / scale;
      const newX = Math.round(dragStartRef.current.locX + rotatedDx);
      const newY = Math.round(dragStartRef.current.locY + rotatedDy);
      finalPosRef.current = { x: newX, y: newY };

      // Update DOM directly — only commit to state on mouseup
      if (pinRef.current) {
        pinRef.current.style.left = `${newX * scale}px`;
        pinRef.current.style.top = `${newY * scale}px`;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      if (isDraggingRef.current) {
        onDrag(location.id, finalPosRef.current.x, finalPosRef.current.y);
      }
      setTimeout(() => { isDraggingRef.current = false; }, 0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
  }, [isDraggable, onDrag, location.id, location.x, location.y, scale, rotation]);

  return (
    <div
      ref={pinRef}
      className={`map-pin ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''} ${isDraggable ? 'draggable' : ''}`}
      style={{
        left: location.x * scale,
        top: location.y * scale,
        '--pin-color': color,
        '--pin-size': `${pinSize}px`,
        '--pin-rotation': `${-rotation}deg`,
      } as React.CSSProperties}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="pin-icon">
        <CategoryIcon category={location.category} size={pinSize} color={color} />
      </div>
    </div>
  );
});
