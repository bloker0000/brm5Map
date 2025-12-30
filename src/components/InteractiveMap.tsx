import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin } from './MapPin';
import { PlusIcon, MinusIcon, ResetIcon } from './Icons';
import type { MapLocation } from '../types/location';
import './InteractiveMap.css';

interface InteractiveMapProps {
  locations: MapLocation[];
  hoveredLocation: MapLocation | null;
  selectedLocation: MapLocation | null;
  onHover: (location: MapLocation | null) => void;
  onClick: (location: MapLocation) => void;
  onMapClick: (x: number, y: number) => void;
  highlightedLocation: MapLocation | null;
  isAdminMode?: boolean;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 4;
const ZOOM_SENSITIVITY = 0.002;

export function InteractiveMap({
  locations,
  hoveredLocation,
  selectedLocation,
  onHover,
  onClick,
  onMapClick,
  highlightedLocation,
  isAdminMode = false,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const clampTransform = useCallback((t: Transform): Transform => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return t;

    const containerRect = container.getBoundingClientRect();
    const scaledWidth = image.naturalWidth * t.scale;
    const scaledHeight = image.naturalHeight * t.scale;

    let { x, y, scale } = t;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

    const minX = containerRect.width - scaledWidth;
    const minY = containerRect.height - scaledHeight;

    if (scaledWidth < containerRect.width) {
      x = (containerRect.width - scaledWidth) / 2;
    } else {
      x = Math.max(minX, Math.min(0, x));
    }

    if (scaledHeight < containerRect.height) {
      y = (containerRect.height - scaledHeight) / 2;
    } else {
      y = Math.max(minY, Math.min(0, y));
    }

    return { x, y, scale };
  }, []);

  const centerMap = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || !image.naturalWidth) return;

    const containerRect = container.getBoundingClientRect();
    const scale = Math.min(
      containerRect.width / image.naturalWidth,
      containerRect.height / image.naturalHeight
    ) * 0.9;

    const x = (containerRect.width - image.naturalWidth * scale) / 2;
    const y = (containerRect.height - image.naturalHeight * scale) / 2;

    setTransform({ x, y, scale });
  }, []);

  useEffect(() => {
    if (imageLoaded) {
      centerMap();
    }
  }, [imageLoaded, centerMap]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform(prev => {
      const zoomFactor = 1 - e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * zoomFactor));
      
      const scaleRatio = newScale / prev.scale;
      const newX = mouseX - (mouseX - prev.x) * scaleRatio;
      const newY = mouseY - (mouseY - prev.y) * scaleRatio;

      return clampTransform({ x: newX, y: newY, scale: newScale });
    });
  }, [clampTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    dragStartRef.current = { 
      x: e.clientX - transformRef.current.x, 
      y: e.clientY - transformRef.current.y 
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      const deltaX = Math.abs(newX - transformRef.current.x);
      const deltaY = Math.abs(newY - transformRef.current.y);
      if (deltaX > 3 || deltaY > 3) {
        setHasDragged(true);
      }

      setTransform(prev => clampTransform({ ...prev, x: newX, y: newY }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, clampTransform]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (hasDragged) return;
    
    const content = contentRef.current;
    if (!content) return;

    const rect = content.getBoundingClientRect();
    const x = (e.clientX - rect.left) / transform.scale;
    const y = (e.clientY - rect.top) / transform.scale;

    onMapClick(Math.round(x), Math.round(y));
  }, [hasDragged, transform.scale, onMapClick]);

  const handleZoomIn = useCallback(() => {
    setTransform(prev => {
      const container = containerRef.current;
      if (!container) return prev;
      
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const newScale = Math.min(MAX_SCALE, prev.scale * 1.3);
      const scaleRatio = newScale / prev.scale;
      const newX = centerX - (centerX - prev.x) * scaleRatio;
      const newY = centerY - (centerY - prev.y) * scaleRatio;

      return clampTransform({ x: newX, y: newY, scale: newScale });
    });
  }, [clampTransform]);

  const handleZoomOut = useCallback(() => {
    setTransform(prev => {
      const container = containerRef.current;
      if (!container) return prev;
      
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const newScale = Math.max(MIN_SCALE, prev.scale / 1.3);
      const scaleRatio = newScale / prev.scale;
      const newX = centerX - (centerX - prev.x) * scaleRatio;
      const newY = centerY - (centerY - prev.y) * scaleRatio;

      return clampTransform({ x: newX, y: newY, scale: newScale });
    });
  }, [clampTransform]);

  const centerOnLocation = useCallback((location: MapLocation) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newScale = 2;
    const x = rect.width / 2 - location.x * newScale;
    const y = rect.height / 2 - location.y * newScale;

    setTransform(clampTransform({ x, y, scale: newScale }));
  }, [clampTransform]);

  useEffect(() => {
    if (highlightedLocation) {
      const timer = setTimeout(() => centerOnLocation(highlightedLocation), 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedLocation, centerOnLocation]);

  return (
    <div 
      className={`interactive-map ${isAdminMode ? 'admin-mode' : ''} ${isDragging ? 'dragging' : ''}`} 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="map-content"
        ref={contentRef}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
        onClick={handleContentClick}
      >
        <img
          ref={imageRef}
          src="/Brm5Map.svg"
          alt="BRM5 Map"
          className="map-image"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={() => setImageLoaded(true)}
        />
        {locations.map((location) => (
          <MapPin
            key={location.id}
            location={location}
            isHovered={hoveredLocation?.id === location.id}
            isSelected={selectedLocation?.id === location.id}
            onHover={onHover}
            onClick={onClick}
            scale={transform.scale}
          />
        ))}
      </div>

      <div className="zoom-controls">
        <button onClick={handleZoomIn} title="Zoom In">
          <PlusIcon size={18} />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out">
          <MinusIcon size={18} />
        </button>
        <button onClick={centerMap} title="Reset View">
          <ResetIcon size={18} />
        </button>
      </div>

      {isAdminMode && (
        <div className="admin-mode-indicator">
          Click on map to set coordinates
        </div>
      )}
    </div>
  );
}
