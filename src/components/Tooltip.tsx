// hover card that follows the cursor

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import type { MapLocation, LocationImage } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './Tooltip.css';

interface TooltipProps {
  location: MapLocation | null;
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

export function Tooltip({ location }: TooltipProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const prevLocationId = useRef<string | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const place = useCallback(() => {
    frameRef.current = null;
    const el = elRef.current;
    if (!el) return;
    const { x, y } = pointerRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = x + 16 + w > window.innerWidth ? x - 16 - w : x + 16;
    const top = Math.min(y + 16, window.innerHeight - h - 8);
    el.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(place);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [place]);

  useLayoutEffect(() => {
    place();
  });

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

  const getPreviewText = () => {
    if (location.shortDescription) {
      return location.shortDescription;
    }
    const desc = location.description || '';
    const plainText = desc
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/~~.*?~~/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`/g, '')
      .replace(/>\s?/g, '')
      .replace(/---/g, '')
      .replace(/-\s/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (plainText.length > 80) {
      return plainText.substring(0, 77) + '...';
    }
    return plainText;
  };

  const previewText = getPreviewText();

  return (
    <div
      ref={elRef}
      className="tooltip"
      style={{ '--tooltip-color': color } as React.CSSProperties}
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
      {previewText && (
        <div className="tooltip-preview">{previewText}</div>
      )}
      {hasMultipleImages && (
        <div className="tooltip-image-count">
          {images.length} images
        </div>
      )}
      <div className="tooltip-hint">Click for details</div>
    </div>
  );
}
