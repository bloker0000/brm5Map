// the metre grid from the game's map tab. it follows the map's own axes rather than
// the world's, the streets run along those, so at the starting view it lies square
// to the screen like the game's does

import { MAP_WIDTH, MAP_HEIGHT } from './mapView';
import type { View } from './mapView';

// the solved transform puts 0.9065 map units on a stud, and the game counts 3.28084 studs to a metre
const UNITS_PER_STUD = 0.9065;
const UNITS_PER_METRE = UNITS_PER_STUD * 3.28084;

// the gold glow bands along the top and left edge are 8% of the map's height
export const BAND = 0.08;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
// the game fades a set of lines in over 0.2 of its zoom, which is screen pixels per stud
const fadeIn = (zoom: number, from: number) => clamp01((zoom - from) * 5);

interface Point {
  x: number;
  y: number;
}

// eastings count from the map's left edge, northings up from its bottom edge
export function gridReference(x: number, y: number): string {
  const pad = (metres: number) => String(Math.max(0, Math.round(metres))).padStart(5, '0');
  return `${pad(x / UNITS_PER_METRE)} ${pad((MAP_HEIGHT - y) / UNITS_PER_METRE)}`;
}

export function drawGrid(
  lines: CanvasRenderingContext2D,
  labels: CanvasRenderingContext2D,
  view: View,
  width: number,
  height: number,
  dpr: number,
) {
  lines.clearRect(0, 0, width, height);
  labels.clearRect(0, 0, width, height);
  if (width === 0 || height === 0) return;

  const zoom = view.scale * UNITS_PER_STUD;
  const step = zoom >= 1.6 ? 10 : zoom >= 0.2 ? 100 : 1000;
  const cx = width / 2;
  const cy = height / 2;
  const rad = view.rotation * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const square = Math.abs(sin) < 1e-6 && cos > 0;

  const toScreen = (ux: number, uy: number): Point => {
    const dx = view.x + ux * view.scale - cx;
    const dy = view.y + uy * view.scale - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  };
  const toMap = (sx: number, sy: number): Point => {
    const dx = sx - cx;
    const dy = sy - cy;
    return {
      x: (cx + dx * cos + dy * sin - view.x) / view.scale,
      y: (cy - dx * sin + dy * cos - view.y) / view.scale,
    };
  };

  const corners = [toMap(0, 0), toMap(width, 0), toMap(0, height), toMap(width, height)];
  const xs = corners.map(p => p.x);
  const ys = corners.map(p => p.y);
  const eastFrom = Math.max(0, Math.min(...xs) / UNITS_PER_METRE);
  const eastTo = Math.min(MAP_WIDTH, Math.max(...xs)) / UNITS_PER_METRE;
  const northFrom = Math.max(0, (MAP_HEIGHT - Math.max(...ys)) / UNITS_PER_METRE);
  const northTo = Math.min(MAP_HEIGHT, MAP_HEIGHT - Math.min(...ys)) / UNITS_PER_METRE;

  // a thousand is always there, a hundred and a ten fade in as the zoom gets to them
  const styleOf = (metres: number) => {
    if (metres % 1000 === 0) return { width: 3, alpha: 0.6, text: 1 };
    if (metres % 100 === 0) return { width: 2, alpha: 0.4 * fadeIn(zoom, 0.2), text: fadeIn(zoom, 0.2) };
    return { width: 1, alpha: 0.2 * fadeIn(zoom, 1.6), text: fadeIn(zoom, 1.6) };
  };

  const band = BAND * height;
  const turn = ((view.rotation % 360) + 540) % 360 - 180;
  const labelFade = clamp01(1 - Math.abs(turn) / 10);
  const digits = zoom > 1.7 ? 4 : zoom > 0.3 ? 3 : 2;

  // TextScaled in a box 0.55 of the band each way, so the size follows the digit count
  labels.font = '700 100px Rajdhani';
  const perPx = labels.measureText('0'.repeat(digits)).width / 100;
  const size = Math.min((band * 0.55) / 1.276, (band * 0.55) / perPx);
  labels.font = `700 ${size}px Rajdhani`;
  labels.textAlign = 'center';
  labels.textBaseline = 'middle';
  labels.lineJoin = 'round';
  labels.lineWidth = 2;
  labels.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  labels.fillStyle = '#ffc259';

  const draw = (metres: number, a: Point, b: Point, label: Point | null) => {
    const style = styleOf(metres);
    if (style.alpha > 0) {
      // whole device pixels wide, and square to the screen an odd width needs to sit
      // on a half pixel to land on them
      const device = Math.max(1, Math.round(style.width * dpr));
      const snap = (v: number) => square ? (Math.round(v * dpr) + (device % 2) / 2) / dpr : v;
      lines.strokeStyle = `rgba(255, 255, 255, ${style.alpha})`;
      lines.lineWidth = device / dpr;
      lines.beginPath();
      lines.moveTo(snap(a.x), snap(a.y));
      lines.lineTo(snap(b.x), snap(b.y));
      lines.stroke();
    }
    const alpha = style.text * labelFade;
    if (label && alpha > 0) {
      const text = String(metres).padStart(5, '0').slice(0, digits);
      labels.globalAlpha = alpha;
      labels.strokeText(text, label.x, label.y);
      labels.fillText(text, label.x, label.y);
      labels.globalAlpha = 1;
    }
  };

  for (let metres = Math.ceil(eastFrom / step) * step; metres <= eastTo; metres += step) {
    const ux = metres * UNITS_PER_METRE;
    const a = toScreen(ux, 0);
    const b = toScreen(ux, MAP_HEIGHT);
    let label: Point | null = null;
    if (Math.abs(b.y - a.y) > 1e-6) {
      const t = (band / 2 - a.y) / (b.y - a.y);
      const x = a.x + t * (b.x - a.x);
      if (x > band && x < width) label = { x, y: band / 2 };
    }
    draw(metres, a, b, label);
  }

  for (let metres = Math.ceil(northFrom / step) * step; metres <= northTo; metres += step) {
    const uy = MAP_HEIGHT - metres * UNITS_PER_METRE;
    const a = toScreen(0, uy);
    const b = toScreen(MAP_WIDTH, uy);
    let label: Point | null = null;
    if (Math.abs(b.x - a.x) > 1e-6) {
      const t = (band / 2 - a.x) / (b.x - a.x);
      const y = a.y + t * (b.y - a.y);
      if (y > band && y < height) label = { x: band / 2, y };
    }
    draw(metres, a, b, label);
  }
}
