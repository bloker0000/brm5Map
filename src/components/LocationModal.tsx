import { useState, useEffect } from 'react';
import type { MapLocation, LocationImage } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon, CloseIcon } from './Icons';
import { ImageLightbox } from './ImageLightbox';
import './LocationModal.css';

interface LocationModalProps {
  location: MapLocation | null;
  onClose: () => void;
}

function getAllImages(location: MapLocation): LocationImage[] {
  const images: LocationImage[] = [];
  
  if (location.images && location.images.length > 0) {
    images.push(...location.images);
  } else if (location.image) {
    images.push({ url: location.image });
  }
  
  return images;
}

export function LocationModal({ location, onClose }: LocationModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({});
  
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoadStates({});
  }, [location?.id]);
  
  if (!location) return null;

  const color = CATEGORY_COLORS[location.category];
  const images = getAllImages(location);
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;
  const safeIndex = Math.min(currentImageIndex, images.length - 1);
  const currentImage = hasImages ? images[Math.max(0, safeIndex)] : null;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageLoad = (index: number) => {
    setImageLoadStates(prev => ({ ...prev, [index]: true }));
  };

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  return (
    <>
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

          {hasImages && currentImage && (
            <div className="modal-gallery">
              <div className="modal-image" onClick={openLightbox}>
                <div className={`modal-image-loader ${imageLoadStates[safeIndex] ? 'hidden' : ''}`}>
                  <div className="modal-image-spinner" />
                </div>
                <img 
                  src={currentImage.url} 
                  alt={location.name}
                  onLoad={() => handleImageLoad(safeIndex)}
                  style={{ opacity: imageLoadStates[safeIndex] ? 1 : 0 }}
                />
                <div className="modal-image-zoom-hint">
                  <ExpandIcon />
                  <span>Click to enlarge</span>
                </div>
                {hasMultipleImages && (
                  <>
                    <button className="gallery-nav gallery-prev" onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}>
                      <ChevronIcon direction="left" />
                    </button>
                    <button className="gallery-nav gallery-next" onClick={(e) => { e.stopPropagation(); handleNextImage(); }}>
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
                      className={`modal-thumbnail ${index === safeIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={img.url} alt={img.description || `Image ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
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

      {lightboxOpen && hasImages && (
        <ImageLightbox
          images={images}
          initialIndex={safeIndex}
          onClose={() => setLightboxOpen(false)}
          locationName={location.name}
        />
      )}
    </>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      {direction === 'left' ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 6 15 12 9 18" />
      )}
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
