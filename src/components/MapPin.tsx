import { memo, useCallback, useRef } from 'react';
import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { getCategoryIconUri } from './iconUri';
import { pinScale } from './mapView';
import type { View } from './mapView';
import './MapPin.css';

interface MapPinProps {
  location: MapLocation;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (location: MapLocation | null) => void;
  onClick: (location: MapLocation) => void;
  viewRef: React.RefObject<View>;
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

export const MapPin = memo(function MapPin({ location, isHovered, isSelected, onHover, onClick, viewRef, isDraggable, onDrag }: MapPinProps) {
  const color = CATEGORY_COLORS[location.category];
  const iconSrc = getCategoryIconUri(location.category, color);
  const isDraggingRef = useRef(false);
  const pinRef = useRef<HTMLButtonElement>(null);

  // only a real mouse hovers. a tap fires enter too, and would leave the pin stuck
  const handlePointerEnter = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') onHover(location);
  }, [onHover, location]);
  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') onHover(null);
  }, [onHover]);
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;
    onClick(location);
  }, [onClick, location]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDraggable || !onDrag || !e.isPrimary || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = false;

    const { scale, rotation } = viewRef.current;
    const rotationRad = -rotation * Math.PI / 180;
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    const startX = e.clientX;
    const startY = e.clientY;
    const size = pinScale(scale);
    let final = { x: location.x, y: location.y };

    const pinEl = pinRef.current!;
    const pinRect = pinEl.getBoundingClientRect();
    const overlayRect = pinEl.parentElement!.getBoundingClientRect();
    const baseX = pinRect.left + pinRect.width / 2 - overlayRect.left;
    const baseY = pinRect.top + pinRect.height / 2 - overlayRect.top;
    pinEl.dataset.dragging = '';

    const handleMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!isDraggingRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        isDraggingRef.current = true;
      }
      if (!isDraggingRef.current) return;

      pinEl.style.transform = `translate(${baseX + dx}px, ${baseY + dy}px) translate(-50%, -50%) scale(${size})`;
      final = {
        x: Math.round(location.x + (dx * cos - dy * sin) / scale),
        y: Math.round(location.y + (dx * sin + dy * cos) / scale),
      };
    };

    const handleUp = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      document.body.style.userSelect = '';
      delete pinEl.dataset.dragging;
      if (isDraggingRef.current) {
        onDrag(location.id, final.x, final.y);
      }
      setTimeout(() => { isDraggingRef.current = false; }, 0);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    document.body.style.userSelect = 'none';
  }, [isDraggable, onDrag, location.id, location.x, location.y, viewRef]);

  return (
    <button
      ref={pinRef}
      type="button"
      className={`map-pin${isHovered ? ' hovered' : ''}${isSelected ? ' selected' : ''}${isDraggable ? ' draggable' : ''}`}
      aria-label={`${location.name}, ${location.category}`}
      data-x={location.x}
      data-y={location.y}
      style={{ '--pin-color': color } as React.CSSProperties}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      <span className="pin-icon">
        <img src={iconSrc} alt="" width={PIN_SIZE} height={PIN_SIZE} draggable={false} />
      </span>
    </button>
  );
}, pinPropsAreEqual);
