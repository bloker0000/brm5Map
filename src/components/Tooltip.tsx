// hover card that follows the cursor

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './Tooltip.css';

interface TooltipProps {
  location: MapLocation | null;
}

const SLIDESHOW_INTERVAL = 2000;

function previewText(location: MapLocation): string {
  if (location.shortDescription) {
    return location.shortDescription;
  }
  const plainText = (location.description || '')
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
}

// keyed by location, so a new pin always starts from its first image
function TooltipImages({ location }: { location: MapLocation }) {
  const images = location.images ?? [];
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (images.length < 2) return;
    let fade: number | undefined;
    const interval = window.setInterval(() => {
      setIsTransitioning(true);
      fade = window.setTimeout(() => {
        setIndex(prev => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 300);
    }, SLIDESHOW_INTERVAL);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fade);
    };
  }, [images.length]);

  const image = images[index];
  if (!image) return null;

  return (
    <div className="tooltip-image-container">
      <div className={`tooltip-image ${isTransitioning ? 'transitioning' : ''}`}>
        {/* the card is 250px wide, the full size shot is 1920 */}
        <img src={image.thumb ?? image.url} alt="" />
      </div>
      {images.length > 1 && (
        <div className="tooltip-slideshow-indicator">
          {images.map((_, i) => (
            <span
              key={i}
              className={`tooltip-dot ${i === index ? 'active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Tooltip({ location }: TooltipProps) {
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

  if (!location) return null;

  const color = CATEGORY_COLORS[location.category];
  const imageCount = location.images?.length ?? 0;
  const preview = previewText(location);

  return (
    <div
      ref={elRef}
      className="tooltip"
      style={{ '--tooltip-color': color } as React.CSSProperties}
      aria-hidden="true"
    >
      <TooltipImages key={location.id} location={location} />
      <div className="tooltip-header">
        <CategoryIcon category={location.category} size={16} color={color} />
        <span className="tooltip-name">{location.name}</span>
      </div>
      <div className="tooltip-category">{location.category}</div>
      {preview && (
        <div className="tooltip-preview">{preview}</div>
      )}
      {imageCount > 1 && (
        <div className="tooltip-image-count">
          {imageCount} images
        </div>
      )}
      <div className="tooltip-hint">Click for details</div>
    </div>
  );
}
