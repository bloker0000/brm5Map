import { useState, useEffect, useRef } from 'react';
import type { MapLocation, LocationImage } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './Tooltip.css';

interface TooltipProps {
  location: MapLocation | null;
  mousePosition: { x: number; y: number };
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

const SLIDESHOW_INTERVAL = 2000;

export function Tooltip({ location, mousePosition }: TooltipProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const prevLocationId = useRef<string | null>(null);

  const images = location ? getAllImages(location) : [];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (location?.id !== prevLocationId.current) {
      setCurrentImageIndex(0);
      prevLocationId.current = location?.id || null;
    }
  }, [location?.id]);

  useEffect(() => {
    if (!location || !hasMultipleImages) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 300);
    }, SLIDESHOW_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [location, hasMultipleImages, images.length]);

  if (!location) return null;

  const color = CATEGORY_COLORS[location.category];
  const currentImage = images[currentImageIndex];

  return (
    <div
      className="tooltip"
      style={{
        left: mousePosition.x + 15,
        top: mousePosition.y + 15,
        '--tooltip-color': color,
      } as React.CSSProperties}
    >
      {images.length > 0 && currentImage && (
        <div className="tooltip-image-container">
          <div className={`tooltip-image ${isTransitioning ? 'transitioning' : ''}`}>
            <img src={currentImage.url} alt={location.name} />
          </div>
          {hasMultipleImages && (
            <div className="tooltip-slideshow-indicator">
              {images.map((_, index) => (
                <span 
                  key={index} 
                  className={`tooltip-dot ${index === currentImageIndex ? 'active' : ''}`} 
                />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="tooltip-header">
        <CategoryIcon category={location.category} size={16} color={color} />
        <span className="tooltip-name">{location.name}</span>
      </div>
      <div className="tooltip-category">{location.category}</div>
      {hasMultipleImages && (
        <div className="tooltip-image-count">
          {images.length} images
        </div>
      )}
      <div className="tooltip-hint">Click for details</div>
    </div>
  );
}
