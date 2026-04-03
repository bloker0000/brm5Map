import { memo, useCallback, useRef } from 'react';
import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { getCategoryIconUri } from './Icons';
import './MapPin.css';

interface MapPinProps {
  location: MapLocation;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (location: MapLocation | null) => void;
  onClick: (location: MapLocation) => void;
  scaleRef: React.RefObject<number>;
  rotationRef: React.RefObject<number>;
  isDraggable?: boolean;
  onDrag?: (locationId: string, x: number, y: number) => void;
}

function pinPropsAreEqual(prev: MapPinProps, next: MapPinProps) {
  return prev.location === next.location
    && prev.isHovered === next.isHovered
    && prev.isSelected === next.isSelected
    && prev.onHover === next.onHover
    && prev.onClick === next.onClick
    && prev.isDraggable === next.isDraggable
    && prev.onDrag === next.onDrag;
}

const PIN_SIZE = 25;

export const MapPin = memo(function MapPin({ location, isHovered, isSelected, onHover, onClick, scaleRef, rotationRef, isDraggable, onDrag }: MapPinProps) {
  const color = CATEGORY_COLORS[location.category];
  const iconSrc = getCategoryIconUri(location.category, color);
  const isDraggingRef = useRef(false);
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
    finalPosRef.current = { x: location.x, y: location.y };

    const scale = scaleRef.current;
    const rotation = rotationRef.current;
    const rotationRad = -rotation * Math.PI / 180;
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const pinEl = pinRef.current!;
    const pinRect = pinEl.getBoundingClientRect();
    const overlayRect = pinEl.parentElement!.getBoundingClientRect();
    const baseX = pinRect.left + pinRect.width / 2 - overlayRect.left;
    const baseY = pinRect.top + pinRect.height / 2 - overlayRect.top;
    pinEl.dataset.dragging = '';

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;
      if (!isDraggingRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        isDraggingRef.current = true;
      }
      if (!isDraggingRef.current) return;

      pinEl.style.transform = `translate(${baseX + dx}px, ${baseY + dy}px) translate(-50%, -50%)`;

      const rotatedDx = (dx * cos - dy * sin) / scale;
      const rotatedDy = (dx * sin + dy * cos) / scale;
      finalPosRef.current = {
        x: Math.round(location.x + rotatedDx),
        y: Math.round(location.y + rotatedDy),
      };
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      delete pinEl.dataset.dragging;
      if (isDraggingRef.current) {
        onDrag(location.id, finalPosRef.current.x, finalPosRef.current.y);
      }
      setTimeout(() => { isDraggingRef.current = false; }, 0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
  }, [isDraggable, onDrag, location.id, location.x, location.y, scaleRef, rotationRef]);

  return (
    <div
      ref={pinRef}
      className={`map-pin ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''} ${isDraggable ? 'draggable' : ''}`}
      data-x={location.x}
      data-y={location.y}
      style={{ '--pin-color': color } as React.CSSProperties}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="pin-icon">
        <img src={iconSrc} alt="" width={PIN_SIZE} height={PIN_SIZE} draggable={false} />
      </div>
    </div>
  );
}, pinPropsAreEqual);
