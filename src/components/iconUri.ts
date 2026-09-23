// the map pins are <img> tags rather than inline svg, which keeps a pan down to one
// transform per pin. each category and colour is built once and cached as a data uri

import type { LocationCategory } from '../types/location';

const iconSvgBuilders: Record<LocationCategory, (c: string) => string> = {
  'Player Spawn': (c) => `<line x1="5" y1="3" x2="5" y2="22"/><path d="M5 3h12l-3 4.5L17 12H5" fill="${c}" fill-opacity="0.25"/>`,
  'Explorable Area': (c) => `<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><rect x="9" y="9" width="6" height="3" fill="${c}"/>`,
  'Exfil Point': () => `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  'Enemy Location': (c) => `<path d="M12 2L2 20h20L12 2z"/><line x1="12" y1="9" x2="12" y2="14" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="${c}" stroke="none"/>`,
  'Zombie Nest': (c) => `<rect x="5" y="4" width="14" height="12" rx="5"/><circle cx="9" cy="10" r="1.5" fill="${c}" stroke="none"/><circle cx="15" cy="10" r="1.5" fill="${c}" stroke="none"/><path d="M9 16v2M12 16v3M15 16v2" stroke-linecap="round"/><line x1="8" y1="22" x2="16" y2="22"/>`,
  'Key Spawn Location': () => `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>`,
  'Locked Door': () => `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  'Quarantine Zone': () => `<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>`,
  'Medical': () => `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
  'Shop': () => `<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`,
  'Landmark': () => `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
  'Subway Station': (c) => `<rect x="3" y="3" width="18" height="18" rx="3" stroke="${c}" stroke-width="2"/><path d="M7 16V8l5 5 5-5v8"/>`,
  'Drop-Off Point': (c) => `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="${c}" stroke="none"/>`,
  'Raid': (c) => `<path d="M12 22s-8-4.5-8-11V5l8-3 8 3v6c0 6.5-8 11-8 11z"/><line x1="12" y1="7" x2="12" y2="12"/><circle cx="12" cy="15" r="1" fill="${c}" stroke="none"/>`,
  'Safe': (c) => `<rect x="2" y="3" width="17" height="18" rx="2"/><rect x="19" y="8" width="2" height="3" rx="1"/><rect x="19" y="14" width="2" height="3" rx="1"/><circle cx="11" cy="12" r="4"/><circle cx="11" cy="12" r="1.5" fill="${c}" stroke="none"/>`,
  'Other': () => `<circle cx="12" cy="12" r="4"/>`,
};

const dataUriCache = new Map<string, string>();

export function getCategoryIconUri(category: LocationCategory, color: string): string {
  const key = `${category}|${color}`;
  let uri = dataUriCache.get(key);
  if (uri) return uri;

  const builder = iconSvgBuilders[category] || iconSvgBuilders['Other'];
  const inner = builder(color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="-1 -1 26 26" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="rgba(0,0,0,0.7)" stroke-width="3.5">${inner}</g><g stroke="${color}" stroke-width="2">${inner}</g></svg>`;
  uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  dataUriCache.set(key, uri);
  return uri;
}
