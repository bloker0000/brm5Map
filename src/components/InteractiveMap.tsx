import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin } from './MapPin';
import { PlusIcon, MinusIcon, ResetPositionIcon, ResetRotationIcon } from './Icons';
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
  showPins?: boolean;
  onBgChange?: (index: number) => void;
  focusedLocations?: MapLocation[];
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 4;
const ZOOM_SENSITIVITY = 0.002;
const MAP_NORTH_OFFSET = 40;

const BG_IMAGES = [
  '/BG/BG1.jpeg',
  '/BG/BG2.png',
  '/BG/BG3.png',
  '/BG/BG4.png',
  '/BG/BG5.jpg',
  '/BG/BG6.png',
  '/BG/BG7.jpeg',
  '/BG/BG8.png',
  '/BG/BG9.png',
  '/BG/BG10.png',
  '/BG/BG11.png',
  '/BG/BG12.png',
  '/BG/BG13.png',
  '/BG/BG14.png',
  '/BG/BG15.png',
  '/BG/BG16.png',
];

export function InteractiveMap({
  locations,
  hoveredLocation,
  selectedLocation,
  onHover,
  onClick,
  onMapClick,
  highlightedLocation,
  isAdminMode = false,
  showPins = true,
  onBgChange,
  focusedLocations = [],
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mapRotation, setMapRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isCompassDragging, setIsCompassDragging] = useState(false);
  const [bgIndex] = useState(() => Math.floor(Math.random() * BG_IMAGES.length));
  const [isAnimating, setIsAnimating] = useState(false);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  
  const compassRotation = -MAP_NORTH_OFFSET + mapRotation;
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationStartRef = useRef({ angle: 0, startX: 0 });
  const transformRef = useRef(transform);
  
  useEffect(() => {
    onBgChange?.(bgIndex);
  }, [bgIndex, onBgChange]);
  
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

    const wiggleRoomY = Math.min(containerRect.width, containerRect.height) * 0.3;
    const wiggleRoomX = containerRect.width * 0.5;
    
    const minX = containerRect.width - scaledWidth - wiggleRoomX;
    const maxX = wiggleRoomX;
    const minY = containerRect.height - scaledHeight - wiggleRoomY;
    const maxY = wiggleRoomY;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

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

  const resetRotation = useCallback(() => {
    setMapRotation(0);
  }, []);

  useEffect(() => {
    if (imageLoaded) {
      centerMap();
      resetRotation();
    }
  }, [imageLoaded, centerMap, resetRotation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
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
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clampTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsRotating(true);
      rotationStartRef.current = { 
        angle: mapRotation, 
        startX: e.clientX 
      };
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    dragStartRef.current = { 
      x: e.clientX - transformRef.current.x, 
      y: e.clientY - transformRef.current.y 
    };
  }, [mapRotation]);

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

  useEffect(() => {
    if (!isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - rotationStartRef.current.startX;
      const newRotation = rotationStartRef.current.angle + deltaX * 0.15;
      setMapRotation(newRotation);
    };

    const handleMouseUp = () => {
      setIsRotating(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isRotating]);

  useEffect(() => {
    if (!isCompassDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const compass = compassRef.current;
      if (!compass) return;
      
      const rect = compass.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      setMapRotation(angle + 90 - MAP_NORTH_OFFSET);
    };

    const handleMouseUp = () => {
      setIsCompassDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isCompassDragging]);

  const handleCompassMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCompassDragging(true);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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

  const centerOnLocations = useCallback((locs: MapLocation[]) => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || locs.length === 0) return;

    const rect = container.getBoundingClientRect();
    const imgCenterX = image.naturalWidth / 2;
    const imgCenterY = image.naturalHeight / 2;
    const rad = (mapRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotatePoint = (px: number, py: number, scale: number) => {
      const dx = px - imgCenterX;
      const dy = py - imgCenterY;
      const rotatedX = dx * cos - dy * sin;
      const rotatedY = dx * sin + dy * cos;
      return {
        x: (imgCenterX + rotatedX) * scale,
        y: (imgCenterY + rotatedY) * scale,
      };
    };
    
    if (locs.length === 1) {
      const loc = locs[0];
      const newScale = 2;
      const rotated = rotatePoint(loc.x, loc.y, newScale);
      const x = rect.width / 2 - rotated.x;
      const y = rect.height / 2 - rotated.y;
      
      setIsAnimating(true);
      setTransform(clampTransform({ x, y, scale: newScale }));
      setTimeout(() => setIsAnimating(false), 500);
      return;
    }

    const minX = Math.min(...locs.map(l => l.x));
    const maxX = Math.max(...locs.map(l => l.x));
    const minY = Math.min(...locs.map(l => l.y));
    const maxY = Math.max(...locs.map(l => l.y));
    
    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    const locCenterX = (minX + maxX) / 2;
    const locCenterY = (minY + maxY) / 2;
    
    const padding = 100;
    const scaleX = (rect.width - padding * 2) / Math.max(boundingWidth, 1);
    const scaleY = (rect.height - padding * 2) / Math.max(boundingHeight, 1);
    const newScale = Math.min(Math.max(MIN_SCALE, Math.min(scaleX, scaleY)), 2);
    
    const rotated = rotatePoint(locCenterX, locCenterY, newScale);
    const x = rect.width / 2 - rotated.x;
    const y = rect.height / 2 - rotated.y;
    
    setIsAnimating(true);
    setTransform(clampTransform({ x, y, scale: newScale }));
    setTimeout(() => setIsAnimating(false), 500);
  }, [clampTransform, mapRotation]);

  useEffect(() => {
    if (highlightedLocation) {
      const timer = setTimeout(() => centerOnLocations([highlightedLocation]), 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedLocation, centerOnLocations]);

  useEffect(() => {
    if (focusedLocations.length > 0) {
      centerOnLocations(focusedLocations);
    }
  }, [focusedLocations, centerOnLocations]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const rect = content.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / transform.scale);
    const y = Math.round((e.clientY - rect.top) / transform.scale);
    
    setMouseCoords({ x, y });
  }, [transform.scale]);

  return (
    <div 
      className={`interactive-map ${isAdminMode ? 'admin-mode' : ''} ${isDragging ? 'dragging' : ''} ${isRotating ? 'rotating' : ''}`} 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onMouseMove={handleMouseMove}
    >
      <div 
        className="map-bg"
        style={{ backgroundImage: `url(${BG_IMAGES[bgIndex]})` }}
      />
      <div className="map-overlay" />
      
      <div 
        className={`map-content ${isAnimating ? 'animating' : ''}`}
        ref={contentRef}
        style={{
          transform: (() => {
            const img = imageRef.current;
            if (!img) return `translate(${transform.x}px, ${transform.y}px)`;
            const cx = (img.naturalWidth * transform.scale) / 2;
            const cy = (img.naturalHeight * transform.scale) / 2;
            return `translate(${transform.x + cx}px, ${transform.y + cy}px) rotate(${mapRotation}deg) translate(${-cx}px, ${-cy}px)`;
          })(),
          transformOrigin: '0 0',
        }}
        onClick={handleContentClick}
      >
        <img
          ref={imageRef}
          src="/Brm5Map.svg"
          alt="BRM5 Map"
          className="map-image"
          style={{
            width: imageRef.current ? `${imageRef.current.naturalWidth * transform.scale}px` : undefined,
            height: imageRef.current ? `${imageRef.current.naturalHeight * transform.scale}px` : undefined,
          }}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={() => setImageLoaded(true)}
        />
        {showPins && locations.map((location) => (
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
        <button onClick={centerMap} title="Reset Position">
          <ResetPositionIcon size={18} />
        </button>
        <button onClick={resetRotation} title="Reset Rotation">
          <ResetRotationIcon size={18} />
        </button>
      </div>

      <div 
        className="compass" 
        ref={compassRef}
        onMouseDown={handleCompassMouseDown}
      >
        <img
          src="/compass.png"
          alt="Compass"
          className="compass-image"
          style={{ transform: `rotate(${compassRotation}deg)` }}
          draggable={false}
        />
      </div>

      {isAdminMode && (
        <div className="admin-mode-indicator">
          Click on map to set coordinates
        </div>
      )}

      <div className="rotation-display">
        <span className="rotation-label">Rotation:</span>
        <span className="rotation-value">{(() => {
          let heading = ((-mapRotation + 40) % 360 + 360) % 360;
          return heading.toFixed(0);
        })()}</span>
      </div>

      <div className="coords-display">
        <span className="coords-label">Coords:</span>
        <span className="coords-value">{mouseCoords.x}, {mouseCoords.y}</span>
      </div>
    </div>
  );
}
