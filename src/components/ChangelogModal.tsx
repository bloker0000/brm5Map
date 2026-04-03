import { useState, useEffect } from 'react';
import './ChangelogModal.css';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.6.2',
    date: '2026-04-04',
    changes: [
      'Major performance overhaul: moved pins to screen-space overlay, eliminating GPU re-rasterization during pan/zoom/rotate',
      'Map layer now contains only the map image for fast compositing',
      'Pin icons are always crisp at any zoom level — no more pixelation',
      'Reduced DOM nodes per pin from ~15 to 3',
      'Prevented accidental pin clicks while dragging or rotating the map',
    ],
  },
  {
    version: '1.6.1',
    date: '2026-04-01',
    changes: [
      'Significantly improved map rotation performance - rotation gesture no longer triggers React re-renders',
      'Replaced inline SVG pin icons with cached data URI images, reducing DOM node count from ~600 to 102',
      'Increased icon render resolution (4×) to eliminate pixelation at higher zoom levels',
      'Pin icons are now promoted to GPU compositor layers for smoother hover animations',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-04-01',
    changes: [
      'Large location update: 26 new locations added, many existing ones updated with better descriptions and images',
      'Renamed "Locked Doors" category to "Locked Door"',
      'Updated category colors for better visibility and distinction between types',
      'Zombie Nest and Enemy Location no longer share the same color',
      'Cleaned up Zombie Nest icon',
      'Slightly reduced icon drop-shadow for cleaner look on light backgrounds',
      'Increased pin size for improved visibility',
      'Removed leftover test markers',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-03-26',
    changes: [
      'Added category icons on map pins, each category now displays its own SVG icon instead of a colored dot',
      'Icons stay upright when rotating the map',
      'Renamed "Enemy Outpost" category to "Enemy Location"',
      'Renamed "Key Use Location" category to "Locked Door"',
      'Added new "Infiltration" category with eye icon',
      'Added new "Raid" category with shield icon',
      'Improved map pan/zoom performance significantly.. GPU-accelerated rendering, pins no longer re-render during drag',
      'Admin panel now auto-saves changes directly to the locations file on localhost',
      'Admin panel: added manual Save button alongside existing Export',
      'Fixed location detail modal icon alignment',
    ],
  },
  {
    version: '1.4.4',
    date: '2026-01-07',
    changes: [
      'More location updates',
      'Compass improvements: removed background circle and shadow for cleaner appearance',
      'Added responsive compass sizing (scales based on screen size)',
      'Added hover effect to enlarge compass for easier interaction',
      'Fixed compass drag rotation - now smoothly follows cursor without snapping',
      'Compass rotation now only responds to left-click drag (not right-click)',
      'Added sidebar toggle button to hide/show sidebar for more map space',
      'Added compass toggle button in sidebar to hide/show compass',
      'Fixed map rotation to pivot around viewport center instead of map center',
      'Fixed rotation-aware dragging - map now moves correctly when rotated',
      'Fixed rotation-aware zooming - zoom now correctly follows pointer when map is rotated',
    ],
  },
  {
    version: '1.4.3',
    date: '2026-01-07',
    changes: [
      'Updated hospital location images and description',
    ],
  },
  {
    version: '1.4.2',
    date: '2026-01-07',
    changes: [
      'Added water treatment plant office location',
    ],
  },
  {
    version: '1.4.1',
    date: '2026-01-07',
    changes: [
      'Updated Water treatment plant location',
      'Small hotfix for the image gallery thumbnail scrolling behavior',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-01-07',
    changes: [
      'Updated location descriptions to markdown format for better readability',
      'Large update to the admin panel',
    ],
  },
  {
    version: '1.3.3',
    date: '2026-01-06',
    changes: [
      'Added/tweaked some map locations',
    ],
  },
  {
    version: '1.3.2',
    date: '2026-01-05',
    changes: [
      'Improved preloader',
    ],
  },
  {
    version: '1.3.1',
    date: '2026-01-05',
    changes: [
      'Added FAQ section to About modal',
      'Some map changes, added images and tweaked coordinates',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-01-04',
    changes: [
      'Fixed SVG map and pin pixelation when zooming',
      'Improved visuals between spawn and extraction points with different colors',
      'Redesigned location category icons',
      'Some location coordinate refinements',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-01-02',
    changes: [
      'Added fullscreen image lightbox with zoom controls',
      'Double-click or use +/- buttons to zoom images up to 500%',
      'Pan zoomed images by dragging',
      'Navigate images with arrow keys in lightbox',
      'Added thumbnail navigation in location modal and lightbox',
      'Tooltip now shows automatic slideshow when hovering pins with multiple images',
      'Added loading spinners for images',
      'Click to enlarge hint on modal images',
      'Image count indicator in tooltips',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-01-02',
    changes: [
      'Rebranded to BRMap5 (Blackhawk Rescue Map 5)',
      'Added Subway Station category',
      'Consolidated building categories (Residence, Office Building Small/Large) into Building',
      'Added clear button for location selection',
      'Simplified location unselect - no longer need Ctrl+click for last selected item',
      'Added Changelog modal',
      'Separated reset rotation and reset position buttons',
      'Improved loading screen with minimum stage duration',
      'Updated logo design',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-12-15',
    changes: [
      'Initial release',
      'Interactive map with pan, zoom, and rotate',
      'Location pins with categories',
      'Search and filter functionality',
      'Location details modal with images',
      'Visitor counter',
    ],
  },
];

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`changelog-modal-overlay ${isOpen ? 'open' : 'closing'}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="changelog-modal" onClick={e => e.stopPropagation()}>
        <div className="changelog-modal-header">
          <h2>Changelog</h2>
          <button className="changelog-modal-close" onClick={onClose}>X</button>
        </div>

        <div className="changelog-modal-content">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="changelog-entry">
              <div className="changelog-entry-header">
                <span className="changelog-version">v{entry.version}</span>
                <span className="changelog-date">{entry.date}</span>
              </div>
              <ul className="changelog-changes">
                {entry.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
