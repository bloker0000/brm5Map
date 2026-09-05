import { useState, useEffect, useCallback, useRef } from 'react';
import type { LocationImage } from '../types/location';
import './ImageLightbox.css';

interface ImageLightboxProps {
  images: LocationImage[];
  initialIndex: number;
  onClose: () => void;
  locationName?: string;
}

export function ImageLightbox({ images, initialIndex, onClose, locationName }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isClosing, setIsClosing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const requestClose = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(onClose, 170);
  }, [onClose]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetView();
    setIsLoading(true);
  }, [images.length, resetView]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetView();
    setIsLoading(true);
  }, [images.length, resetView]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev / 1.5, 1);
      if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }, [zoom, pan]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + deltaX,
        y: dragStartRef.current.panY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          resetView();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [requestClose, hasMultiple, goToPrev, goToNext, handleZoomIn, handleZoomOut, resetView]);

  useEffect(() => {
    const thumbnail = thumbnailRefs.current[currentIndex];
    if (thumbnail && thumbnailsContainerRef.current) {
      thumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  const handleImageDoubleClick = useCallback(() => {
    if (zoom > 1) {
      resetView();
    } else {
      setZoom(2);
    }
  }, [zoom, resetView]);

  return (
    <div className={`lightbox-overlay brm-scrim${isClosing ? ' closing' : ''}`} onClick={requestClose}>
      <div className="lightbox-container brm-panel-anim" onClick={(e) => e.stopPropagation()}>
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
          className={`lightbox-image-container ${isDragging ? 'dragging' : ''} ${zoom > 1 ? 'zoomed' : ''}`}
          onWheel={handleWheel}
        >
          {isLoading && (
          <div className="lightbox-loader brm-loader">
            <span className="brm-loader-label">Loading</span>
            <span className="brm-loader-track" />
          </div>
          )}
          <img
            ref={imageRef}
            src={currentImage.url}
            alt={currentImage.description || locationName || 'Image'}
            className="lightbox-image"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              opacity: isLoading ? 0 : 1,
            }}
            onLoad={() => setIsLoading(false)}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleImageDoubleClick}
            draggable={false}
          />

          {hasMultiple && (
            <>
              <button className="lightbox-nav lightbox-prev" onClick={goToPrev}>
                <ChevronIcon direction="left" />
              </button>
              <button className="lightbox-nav lightbox-next" onClick={goToNext}>
                <ChevronIcon direction="right" />
              </button>
            </>
          )}
        </div>

        <div className="lightbox-controls">
          <div className="lightbox-zoom-controls">
            <button onClick={handleZoomOut} disabled={zoom <= 1} title="Zoom Out (-)">
              <MinusIcon />
            </button>
            <span className="lightbox-zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} disabled={zoom >= 5} title="Zoom In (+)">
              <PlusIcon />
            </button>
            <button onClick={resetView} disabled={zoom === 1} title="Reset View (0)">
              <ResetIcon />
            </button>
          </div>

          {hasMultiple && (
            <div className="lightbox-thumbnails" ref={thumbnailsContainerRef}>
              {images.map((img, index) => (
                <button
                  key={index}
                  ref={(el) => { thumbnailRefs.current[index] = el; }}
                  className={`lightbox-thumbnail ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentIndex(index);
                    resetView();
                    setIsLoading(true);
                  }}
                >
                  <img src={img.thumb ?? img.url} alt={img.description || `Thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="lightbox-close" onClick={requestClose} title="Close (Esc)">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {direction === 'left' ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 6 15 12 9 18" />
      )}
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
