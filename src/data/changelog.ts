// changelog entries and the "have you seen it yet" check

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.11.0',
    date: '2026-09-06',
    changes: [
      'Every location image is now served from this site instead of imgur, so the galleries work in countries where imgur is blocked',
      'Location images are about a fifteenth of the size they were, so a gallery opens much faster on a slow connection',
      'The background artwork loads about twenty times quicker, which is most of the wait before the map appears',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-09-06',
    changes: [
      'Locations now list the missions that take place there, with a link straight to that mission in the library',
      'Added 28 images to seven locations that had none: Fairfield Inn & Suites, Fluton Market, Hospital Helipad, Parking Lot, Peck Slip Plaza, and both damaged bridges',
      'Wrote out all three raids, from the lobby through to the exfil, with what is worth picking up on the way',
      'Filled in the blank descriptions on Fluton Market, Fairfield Inn & Suites, Fresh Stop Supermarket, Gym Panda, Parking Lot, Peck Slip Plaza, Fulton x William Building, Vault Locker, the UNS New York and two player spawns',
      'Added mission relevance to 23 more locations, including where to find the Asset Re-Appropriation keycard, The Deep End lab key, and the Keeping the Lights On fan blades',
      'Named the mission on markers that only said a mission used them, like Dorsia and the Substation',
      'Image thumbnail strips load a smaller file, so opening a gallery is quicker',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-09-05',
    changes: [
      'New Mission Library page with all 63 zombies missions, open it from the sidebar',
      'Every mission shows its briefing and debriefing, step by step objectives, rewards, level and difficulty, and what unlocks it',
      'Missions that roll a random spawn point list every possible variant',
      'Objectives the game never puts a waypoint on are shown as in-game screenshots, click one to open it full size',
      'Technical view on any mission for the raw task list out of the game files',
      'Search and filter missions by giver, difficulty, gasmask, raids, and unmarked objectives',
      'Missions have their own links, so a single mission can be shared directly',
      'Mission search is fuzzy, so it still finds a mission when the name is misspelled',
      'Mission Library shows a blurred piece of the background artwork, credited in the sidebar',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-08-17',
    changes: [
      'Redesigned the entire site to match the in-game interface',
      'New title screen while the map loads',
      'Rebuilt the sidebar: logo, marker counts, and On/Off toggles for pins and the compass',
      'Much smoother panning and zooming while markers are shown',
      'Added animations throughout — opening and closing panels, switching tabs, expanding categories, and selecting a marker',
      'Replaced the work-in-progress notice with this changelog, which now opens whenever there is an update',
      'New loading indicator for location images',
      'Fixed the first image of a location getting stuck on loading',
      'Fixed hover cards running off the edge of the screen',
      'Fixed the Categories tab being empty on phones',
      'Fixed button outlines being cut off, and various small spacing and alignment issues',
    ],
  },
  {
    version: '1.7.1',
    date: '2026-04-23',
    changes: [
      'Added full description and images to Hot Mug Cafe, including mission relevance for Research Fellow pt. 3',
      'Added descriptions and images to all three Drop-Off Points (Abrams Square, Ground Zero, Ground Zero 2)',
      'Added full description and images to Quill Jewellery Outlet',
      'Added additional images to Quill Jewelry Backroom',
      'Rewrote Military Checkpoint, Military Checkpoint Garage, and Armory with detailed descriptions and 14 new images',
      'Added description and image to Trashed Basketball Court, including Research Fellow pt. 3 mission relevance',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-04-12',
    changes: [
      'Updated map to latest game version',
      'Added Safe category',
      'Updated Explorable Area icon to a single wide window',
      'Admin panel: undo/redo support (Ctrl+Z / Ctrl+Shift+Z), per-field grouping',
      'Admin panel: cancel now reverts position changes',
      'Admin panel: confirm prompts when discarding unsaved edits',
      'Fixed pin positions not updating after filtering',
      'Fixed editing one marker incorrectly moving another marker to the same position',
    ],
  },
  {
    version: '1.6.3',
    date: '2026-04-06',
    changes: [
      'Updated most locked room markers with accurate positions (TotroX)',
      'Added new location markers across the map (TotroX)',
    ],
  },
  {
    version: '1.6.2',
    date: '2026-04-04',
    changes: [
      'Major performance overhaul: moved pins to screen-space overlay, eliminating lag during pan/zoom/rotate',
      'Pin icons are always crisp at any zoom level',
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
      'Added new "Drop-Off Point" category with eye icon',
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
      'Consolidated Explorable Area categories (Residence, Office Explorable Area Small/Large) into Explorable Area',
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

export const LATEST_VERSION = CHANGELOG[0].version;

const SEEN_KEY = 'brm5_map_changelog_version';

export function hasUnseenChangelog(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) !== LATEST_VERSION;
  } catch {
    return false;
  }
}

export function markChangelogSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, LATEST_VERSION);
  } catch {
    return;
  }
}
