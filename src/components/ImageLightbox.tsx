import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import type { LocationImage } from '../types/location';
import { ChevronIcon, CloseIcon, MinusIcon, PlusIcon, ResetPositionIcon } from './Icons';
import { useDialog } from '../hooks/useDialog';
import './ImageLightbox.css';

interface ImageLightboxProps {
  images: LocationImage[];
  initialIndex: number;
  onClose: () => void;
  locationName?: string;
}

interface Point {
  x: number;
  y: number;
}

const MAX_ZOOM = 5;
const STEP_ZOOM = 1.5;
const WHEEL_ZOOM = 0.0025;
const PINCH_WHEEL_ZOOM = 0.01;
const SWIPE = 50;
const DOUBLE_TAP_MS = 300;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ImageLightbox({ images, initialIndex, onClose, locationName }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isClosing, setIsClosing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [swipeX, setSwipeX] = useState(0);
  const [isGesturing, setIsGesturing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const viewRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  const swipeRef = useRef(0);
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<{ start: Point; moved: boolean } | null>(null);
  const lastTapRef = useRef(0);
  const lastPointerRef = useRef('mouse');

  useDialog(dialogRef, !isClosing);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const requestClose = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(onClose, 170);
  }, [onClose]);

  const setView = useCallback((nextZoom: number, nextPan: Point) => {
    const z = clamp(nextZoom, 1, MAX_ZOOM);
    let p = { x: 0, y: 0 };
    const img = imageRef.current;
    const stage = stageRef.current;
    if (z > 1 && img && stage) {
      // the picture can be dragged until its edge reaches the edge of the screen
      const maxX = Math.max(0, (img.offsetWidth * z - stage.clientWidth) / 2);
      const maxY = Math.max(0, (img.offsetHeight * z - stage.clientHeight) / 2);
      p = { x: clamp(nextPan.x, -maxX, maxX), y: clamp(nextPan.y, -maxY, maxY) };
    }
    viewRef.current = { zoom: z, pan: p };
    setZoom(z);
    setPan(p);
  }, []);

  // zooms by `factor` while the point of the picture under `at` stays put
  const zoomAt = useCallback((factor: number, at?: Point) => {
    const { zoom: z, pan: p } = viewRef.current;
    const next = clamp(z * factor, 1, MAX_ZOOM);
    let m = { x: 0, y: 0 };
    const stage = stageRef.current;
    if (at && stage) {
      const rect = stage.getBoundingClientRect();
      m = { x: at.x - (rect.left + rect.width / 2), y: at.y - (rect.top + rect.height / 2) };
    }
    const ratio = next / z;
    setView(next, { x: m.x - (m.x - p.x) * ratio, y: m.y - (m.y - p.y) * ratio });
  }, [setView]);

  const resetView = useCallback(() => setView(1, { x: 0, y: 0 }), [setView]);

  const toggleZoom = useCallback((at: Point) => {
    if (viewRef.current.zoom > 1) resetView();
    else zoomAt(2, at);
  }, [resetView, zoomAt]);

  const showImage = useCallback((index: number) => {
    resetView();
    swipeRef.current = 0;
    setSwipeX(0);
    if (index === currentIndex) return;
    setCurrentIndex(index);
    setIsLoading(true);
  }, [resetView, currentIndex]);

  const goToNext = useCallback(() => {
    showImage((currentIndex + 1) % images.length);
  }, [showImage, currentIndex, images.length]);

  const goToPrev = useCallback(() => {
    showImage((currentIndex - 1 + images.length) % images.length);
  }, [showImage, currentIndex, images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          // the lightbox is the topmost layer, so it eats escape rather than
          // letting whatever opened it close at the same time
          e.stopPropagation();
          requestClose();
          break;
        case 'ArrowLeft':
          if (hasMultiple) goToPrev();
          break;
        case 'ArrowRight':
          if (hasMultiple) goToNext();
          break;
        case '+':
        case '=':
          zoomAt(STEP_ZOOM);
          break;
        case '-':
          zoomAt(1 / STEP_ZOOM);
          break;
        case '0':
          resetView();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [requestClose, hasMultiple, goToPrev, goToNext, zoomAt, resetView]);

  useEffect(() => {
    const thumbnail = thumbnailRefs.current[currentIndex];
    if (thumbnail) {
      thumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  // the pointer handlers below are attached once, so they read the latest of these
  const actionsRef = useRef({ setView, zoomAt, toggleZoom, goToNext, goToPrev, hasMultiple });
  useLayoutEffect(() => {
    actionsRef.current = { setView, zoomAt, toggleZoom, goToNext, goToPrev, hasMultiple };
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointers = pointersRef.current;

    const handleDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest('button')) return;
      lastPointerRef.current = e.pointerType;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        gestureRef.current = { start: { x: e.clientX, y: e.clientY }, moved: false };
      } else if (gestureRef.current) {
        gestureRef.current.moved = true;
      }
      setIsGesturing(true);
    };

    const handleMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      const gesture = gestureRef.current;
      if (!prev || !gesture) return;
      const point = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, point);
      const { setView, hasMultiple } = actionsRef.current;
      const { zoom: z, pan: p } = viewRef.current;

      if (pointers.size === 1) {
        if (!gesture.moved && Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) < 4) return;
        gesture.moved = true;
        if (z > 1) {
          setView(z, { x: p.x + point.x - prev.x, y: p.y + point.y - prev.y });
        } else if (hasMultiple) {
          swipeRef.current = point.x - gesture.start.x;
          setSwipeX(swipeRef.current);
        }
        return;
      }

      let other: Point | undefined;
      for (const [id, q] of pointers) {
        if (id !== e.pointerId) {
          other = q;
          break;
        }
      }
      if (!other) return;
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(point.x - other.x, point.y - other.y);
      if (before < 1) return;

      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const from = { x: (prev.x + other.x) / 2 - cx, y: (prev.y + other.y) / 2 - cy };
      const to = { x: (point.x + other.x) / 2 - cx, y: (point.y + other.y) / 2 - cy };
      const next = clamp(z * after / before, 1, MAX_ZOOM);
      const ratio = next / z;
      swipeRef.current = 0;
      setSwipeX(0);
      setView(next, { x: to.x - (from.x - p.x) * ratio, y: to.y - (from.y - p.y) * ratio });
    };

    const handleUp = (e: PointerEvent) => {
      const last = pointers.get(e.pointerId);
      if (!last) return;
      pointers.delete(e.pointerId);
      if (pointers.size > 0) {
        // carries on dragging with the finger that is left
        const [rest] = pointers.values();
        gestureRef.current = { start: rest, moved: true };
        return;
      }

      const gesture = gestureRef.current;
      gestureRef.current = null;
      setIsGesturing(false);
      const { goToNext, goToPrev, toggleZoom } = actionsRef.current;

      const swipe = swipeRef.current;
      if (swipe !== 0) {
        swipeRef.current = 0;
        setSwipeX(0);
        if (swipe <= -SWIPE) goToNext();
        else if (swipe >= SWIPE) goToPrev();
      }

      if (gesture && !gesture.moved && e.pointerType !== 'mouse' && e.type === 'pointerup') {
        const now = performance.now();
        if (now - lastTapRef.current < DOUBLE_TAP_MS) {
          lastTapRef.current = 0;
          toggleZoom(last);
        } else {
          lastTapRef.current = now;
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stage.clientHeight : 1;
      const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? PINCH_WHEEL_ZOOM : WHEEL_ZOOM));
      actionsRef.current.zoomAt(factor, { x: e.clientX, y: e.clientY });
    };

    stage.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    stage.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      stage.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      stage.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleDoubleClick = (e: React.MouseEvent) => {
    // a double tap is handled above, and some browsers follow it with a dblclick
    if (lastPointerRef.current !== 'mouse') return;
    toggleZoom({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className={`lightbox-overlay brm-scrim${isClosing ? ' closing' : ''}`} onClick={requestClose}>
      <div
        ref={dialogRef}
        className="lightbox-container brm-panel-anim"
        role="dialog"
        aria-modal="true"
        aria-label={locationName ? `${locationName} images` : 'Images'}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightbox-header">
          <div className="lightbox-title">
            {locationName && <span className="lightbox-location">{locationName}</span>}
            {currentImage.description && (
              <span className="lightbox-description">{currentImage.description}</span>
            )}
          </div>
          <div className="lightbox-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        <div
          ref={stageRef}
          className={`lightbox-image-container${zoom > 1 ? ' zoomed' : ''}${isGesturing ? ' dragging' : ''}`}
        >
          {isLoading && (
            <div className="lightbox-loader brm-loader">
              <span className="brm-loader-label">Loading</span>
              <span className="brm-loader-track" />
            </div>
          )}
          <img
            key={currentIndex}
            ref={imageRef}
            src={currentImage.url}
            alt={currentImage.description || locationName || 'Image'}
            className="lightbox-image"
            style={{
              transform: `translate(${pan.x + swipeX}px, ${pan.y}px) scale(${zoom})`,
              opacity: isLoading ? 0 : 1,
            }}
            onLoad={() => setIsLoading(false)}
            onDoubleClick={handleDoubleClick}
            draggable={false}
          />

          {hasMultiple && (
            <>
              <button className="lightbox-nav lightbox-prev" onClick={goToPrev} aria-label="Previous image">
                <ChevronIcon direction="left" size={32} />
              </button>
              <button className="lightbox-nav lightbox-next" onClick={goToNext} aria-label="Next image">
                <ChevronIcon direction="right" size={32} />
              </button>
            </>
          )}
        </div>

        <div className="lightbox-controls">
          <div className="lightbox-zoom-controls">
            <button onClick={() => zoomAt(1 / STEP_ZOOM)} disabled={zoom <= 1} title="Zoom Out (-)" aria-label="Zoom out">
              <MinusIcon size={20} />
            </button>
            <span className="lightbox-zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={() => zoomAt(STEP_ZOOM)} disabled={zoom >= MAX_ZOOM} title="Zoom In (+)" aria-label="Zoom in">
              <PlusIcon size={20} />
            </button>
            <button onClick={resetView} disabled={zoom === 1} title="Reset View (0)" aria-label="Reset zoom">
              <ResetPositionIcon size={20} />
            </button>
          </div>

          {hasMultiple && (
            <div className="lightbox-thumbnails">
              {images.map((img, index) => (
                <button
                  key={index}
                  ref={(el) => { thumbnailRefs.current[index] = el; }}
                  className={`lightbox-thumbnail ${index === currentIndex ? 'active' : ''}`}
                  aria-current={index === currentIndex}
                  onClick={() => showImage(index)}
                >
                  <img src={img.thumb ?? img.url} alt={img.description || `Thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="lightbox-close" onClick={requestClose} title="Close (Esc)" aria-label="Close">
          <CloseIcon size={24} />
        </button>
      </div>
    </div>
  );
}
