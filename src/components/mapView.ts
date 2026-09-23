// where the map sits on screen. x and y are the translation before the rotation,
// which turns around the middle of the map container

export interface View {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// the viewBox of Brm5Map.svg, which is also the unit the location coordinates use
export const MAP_WIDTH = 3524;
export const MAP_HEIGHT = 2500;

export const MIN_SCALE = 0.15;
export const MAX_SCALE = 4;

export function fitScale(width: number, height: number): number {
  return Math.min(width / MAP_WIDTH, height / MAP_HEIGHT) * 0.9;
}

// pins shrink a little when zoomed right out, otherwise a phone gets one big clump
export function pinScale(scale: number): number {
  return Math.min(1, Math.max(0.6, 0.6 + (scale - 0.1) * 4));
}
