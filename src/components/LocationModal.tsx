import { useState, useEffect, useRef, useId, lazy, Suspense } from 'react';
import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon, CloseIcon, ChevronIcon, ExpandIcon } from './Icons';
import { missionsAt } from '../data/location-missions';
import { ImageLightbox } from './ImageLightbox';
import { useExitTransition } from '../hooks/useExitTransition';
import { useDialog } from '../hooks/useDialog';
import { loadMarkdown } from './markdownLoader';
import './LocationModal.css';

const Markdown = lazy(loadMarkdown);

// how far a finger has to travel sideways before it counts as a swipe
const SWIPE = 40;

interface LocationModalProps {
  location: MapLocation | null;
  onClose: () => void;
}

export function LocationModal({ location, onClose }: LocationModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({});
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const titleId = useId();

  const { rendered: shown, isClosing } = useExitTransition(location, 170);
  useDialog(dialogRef, shown !== null && !isClosing);

  const [trackedId, setTrackedId] = useState(shown?.id);
  if (shown?.id !== trackedId) {
    setTrackedId(shown?.id);
    setCurrentImageIndex(0);
    setImageLoadStates({});
  }

  useEffect(() => {
    const thumbnail = thumbnailRefs.current[currentImageIndex];
    if (thumbnail) {
      thumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentImageIndex]);

  if (!shown) return null;

  const color = CATEGORY_COLORS[shown.category];
  const images = shown.images ?? [];
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;
  const safeIndex = Math.min(currentImageIndex, images.length - 1);
  const currentImage = hasImages ? images[Math.max(0, safeIndex)] : null;
  const missions = missionsAt(shown.id);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageLoad = (index: number) => {
    setImageLoadStates(prev => (prev[index] ? prev : { ...prev, [index]: true }));
  };

  const handleSwipeStart = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    swipeRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    swipedRef.current = false;
  };

  const handleSwipeEnd = (e: React.PointerEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.id !== e.pointerId || !hasMultipleImages) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swipedRef.current = true;
      if (dx < 0) handleNextImage();
      else handlePrevImage();
    }
  };

  const openLightbox = () => {
    // a mouse swipe still ends in a click, which should not open the viewer
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    setLightboxOpen(true);
  };

  return (
    <>
      <div
        className={`modal-overlay brm-scrim${isClosing ? ' closing' : ''}`}
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          className="modal brm-panel-anim"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          style={{ '--modal-color': color } as React.CSSProperties}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
          </button>

          <div className="modal-header">
            <div className="modal-header-top">
              <div className="modal-icon">
                <CategoryIcon category={shown.category} size={28} color={color} />
              </div>
              <h2 className="modal-title" id={titleId}>{shown.name}</h2>
            </div>
            <div className="modal-category">{shown.category}</div>
          </div>

          {hasImages && currentImage && (
            <div className="modal-gallery">
              <div
                className="modal-image"
                onClick={openLightbox}
                onPointerDown={handleSwipeStart}
                onPointerUp={handleSwipeEnd}
                onPointerCancel={() => { swipeRef.current = null; }}
              >
                <div className={`modal-image-loader brm-loader ${imageLoadStates[safeIndex] ? 'hidden' : ''}`}>
                  <span className="brm-loader-label">Loading</span>
                  <span className="brm-loader-track" />
                </div>
                <img
                  key={currentImage.url}
                  src={currentImage.url}
                  alt={currentImage.description || shown.name}
                  draggable={false}
                  ref={(el) => { if (el?.complete) handleImageLoad(safeIndex); }}
                  onLoad={() => handleImageLoad(safeIndex)}
                  style={{ opacity: imageLoadStates[safeIndex] ? 1 : 0 }}
                />
                <div className="modal-image-zoom-hint">
                  <ExpandIcon />
                  <span>Click to enlarge</span>
                </div>
                {hasMultipleImages && (
                  <>
                    <button
                      className="gallery-nav gallery-prev"
                      aria-label="Previous image"
                      onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    >
                      <ChevronIcon direction="left" />
                    </button>
                    <button
                      className="gallery-nav gallery-next"
                      aria-label="Next image"
                      onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    >
                      <ChevronIcon direction="right" />
                    </button>
                  </>
                )}
              </div>
              {currentImage.description && (
                <div className="modal-image-description">{currentImage.description}</div>
              )}
              {hasMultipleImages && (
                <div className="modal-gallery-thumbnails">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      ref={(el) => { thumbnailRefs.current[index] = el; }}
                      className={`modal-thumbnail ${index === safeIndex ? 'active' : ''}`}
                      aria-current={index === safeIndex}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={img.thumb ?? img.url} alt={img.description || `Image ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="modal-description">
            <Suspense
              fallback={
                <div className="modal-description-loading brm-loader">
                  <span className="brm-loader-track" />
                </div>
              }
            >
              <Markdown>{shown.description}</Markdown>
            </Suspense>
          </div>

          {missions.length > 0 && (
            <div className="modal-missions">
              <div className="modal-missions-label">
                {missions.length === 1 ? 'Mission here' : 'Missions here'}
              </div>
              {missions.map((mission) => (
                <a key={mission.id} className="modal-mission" href={`#/missions/${mission.id}`}>
                  <span className="modal-mission-name">{mission.name}</span>
                  <ChevronIcon direction="right" />
                </a>
              ))}
            </div>
          )}

          <div className="modal-coords">
            <span className="modal-coords-label">Coordinates</span>
            <span className="modal-coords-value">
              X: {shown.x} | Y: {shown.y}
            </span>
          </div>
        </div>
      </div>

      {lightboxOpen && hasImages && (
        <ImageLightbox
          images={images}
          initialIndex={safeIndex}
          onClose={() => setLightboxOpen(false)}
          locationName={shown.name}
        />
      )}
    </>
  );
}
