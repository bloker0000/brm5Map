// the map itself, pan/zoom/rotate by mouse, touch and keyboard

import { useState, useRef, useCallback, useEffect, useLayoutEffect, memo } from 'react';
import { MapPin } from './MapPin';
import { PlusIcon, MinusIcon, ResetPositionIcon, ResetRotationIcon, CategoryIcon } from './Icons';
import type { MapLocation, LocationCategory } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { BG_IMAGES } from '../data/backgrounds';
import { MAP_WIDTH, MAP_HEIGHT, MIN_SCALE, MAX_SCALE, fitScale, pinScale } from './mapView';
import type { View } from './mapView';
import './InteractiveMap.css';

export interface FocusRequest {
  locations: MapLocation[];
  id: number;
}

interface InteractiveMapProps {
  locations: MapLocation[];
  hoveredLocation: MapLocation | null;
  selectedLocation: MapLocation | null;
  onHover: (location: MapLocation | null) => void;
  onClick: (location: MapLocation) => void;
  onMapClick: (x: number, y: number) => void;
  focusRequest: FocusRequest | null;
  bgIndex: number;
  isAdminMode?: boolean;
  showPins?: boolean;
  showCompass?: boolean;
  onPinDrag?: (locationId: string, x: number, y: number) => void;
  placeholderPin?: { x: number; y: number; category: LocationCategory } | null;
  isDragMode?: boolean;
}

interface Point {
  x: number;
  y: number;
}

type Gesture =
  | { kind: 'pan'; start: Point; base: Point; dragged: boolean }
  | { kind: 'rotate'; startX: number; startRotation: number }
  | { kind: 'pinch'; twist: number; turning: boolean };

const MAP_NORTH_OFFSET = 40;
const WHEEL_ZOOM = 0.002;
// a trackpad pinch arrives as ctrl + wheel with much smaller deltas
const PINCH_WHEEL_ZOOM = 0.01;
const DRAG_THRESHOLD = 3;
const ROTATE_PER_PX = 0.15;
// a pinch only starts turning the map past this much twist, so zooming does not tilt it
const TWIST_THRESHOLD = 12;
const FOCUS_SCALE = 2;
const STEP_ZOOM = 1.3;
const KEY_PAN = 80;
const KEY_ROTATE = 15;
const DOUBLE_TAP_MS = 300;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toRad = (deg: number) => deg * Math.PI / 180;
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function headingOf(rotation: number) {
  return Math.round((((MAP_NORTH_OFFSET - rotation) % 360) + 360) % 360) % 360;
}

function InteractiveMapImpl({
  locations,
  hoveredLocation,
  selectedLocation,
  onHover,
  onClick,
  onMapClick,
  focusRequest,
  bgIndex,
  isAdminMode = false,
  showPins = true,
  showCompass = true,
  onPinDrag,
  placeholderPin,
  isDragMode = false,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const compassImageRef = useRef<HTMLImageElement>(null);
  const rotationDisplayRef = useRef<HTMLSpanElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const pinsOverlayRef = useRef<HTMLDivElement>(null);

  const [gestureClass, setGestureClass] = useState<'dragging' | 'rotating' | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // the view lives in a ref and is written straight to the dom, so neither a
  // gesture nor an animation goes through a react render
  const viewRef = useRef<View>({ x: 0, y: 0, scale: 0.5, rotation: 0 });
  const sizeRef = useRef({ width: 0, height: 0 });
  const originRef = useRef<Point>({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<Gesture | null>(null);
  const hasDraggedRef = useRef(false);
  const lastPointerTypeRef = useRef('mouse');
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const frameRef = useRef(0);
  const targetRef = useRef<View | null>(null);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (el) sizeRef.current = { width: el.clientWidth, height: el.clientHeight };
    return sizeRef.current;
  }, []);

  const updatePinPositions = useCallback(() => {
    const overlay = pinsOverlayRef.current;
    if (!overlay) return;
    const { x, y, scale, rotation } = viewRef.current;
    const cx = sizeRef.current.width / 2;
    const cy = sizeRef.current.height / 2;
    const cos = Math.cos(toRad(rotation));
    const sin = Math.sin(toRad(rotation));
    const size = pinScale(scale);

    for (const child of overlay.children) {
      const el = child as HTMLElement;
      if ('dragging' in el.dataset) continue;
      const mx = el.dataset.x;
      const my = el.dataset.y;
      if (mx == null || my == null) continue;

      const dx = +mx * scale + x - cx;
      const dy = +my * scale + y - cy;
      el.style.transform = `translate(${cx + dx * cos - dy * sin}px, ${cy + dx * sin + dy * cos}px) translate(-50%, -50%) scale(${size})`;
    }
  }, []);

  const writeContent = useCallback((view: View) => {
    const content = contentRef.current;
    if (!content) return;
    const cx = sizeRef.current.width / 2;
    const cy = sizeRef.current.height / 2;
    content.style.transform =
      `translate(${cx}px, ${cy}px) rotate(${view.rotation}deg) translate(${-cx}px, ${-cy}px) translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  }, []);

  const applyView = useCallback((view: View) => {
    viewRef.current = view;
    writeContent(view);
    if (compassImageRef.current) {
      compassImageRef.current.style.transform = `rotate(${view.rotation - MAP_NORTH_OFFSET}deg)`;
    }
    if (rotationDisplayRef.current) {
      rotationDisplayRef.current.textContent = String(headingOf(view.rotation));
    }
    updatePinPositions();
  }, [writeContent, updatePinPositions]);

  // during a plain pan the pins ride along as one layer instead of moving one by one
  const writePan = useCallback((view: View, base: Point) => {
    viewRef.current = view;
    writeContent(view);
    const overlay = pinsOverlayRef.current;
    if (!overlay) return;
    const cos = Math.cos(toRad(view.rotation));
    const sin = Math.sin(toRad(view.rotation));
    const dx = view.x - base.x;
    const dy = view.y - base.y;
    overlay.style.transform = `translate3d(${dx * cos - dy * sin}px, ${dx * sin + dy * cos}px, 0)`;
  }, [writeContent]);

  const settlePins = useCallback(() => {
    if (pinsOverlayRef.current) pinsOverlayRef.current.style.transform = '';
    updatePinPositions();
  }, [updatePinPositions]);

  const limitScale = useCallback((scale: number) => {
    const { width, height } = sizeRef.current;
    // a phone only fits the whole map below MIN_SCALE, so the floor follows the fit
    const min = Math.max(0.01, Math.min(MIN_SCALE, fitScale(width, height) * 0.75));
    return clamp(scale, min, MAX_SCALE);
  }, []);

  // always leaves a quarter of the map, or of the screen, in view
  const clampView = useCallback((view: View): View => {
    const { width, height } = sizeRef.current;
    const scale = limitScale(view.scale);
    const mapW = MAP_WIDTH * scale;
    const mapH = MAP_HEIGHT * scale;
    const keepX = Math.min(mapW, width) * 0.25;
    const keepY = Math.min(mapH, height) * 0.25;
    return {
      x: clamp(view.x, keepX - mapW, width - keepX),
      y: clamp(view.y, keepY - mapH, height - keepY),
      scale,
      rotation: view.rotation,
    };
  }, [limitScale]);

  // the view with the map point under `from` moved to `to`, zoomed by `zoom` and
  // turned by `turn` degrees. panning, pinching, twisting and wheel zoom are all this
  const moved = useCallback((view: View, from: Point, to: Point, zoom: number, turn: number): View => {
    const cx = sizeRef.current.width / 2;
    const cy = sizeRef.current.height / 2;
    const unturn = (p: Point, rotation: number): Point => {
      const cos = Math.cos(toRad(rotation));
      const sin = Math.sin(toRad(rotation));
      const dx = p.x - cx;
      const dy = p.y - cy;
      return { x: cx + dx * cos + dy * sin, y: cy - dx * sin + dy * cos };
    };
    const scale = limitScale(view.scale * zoom);
    const ratio = scale / view.scale;
    const rotation = view.rotation + turn;
    const a = unturn(from, view.rotation);
    const b = unturn(to, rotation);
    return clampView({
      x: b.x - (a.x - view.x) * ratio,
      y: b.y - (a.y - view.y) * ratio,
      scale,
      rotation,
    });
  }, [limitScale, clampView]);

  const cancelAnimation = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    targetRef.current = null;
  }, []);

  const animateTo = useCallback((target: View, duration: number) => {
    cancelAnimation();
    const from = viewRef.current;
    const to = clampView(target);
    const turn = ((((to.rotation - from.rotation) % 360) + 540) % 360) - 180;
    const end = { ...to, rotation: from.rotation + turn };

    if (duration <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyView(end);
      return;
    }

    // tweens the map point in the middle of the screen rather than the raw
    // translation, so a zoom heads straight in instead of swinging out and back
    const { width, height } = sizeRef.current;
    const p0 = { x: (width / 2 - from.x) / from.scale, y: (height / 2 - from.y) / from.scale };
    const p1 = { x: (width / 2 - end.x) / end.scale, y: (height / 2 - end.y) / end.scale };
    const start = performance.now();
    targetRef.current = end;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const k = 1 - Math.pow(1 - t, 3);
      const scale = from.scale * Math.pow(end.scale / from.scale, k);
      const px = p0.x + (p1.x - p0.x) * k;
      const py = p0.y + (p1.y - p0.y) * k;
      applyView({
        x: sizeRef.current.width / 2 - px * scale,
        y: sizeRef.current.height / 2 - py * scale,
        scale,
        rotation: from.rotation + turn * k,
      });
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        targetRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(step);
  }, [cancelAnimation, clampView, applyView]);

  const fitView = useCallback((rotation: number): View => {
    const { width, height } = measure();
    const scale = fitScale(width, height);
    return {
      x: (width - MAP_WIDTH * scale) / 2,
      y: (height - MAP_HEIGHT * scale) / 2,
      scale,
      rotation,
    };
  }, [measure]);

  // the map turns around the middle of the screen, so putting a point there does
  // not depend on the angle. only the box several points make turns with it
  const focusOn = useCallback((locs: MapLocation[]) => {
    if (locs.length === 0) return;
    const { width, height } = measure();
    const { rotation } = targetRef.current ?? viewRef.current;
    let scale = FOCUS_SCALE;
    let centre: Point = { x: locs[0].x, y: locs[0].y };

    if (locs.length > 1) {
      const cos = Math.cos(toRad(rotation));
      const sin = Math.sin(toRad(rotation));
      const us = locs.map(l => l.x * cos - l.y * sin);
      const vs = locs.map(l => l.x * sin + l.y * cos);
      const minU = Math.min(...us);
      const maxU = Math.max(...us);
      const minV = Math.min(...vs);
      const maxV = Math.max(...vs);
      const pad = Math.min(100, width * 0.15, height * 0.15);
      scale = Math.min(
        FOCUS_SCALE,
        (width - pad * 2) / Math.max(maxU - minU, 1),
        (height - pad * 2) / Math.max(maxV - minV, 1)
      );
      const u = (minU + maxU) / 2;
      const v = (minV + maxV) / 2;
      centre = { x: u * cos + v * sin, y: -u * sin + v * cos };
    }

    animateTo({ x: width / 2 - centre.x * scale, y: height / 2 - centre.y * scale, scale, rotation }, 500);
  }, [measure, animateTo]);

  const zoomBy = useCallback((factor: number) => {
    const centre = { x: sizeRef.current.width / 2, y: sizeRef.current.height / 2 };
    animateTo(moved(targetRef.current ?? viewRef.current, centre, centre, factor, 0), 200);
  }, [moved, animateTo]);

  const resetPosition = useCallback(() => {
    animateTo(fitView((targetRef.current ?? viewRef.current).rotation), 300);
  }, [animateTo, fitView]);

  const resetRotation = useCallback(() => {
    animateTo({ ...(targetRef.current ?? viewRef.current), rotation: 0 }, 300);
  }, [animateTo]);

  const screenToMap = useCallback((clientX: number, clientY: number): Point => {
    const rect = containerRef.current!.getBoundingClientRect();
    const { x, y, scale, rotation } = viewRef.current;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = clientX - rect.left - cx;
    const dy = clientY - rect.top - cy;
    const cos = Math.cos(toRad(rotation));
    const sin = Math.sin(toRad(rotation));
    const ux = cx + dx * cos + dy * sin;
    const uy = cy - dx * sin + dy * cos;
    return { x: Math.round((ux - x) / scale), y: Math.round((uy - y) / scale) };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    applyView(fitView(0));

    // keeps the same spot in the middle when the screen or the sidebar changes size
    const observer = new ResizeObserver(() => {
      const before = sizeRef.current;
      const after = measure();
      if (before.width === after.width && before.height === after.height) return;
      const view = viewRef.current;
      applyView(clampView({
        ...view,
        x: view.x + (after.width - before.width) / 2,
        y: view.y + (after.height - before.height) / 2,
      }));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [applyView, fitView, measure, clampView]);

  useLayoutEffect(() => {
    updatePinPositions();
  }, [locations, showPins, placeholderPin, updatePinPositions]);

  useEffect(() => {
    const overlay = pinsOverlayRef.current;
    if (!overlay) return;
    // a drag that ends on a pin must not open it. a keyboard press has no detail
    // and always should
    const blockClick = (e: MouseEvent) => {
      if (hasDraggedRef.current && e.detail !== 0) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    overlay.addEventListener('click', blockClick, true);
    return () => overlay.removeEventListener('click', blockClick, true);
  }, []);

  useEffect(() => {
    if (focusRequest && imageLoaded) focusOn(focusRequest.locations);
  }, [focusRequest, imageLoaded, focusOn]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const isRightButton = e.pointerType === 'mouse' && e.button === 2;
    if (e.button !== 0 && !isRightButton) return;
    if ((e.target as Element).closest('.map-hud')) return;

    const pointers = pointersRef.current;
    lastPointerTypeRef.current = e.pointerType;
    cancelAnimation();

    if (pointers.size === 0) {
      const rect = containerRef.current!.getBoundingClientRect();
      originRef.current = { x: rect.left, y: rect.top };
      hasDraggedRef.current = false;
      document.body.style.userSelect = 'none';
    }

    const point = { x: e.clientX - originRef.current.x, y: e.clientY - originRef.current.y };
    pointers.set(e.pointerId, point);

    if (isRightButton) {
      gestureRef.current = { kind: 'rotate', startX: point.x, startRotation: viewRef.current.rotation };
      setGestureClass('rotating');
    } else if (pointers.size === 1) {
      const { x, y } = viewRef.current;
      gestureRef.current = { kind: 'pan', start: point, base: { x, y }, dragged: false };
    } else if (pointers.size === 2) {
      settlePins();
      gestureRef.current = { kind: 'pinch', twist: 0, turning: false };
      hasDraggedRef.current = true;
      setGestureClass('dragging');
    }
  }, [cancelAnimation, settlePins]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTap = (point: Point, target: EventTarget | null) => {
      if (target instanceof Element && target.closest('.map-pin')) return;
      const now = performance.now();
      const last = lastTapRef.current;
      if (now - last.time < DOUBLE_TAP_MS && Math.hypot(point.x - last.x, point.y - last.y) < 30) {
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        animateTo(moved(viewRef.current, point, point, 2, 0), 250);
      } else {
        lastTapRef.current = { time: now, x: point.x, y: point.y };
      }
    };

    const handleMove = (e: PointerEvent) => {
      const pointers = pointersRef.current;
      const prev = pointers.get(e.pointerId);
      const gesture = gestureRef.current;
      if (!prev || !gesture) return;
      const point = { x: e.clientX - originRef.current.x, y: e.clientY - originRef.current.y };
      pointers.set(e.pointerId, point);

      if (gesture.kind === 'rotate') {
        const dx = point.x - gesture.startX;
        if (Math.abs(dx) > DRAG_THRESHOLD) hasDraggedRef.current = true;
        applyView({ ...viewRef.current, rotation: gesture.startRotation + dx * ROTATE_PER_PX });
        return;
      }

      if (gesture.kind === 'pan') {
        let from = prev;
        if (!gesture.dragged) {
          if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) <= DRAG_THRESHOLD) return;
          gesture.dragged = true;
          hasDraggedRef.current = true;
          setGestureClass('dragging');
          from = gesture.start;
        }
        writePan(moved(viewRef.current, from, point, 1, 0), gesture.base);
        return;
      }

      // pinch: this event moved one finger, the other stayed where it was
      let other: Point | undefined;
      for (const [id, p] of pointers) {
        if (id !== e.pointerId) {
          other = p;
          break;
        }
      }
      if (!other) return;
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(point.x - other.x, point.y - other.y);
      if (before < 1 || after < 1) return;

      let turn = (Math.atan2(point.y - other.y, point.x - other.x) - Math.atan2(prev.y - other.y, prev.x - other.x)) * 180 / Math.PI;
      if (turn > 180) turn -= 360;
      if (turn < -180) turn += 360;
      if (!gesture.turning) {
        gesture.twist += turn;
        gesture.turning = Math.abs(gesture.twist) > TWIST_THRESHOLD;
        turn = 0;
      }
      applyView(moved(viewRef.current, midpoint(prev, other), midpoint(point, other), after / before, turn));
    };

    const handleUp = (e: PointerEvent) => {
      const pointers = pointersRef.current;
      const last = pointers.get(e.pointerId);
      if (!last) return;
      pointers.delete(e.pointerId);
      const gesture = gestureRef.current;

      if (pointers.size > 0) {
        // lifting one finger of a pinch carries on as a pan with the other
        if (pointers.size === 1 && gesture?.kind === 'pinch') {
          const [rest] = pointers.values();
          const { x, y } = viewRef.current;
          gestureRef.current = { kind: 'pan', start: rest, base: { x, y }, dragged: true };
        }
        return;
      }

      gestureRef.current = null;
      document.body.style.userSelect = '';
      setGestureClass(null);
      if (gesture?.kind === 'pan') {
        settlePins();
        if (!gesture.dragged && e.pointerType === 'touch' && e.type === 'pointerup') handleTap(last, e.target);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimation();
      const rect = container.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      // firefox can report whole lines or pages instead of pixels
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
      const zoom = Math.exp(-e.deltaY * unit * (e.ctrlKey ? PINCH_WHEEL_ZOOM : WHEEL_ZOOM));
      applyView(moved(viewRef.current, point, point, zoom, 0));

      const gesture = gestureRef.current;
      if (gesture?.kind === 'pan') {
        gesture.base = { x: viewRef.current.x, y: viewRef.current.y };
        if (pinsOverlayRef.current) pinsOverlayRef.current.style.transform = '';
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      container.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(frameRef.current);
      document.body.style.userSelect = '';
    };
  }, [applyView, writePan, settlePins, moved, animateTo, cancelAnimation]);

  const handleCompassPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const compass = compassRef.current;
    if (!compass) return;
    cancelAnimation();

    const angleAt = (clientX: number, clientY: number) => {
      const rect = compass.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
    };
    const startAngle = angleAt(e.clientX, e.clientY);
    const startRotation = viewRef.current.rotation;
    setGestureClass('rotating');
    document.body.style.userSelect = 'none';

    const handleMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      applyView({ ...viewRef.current, rotation: startRotation + angleAt(ev.clientX, ev.clientY) - startAngle });
    };
    const handleUp = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      document.body.style.userSelect = '';
      setGestureClass(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  }, [cancelAnimation, applyView]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const centre = { x: sizeRef.current.width / 2, y: sizeRef.current.height / 2 };
    const view = targetRef.current ?? viewRef.current;
    const pan = (dx: number, dy: number) => moved(view, centre, { x: centre.x + dx, y: centre.y + dy }, 1, 0);

    let next: View;
    switch (e.key) {
      case 'ArrowLeft': next = pan(KEY_PAN, 0); break;
      case 'ArrowRight': next = pan(-KEY_PAN, 0); break;
      case 'ArrowUp': next = pan(0, KEY_PAN); break;
      case 'ArrowDown': next = pan(0, -KEY_PAN); break;
      case '+':
      case '=': next = moved(view, centre, centre, STEP_ZOOM, 0); break;
      case '-':
      case '_': next = moved(view, centre, centre, 1 / STEP_ZOOM, 0); break;
      case 'q':
      case 'Q': next = { ...view, rotation: view.rotation - KEY_ROTATE }; break;
      case 'e':
      case 'E': next = { ...view, rotation: view.rotation + KEY_ROTATE }; break;
      case '0': next = fitView(0); break;
      default: return;
    }
    e.preventDefault();
    animateTo(next, 180);
  }, [moved, fitView, animateTo]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // touch has its own double tap, and in the admin panel a click places a pin
    if (isAdminMode || lastPointerTypeRef.current !== 'mouse') return;
    if ((e.target as Element).closest('.map-pin, .map-hud')) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    animateTo(moved(viewRef.current, point, point, 2, 0), 250);
  }, [isAdminMode, moved, animateTo]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current) return;
    const { x, y } = screenToMap(e.clientX, e.clientY);
    onMapClick(x, y);
  }, [onMapClick, screenToMap]);

  const handleHover = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !coordsRef.current) return;
    const { x, y } = screenToMap(e.clientX, e.clientY);
    coordsRef.current.textContent = `${x}, ${y}`;
  }, [screenToMap]);

  const handleImageLoad = useCallback(() => {
    applyView(fitView(0));
    setImageLoaded(true);
  }, [applyView, fitView]);

  return (
    <div
      className={`interactive-map${isAdminMode ? ' admin-mode' : ''}${gestureClass ? ` ${gestureClass}` : ''}`}
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="map"
      aria-label="Map. Arrow keys pan, plus and minus zoom, Q and E rotate, 0 resets the view."
      onPointerDown={handlePointerDown}
      onPointerMove={handleHover}
      onContextMenu={(e) => e.preventDefault()}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="map-bg"
        style={{ backgroundImage: `url(${BG_IMAGES[bgIndex]})` }}
      />
      <div className="map-overlay" />

      <div className="map-content" ref={contentRef} onClick={handleContentClick}>
        <img
          src="/Brm5Map.svg"
          alt=""
          className="map-image"
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          draggable={false}
          onLoad={handleImageLoad}
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
            viewRef={viewRef}
            isDraggable={isDragMode}
            onDrag={onPinDrag}
          />
        ))}
      </div>

      <div className="zoom-controls map-hud">
        <button type="button" onClick={() => zoomBy(STEP_ZOOM)} title="Zoom In" aria-label="Zoom in">
          <PlusIcon size={18} />
        </button>
        <button type="button" onClick={() => zoomBy(1 / STEP_ZOOM)} title="Zoom Out" aria-label="Zoom out">
          <MinusIcon size={18} />
        </button>
        <button type="button" onClick={resetPosition} title="Reset Position" aria-label="Reset position">
          <ResetPositionIcon size={18} />
        </button>
        <button type="button" onClick={resetRotation} title="Reset Rotation" aria-label="Reset rotation">
          <ResetRotationIcon size={18} />
        </button>
      </div>

      <div
        className={`compass map-hud${showCompass ? '' : ' hidden'}`}
        ref={compassRef}
        onPointerDown={handleCompassPointerDown}
        aria-hidden="true"
      >
        <img
          ref={compassImageRef}
          src="/compass.svg"
          alt=""
          className="compass-image"
          draggable={false}
        />
      </div>

      <div className="map-readouts">
        <div className="rotation-display">
          <span className="rotation-label">Rotation</span>
          <span className="rotation-value" ref={rotationDisplayRef}>{MAP_NORTH_OFFSET}</span>
        </div>
        <div className="coords-display">
          <span className="coords-label">Coords</span>
          <span className="coords-value" ref={coordsRef}>0, 0</span>
        </div>
      </div>
    </div>
  );
}

export const InteractiveMap = memo(InteractiveMapImpl);
