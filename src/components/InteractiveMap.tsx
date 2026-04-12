import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { MapPin } from './MapPin';
import { PlusIcon, MinusIcon, ResetPositionIcon, ResetRotationIcon, CategoryIcon } from './Icons';
import type { MapLocation, LocationCategory } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
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
  showCompass?: boolean;
  onBgChange?: (index: number) => void;
  focusedLocations?: MapLocation[];
  onPinDrag?: (locationId: string, x: number, y: number) => void;
  placeholderPin?: { x: number; y: number; category: LocationCategory } | null;
  isDragMode?: boolean;
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
  showCompass = true,
  onBgChange,
  focusedLocations = [],
  onPinDrag,
  placeholderPin,
  isDragMode = false,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const compassImageRef = useRef<HTMLImageElement>(null);
  const rotationDisplayRef = useRef<HTMLSpanElement>(null);
  
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mapRotation, setMapRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isCompassDragging, setIsCompassDragging] = useState(false);
  const [bgIndex] = useState(() => Math.floor(Math.random() * BG_IMAGES.length));
  const [isAnimating, setIsAnimating] = useState(false);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const pinsOverlayRef = useRef<HTMLDivElement>(null);

  const screenToMapCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const t = transformRef.current;
    const rot = mapRotationRef.current;
    const rotRad = rot * Math.PI / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);

    // Click relative to container
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Invert CSS transform: translate(cx,cy) rotate(rot) translate(-cx,-cy) translate(tx,ty)
    const p3x = clickX - cx;
    const p3y = clickY - cy;
    const p2x = p3x * cos + p3y * sin;
    const p2y = -p3x * sin + p3y * cos;
    const p1x = p2x + cx;
    const p1y = p2y + cy;
    const p0x = p1x - t.x;
    const p0y = p1y - t.y;

    return { x: Math.round(p0x / t.scale), y: Math.round(p0y / t.scale) };
  }, []);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationStartRef = useRef({ angle: 0, startX: 0 });
  const compassDragStartRef = useRef({ startAngle: 0, startRotation: 0 });
  const transformRef = useRef(transform);
  const mapRotationRef = useRef(mapRotation);
  const scaleRef = useRef(transform.scale);
  const isGesturingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  
  useEffect(() => {
    onBgChange?.(bgIndex);
  }, [bgIndex, onBgChange]);

  // Block pin clicks after a drag — capture phase fires before the pin's handler
  useEffect(() => {
    const overlay = pinsOverlayRef.current;
    if (!overlay) return;
    const blockClick = (e: MouseEvent) => {
      if (hasDraggedRef.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    overlay.addEventListener('click', blockClick, true);
    return () => overlay.removeEventListener('click', blockClick, true);
  }, []);
  
  // Sync refs from state only when no gesture is active
  if (!isGesturingRef.current) {
    transformRef.current = transform;
    scaleRef.current = transform.scale;
    mapRotationRef.current = mapRotation;
  }

  const clampTransform = useCallback((t: Transform, rotation: number = 0): Transform => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return t;

    const containerRect = container.getBoundingClientRect();
    const scaledWidth = image.naturalWidth * t.scale;
    const scaledHeight = image.naturalHeight * t.scale;

    let { x, y, scale } = t;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

    const rotationRad = Math.abs(rotation * Math.PI / 180);
    const rotationFactor = 1 + Math.abs(Math.sin(rotationRad)) * 0.5;
    
    const wiggleRoomY = Math.min(containerRect.width, containerRect.height) * 0.5 * rotationFactor;
    const wiggleRoomX = containerRect.width * 0.7 * rotationFactor;
    
    const minX = containerRect.width - scaledWidth - wiggleRoomX;
    const maxX = wiggleRoomX;
    const minY = containerRect.height - scaledHeight - wiggleRoomY;
    const maxY = wiggleRoomY;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    return { x, y, scale };
  }, []);

  const getTransformCSS = useCallback((t: Transform, rotation: number): string => {
    const container = containerRef.current;
    if (!container) return `translate(${t.x}px, ${t.y}px)`;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return `translate(${cx}px, ${cy}px) rotate(${rotation}deg) translate(${-cx}px, ${-cy}px) translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
  }, []);

  // Update all pin screen positions from current transform/rotation refs
  const updatePinPositions = useCallback(() => {
    const overlay = pinsOverlayRef.current;
    const container = containerRef.current;
    if (!overlay || !container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const t = transformRef.current;
    const rot = mapRotationRef.current;
    const rad = rot * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const children = overlay.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      if ('dragging' in el.dataset) continue;
      const mx = el.dataset.x;
      const my = el.dataset.y;
      if (mx == null || my == null) continue;

      const sx = +mx * t.scale + t.x;
      const sy = +my * t.scale + t.y;

      const dx = sx - cx;
      const dy = sy - cy;
      el.style.transform = `translate(${cx + dx * cos - dy * sin}px, ${cy + dx * sin + dy * cos}px) translate(-50%, -50%)`;
    }
  }, []);

  // Direct DOM update for rotation — bypasses React
  const applyRotationToDOM = useCallback((newRotation: number) => {
    mapRotationRef.current = newRotation;
    if (contentRef.current) {
      contentRef.current.style.transform = getTransformCSS(transformRef.current, newRotation);
    }
    if (compassImageRef.current) {
      compassImageRef.current.style.transform = `rotate(${-MAP_NORTH_OFFSET + newRotation}deg)`;
    }
    if (rotationDisplayRef.current) {
      const heading = ((-newRotation + 40) % 360 + 360) % 360;
      rotationDisplayRef.current.textContent = heading.toFixed(0);
    }
    updatePinPositions();
  }, [getTransformCSS, updatePinPositions]);

  // Direct DOM update for transform — bypasses React
  const applyTransformToDOM = useCallback((t: Transform) => {
    transformRef.current = t;
    scaleRef.current = t.scale;
    if (contentRef.current) {
      contentRef.current.style.transform = getTransformCSS(t, mapRotationRef.current);
    }
    updatePinPositions();
  }, [getTransformCSS, updatePinPositions]);

  // Sync DOM whenever React state changes (animations, reset, center-on-location)
  // Skip during active gestures — they write to DOM directly
  useLayoutEffect(() => {
    if (isGesturingRef.current) return;
    if (contentRef.current) {
      contentRef.current.style.transform = getTransformCSS(transform, mapRotation);
    }
    if (compassImageRef.current) {
      compassImageRef.current.style.transform = `rotate(${-MAP_NORTH_OFFSET + mapRotation}deg)`;
    }
    if (rotationDisplayRef.current) {
      const heading = ((-mapRotation + 40) % 360 + 360) % 360;
      rotationDisplayRef.current.textContent = heading.toFixed(0);
    }
    updatePinPositions();
  }, [transform, mapRotation, getTransformCSS, updatePinPositions]);

  // Position pins when the locations list changes (filter, clear, search)
  useLayoutEffect(() => {
    updatePinPositions();
  }, [locations, showPins, placeholderPin, updatePinPositions]);

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

    const newTransform = { x, y, scale };
    transformRef.current = newTransform;
    setTransform(newTransform);
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

    let wheelSyncTimeout: ReturnType<typeof setTimeout>;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      isGesturingRef.current = true;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const currentRotation = mapRotationRef.current;
      const rotationRad = -currentRotation * Math.PI / 180;
      
      const relX = mouseX - centerX;
      const relY = mouseY - centerY;
      const rotatedRelX = relX * Math.cos(rotationRad) - relY * Math.sin(rotationRad);
      const rotatedRelY = relX * Math.sin(rotationRad) + relY * Math.cos(rotationRad);
      const rotatedMouseX = rotatedRelX + centerX;
      const rotatedMouseY = rotatedRelY + centerY;

      const prev = transformRef.current;
      const zoomFactor = 1 - e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * zoomFactor));
      
      const scaleRatio = newScale / prev.scale;
      const newX = rotatedMouseX - (rotatedMouseX - prev.x) * scaleRatio;
      const newY = rotatedMouseY - (rotatedMouseY - prev.y) * scaleRatio;

      const newTransform = clampTransform({ x: newX, y: newY, scale: newScale }, currentRotation);
      applyTransformToDOM(newTransform);
      clearTimeout(wheelSyncTimeout);
      wheelSyncTimeout = setTimeout(() => {
        isGesturingRef.current = false;
        setTransform({ ...transformRef.current });
      }, 150);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelSyncTimeout);
    };
  }, [clampTransform, applyTransformToDOM]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      isGesturingRef.current = true;
      setIsRotating(true);
      rotationStartRef.current = { 
        angle: mapRotation, 
        startX: e.clientX 
      };
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    isGesturingRef.current = true;
    setIsDragging(true);
    setHasDragged(false);
    dragStartRef.current = { 
      x: e.clientX, 
      y: e.clientY 
    };
  }, [mapRotation]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const currentRotation = mapRotationRef.current;
      const rotationRad = -currentRotation * Math.PI / 180;
      const rotatedDeltaX = deltaX * Math.cos(rotationRad) - deltaY * Math.sin(rotationRad);
      const rotatedDeltaY = deltaX * Math.sin(rotationRad) + deltaY * Math.cos(rotationRad);
      
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setHasDragged(true);
        hasDraggedRef.current = true;
      }
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const newTransform = clampTransform({ 
        ...transformRef.current, 
        x: transformRef.current.x + rotatedDeltaX, 
        y: transformRef.current.y + rotatedDeltaY 
      }, currentRotation);
      transformRef.current = newTransform;

      if (contentRef.current) {
        contentRef.current.style.transform = getTransformCSS(newTransform, currentRotation);
      }
      updatePinPositions();
    };

    const handleMouseUp = () => {
      isGesturingRef.current = false;
      setIsDragging(false);
      setTransform({ ...transformRef.current });
      // Reset drag ref after click event fires
      setTimeout(() => { hasDraggedRef.current = false; }, 0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, clampTransform, getTransformCSS, updatePinPositions]);

  useEffect(() => {
    if (!isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - rotationStartRef.current.startX;
      const newRotation = rotationStartRef.current.angle + deltaX * 0.15;
      applyRotationToDOM(newRotation);
    };

    const handleMouseUp = () => {
      isGesturingRef.current = false;
      setMapRotation(mapRotationRef.current);
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
  }, [isRotating, applyRotationToDOM]);

  useEffect(() => {
    if (!isCompassDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const compass = compassRef.current;
      if (!compass) return;
      
      const rect = compass.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const angleDelta = currentAngle - compassDragStartRef.current.startAngle;
      applyRotationToDOM(compassDragStartRef.current.startRotation + angleDelta);
    };

    const handleMouseUp = () => {
      isGesturingRef.current = false;
      setMapRotation(mapRotationRef.current);
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
  }, [isCompassDragging, applyRotationToDOM]);

  const handleCompassMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    
    const compass = compassRef.current;
    if (!compass) return;
    
    const rect = compass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    compassDragStartRef.current = { startAngle, startRotation: mapRotation };
    isGesturingRef.current = true;
    setIsCompassDragging(true);
  }, [mapRotation]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (hasDragged) return;
    const coords = screenToMapCoords(e.clientX, e.clientY);
    onMapClick(coords.x, coords.y);
  }, [hasDragged, onMapClick, screenToMapCoords]);

  const handleZoomIn = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const prev = transformRef.current;
    const newScale = Math.min(MAX_SCALE, prev.scale * 1.3);
    const scaleRatio = newScale / prev.scale;
    const newX = centerX - (centerX - prev.x) * scaleRatio;
    const newY = centerY - (centerY - prev.y) * scaleRatio;

    const newTransform = clampTransform({ x: newX, y: newY, scale: newScale });
    transformRef.current = newTransform;
    setTransform(newTransform);
  }, [clampTransform]);

  const handleZoomOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const prev = transformRef.current;
    const newScale = Math.max(MIN_SCALE, prev.scale / 1.3);
    const scaleRatio = newScale / prev.scale;
    const newX = centerX - (centerX - prev.x) * scaleRatio;
    const newY = centerY - (centerY - prev.y) * scaleRatio;

    const newTransform = clampTransform({ x: newX, y: newY, scale: newScale });
    transformRef.current = newTransform;
    setTransform(newTransform);
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
      
      const newT = clampTransform({ x, y, scale: newScale });
      transformRef.current = newT;
      setIsAnimating(true);
      setTransform(newT);
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
    
    const newT = clampTransform({ x, y, scale: newScale });
    transformRef.current = newT;
    setIsAnimating(true);
    setTransform(newT);
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
    const coords = screenToMapCoords(e.clientX, e.clientY);
    if (coordsRef.current) {
      coordsRef.current.textContent = `${coords.x}, ${coords.y}`;
    }
  }, [screenToMapCoords]);

  return (
    <div 
      className={`interactive-map ${isAdminMode ? 'admin-mode' : ''} ${isDragging ? 'dragging' : ''} ${isRotating || isCompassDragging ? 'rotating' : ''}`} 
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
        style={{ transformOrigin: '0 0' }}
        onClick={handleContentClick}
      >
        <img
          ref={imageRef}
          src="/Brm5Map.svg"
          alt="BRM5 Map"
          className="map-image"
          width={3524}
          height={2500}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      <div className="pins-overlay" ref={pinsOverlayRef}>
        {showPins && placeholderPin && (
          <div
            className="map-pin placeholder"
            data-x={placeholderPin.x}
            data-y={placeholderPin.y}
            style={{ '--pin-color': CATEGORY_COLORS[placeholderPin.category] } as React.CSSProperties}
          >
            <div className="placeholder-rings">
              <span className="placeholder-ring" />
              <span className="placeholder-ring" />
              <span className="placeholder-ring" />
            </div>
            <div className="pin-icon">
              <CategoryIcon category={placeholderPin.category} size={20} color={CATEGORY_COLORS[placeholderPin.category]} />
            </div>
          </div>
        )}
        {showPins && locations.map((location) => (
          <MapPin
            key={location.id}
            location={location}
            isHovered={hoveredLocation?.id === location.id}
            isSelected={selectedLocation?.id === location.id}
            onHover={onHover}
            onClick={onClick}
            scaleRef={scaleRef}
            rotationRef={mapRotationRef}
            isDraggable={isDragMode}
            onDrag={onPinDrag}
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
        className={`compass${showCompass ? '' : ' hidden'}`}
        ref={compassRef}
        onMouseDown={handleCompassMouseDown}
      >
        <img
          ref={compassImageRef}
          src="/compass.svg"
          alt="Compass"
          className="compass-image"
          draggable={false}
        />
      </div>

      <div className="rotation-display">
        <span className="rotation-label">Rotation:</span>
        <span className="rotation-value" ref={rotationDisplayRef}>0</span>
      </div>

      <div className="coords-display">
        <span className="coords-label">Coords:</span>
        <span className="coords-value" ref={coordsRef}>0, 0</span>
      </div>
    </div>
  );
}
