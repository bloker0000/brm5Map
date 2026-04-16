import type { LocationCategory } from '../types/location';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function SpawnpointIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="3" x2="5" y2="22" />
      <path d="M5 3h12l-3 4.5L17 12H5" fill={color} fillOpacity="0.25" />
    </svg>
  );
}

export function BuildingIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <rect x="9" y="9" width="6" height="3" fill={color} />
    </svg>
  );
}

export function SubwayStationIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <path d="M7 16V8l5 5 5-5v8" />
    </svg>
  );
}

export function ExtractionPointIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function EnemyLocationIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M12 2L2 20h20L12 2z" />
      <line x1="12" y1="9" x2="12" y2="14" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function ZombieNestIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <rect x="5" y="4" width="14" height="12" rx="5" />
      <circle cx="9" cy="10" r="1.5" fill={color} stroke="none" />
      <circle cx="15" cy="10" r="1.5" fill={color} stroke="none" />
      <path d="M9 16v2M12 16v3M15 16v2" strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

export function KeySpawnLocationIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

export function LockedDoorIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function QuarantineZoneIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

export function MedicalIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function ShopIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function LandmarkIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function InfiltrationIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function RaidIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s-8-4.5-8-11V5l8-3 8 3v6c0 6.5-8 11-8 11z" />
      <line x1="12" y1="7" x2="12" y2="12" />
      <circle cx="12" cy="15" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function OtherIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function SearchIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function SafeIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="17" height="18" rx="2" />
      <rect x="19" y="8" width="2" height="3" rx="1" />
      <rect x="19" y="14" width="2" height="3" rx="1" />
      <circle cx="11" cy="12" r="4" />
      <circle cx="11" cy="12" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

export function CloseIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function PlusIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function MinusIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ResetIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

export function CrosshairIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

export function SaveIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

const iconComponents: Record<LocationCategory, React.FC<IconProps>> = {
  'Spawnpoint': SpawnpointIcon,
  'Building': BuildingIcon,
  'Extraction Point': ExtractionPointIcon,
  'Enemy Location': EnemyLocationIcon,
  'Zombie Nest': ZombieNestIcon,
  'Key Spawn Location': KeySpawnLocationIcon,
  'Locked Door': LockedDoorIcon,
  'Quarantine Zone': QuarantineZoneIcon,
  'Medical': MedicalIcon,
  'Shop': ShopIcon,
  'Landmark': LandmarkIcon,
  'Subway Station': SubwayStationIcon,
  'Infiltration': InfiltrationIcon,
  'Raid': RaidIcon,
  'Safe': SafeIcon,
  'Other': OtherIcon,
};

export function CategoryIcon({ category, size = 16, color = 'currentColor', className }: IconProps & { category: LocationCategory }) {
  const IconComponent = iconComponents[category] || OtherIcon;
  return <IconComponent size={size} color={color} className={className} />;
}

// --- Static SVG data URI icons for map pins (no inline SVG DOM nodes) ---

const iconSvgBuilders: Record<LocationCategory, (c: string) => string> = {
  'Spawnpoint': (c) => `<line x1="5" y1="3" x2="5" y2="22"/><path d="M5 3h12l-3 4.5L17 12H5" fill="${c}" fill-opacity="0.25"/>`,
  'Building': (c) => `<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><rect x="9" y="9" width="6" height="3" fill="${c}"/>`,
  'Extraction Point': () => `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  'Enemy Location': (c) => `<path d="M12 2L2 20h20L12 2z"/><line x1="12" y1="9" x2="12" y2="14" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="${c}" stroke="none"/>`,
  'Zombie Nest': (c) => `<rect x="5" y="4" width="14" height="12" rx="5"/><circle cx="9" cy="10" r="1.5" fill="${c}" stroke="none"/><circle cx="15" cy="10" r="1.5" fill="${c}" stroke="none"/><path d="M9 16v2M12 16v3M15 16v2" stroke-linecap="round"/><line x1="8" y1="22" x2="16" y2="22"/>`,
  'Key Spawn Location': () => `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>`,
  'Locked Door': () => `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  'Quarantine Zone': () => `<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>`,
  'Medical': () => `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
  'Shop': () => `<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`,
  'Landmark': () => `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
  'Subway Station': (c) => `<rect x="3" y="3" width="18" height="18" rx="3" stroke="${c}" stroke-width="2"/><path d="M7 16V8l5 5 5-5v8"/>`,
  'Infiltration': (c) => `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="${c}" stroke="none"/>`,
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

// Inline SVG with outline for map pins — always crisp at any zoom
export function CategoryIconOutlined({ category, size = 25, color = 'currentColor' }: { category: LocationCategory; size?: number; color?: string }) {
  const builder = iconSvgBuilders[category] || iconSvgBuilders['Other'];
  const inner = builder(color);
  return (
    <svg width={size} height={size} viewBox="-1 -1 26 26" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke="rgba(0,0,0,0.7)" strokeWidth="3.5" dangerouslySetInnerHTML={{ __html: inner }} />
      <g stroke={color} strokeWidth="2" dangerouslySetInnerHTML={{ __html: inner }} />
    </svg>
  );
}

export function ResetPositionIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

export function ResetRotationIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className={className}>
      <path d="M21 12a9 9 0 1 1-9-9" />
      <polyline points="21 3 21 9 15 9" />
      <path d="M21 9l-6-6" />
    </svg>
  );
}
