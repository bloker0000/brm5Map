// main app, holds most of the state

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Preloader,
  InteractiveMap,
  Tooltip,
  LocationModal,
  CategoryFilter,
  AboutModal,
  ChangelogModal,
  hasUnseenChangelog,
  markChangelogSeen,
  LocationsList,
  AdminPanel,
} from './components';
import { useLocations } from './hooks/useLocations';
import type { MapLocation, LocationCategory } from './types/location';
import './App.css';

const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BG_CREDITS = [
  { name: 'Platinum Five', url: 'https://www.roblox.com/communities/4668709/PLATINUM-FIVE#!/about' },
  { name: 'MentalShocked', url: 'https://www.reddit.com/user/MentalShocked/' },
  { name: 'buymechickensalt', url: 'https://x.com/BuymetheWeeb' },
  { name: 'buymechickensalt', url: 'https://x.com/BuymetheWeeb' },
  { name: 'rinchantea', url: 'https://x.com/RinChanTea' },
  { name: 'mister.roztov', url: 'https://sites.google.com/view/roztovportfolio?usp=sharing' },
  { name: 'postal__pal', url: 'https://www.roblox.com/users/1538934843/profile?friendshipSourceType=PlayerSearch' },
  { name: 'basically_gdg', url: null },
  { name: 'a5t3r1k', url: 'https://www.roblox.com/users/1458471315/profile?friendshipSourceType=PlayerSearch' },
  { name: 'buymechickensalt', url: 'https://x.com/BuymetheWeeb' },
  { name: 'ryz_vik', url: null },
  { name: 'docc_a', url: null },
  { name: 'ala_koli', url: 'https://x.com/ala_koli' },
  { name: 'kenemony', url: null },
  { name: 'a5t3r1k', url: 'https://www.roblox.com/users/1458471315/profile?friendshipSourceType=PlayerSearch' },
  { name: 'postal__pal', url: 'https://www.roblox.com/users/1538934843/profile?friendshipSourceType=PlayerSearch' },
];

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [highlightedLocation, setHighlightedLocation] = useState<MapLocation | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [focusedLocations, setFocusedLocations] = useState<MapLocation[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminClickPosition, setAdminClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [adminFormCategory, setAdminFormCategory] = useState<LocationCategory>('Other');
  const [adminViewMode, setAdminViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [adminDragMode, setAdminDragMode] = useState(false);

  const {
    locations,
    filteredLocations,
    selectedCategories,
    toggleCategory,
    clearFilters,
    allCategories,
    selectedLocation,
    setSelectedLocation,
    hoveredLocation,
    setHoveredLocation,
    addLocation,
    updateLocation,
    deleteLocation,
    importLocations,
    saveStatus,
    manualSave,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useLocations();

  useEffect(() => {
    if (hasUnseenChangelog()) setIsChangelogOpen(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isChangelogOpen) {
          markChangelogSeen();
          setIsChangelogOpen(false);
        } else if (isAdminOpen) {
          setIsAdminOpen(false);
        } else if (isAboutOpen) {
          setIsAboutOpen(false);
        } else if (selectedLocation) {
          setSelectedLocation(null);
        }
      }
      if (IS_DEV && e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsAdminOpen(prev => !prev);
      }
      if (IS_DEV && isAdminOpen && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLocation, setSelectedLocation, isAboutOpen, isAdminOpen, isChangelogOpen, undo, redo]);

  const handleLoaded = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => {
      setIsFadingOut(true);
    }, 100);
  }, []);

  const handleFadeComplete = useCallback(() => {
    setIsPreloaderVisible(false);
  }, []);

  const handleLocationClick = useCallback(
    (location: MapLocation) => {
      setSelectedLocation(location);
    },
    [setSelectedLocation]
  );

  const handleMapClick = useCallback((x: number, y: number) => {
    if (IS_DEV && isAdminOpen && (adminViewMode === 'add' || adminViewMode === 'edit')) {
      setAdminClickPosition({ x, y });
    }
  }, [isAdminOpen, adminViewMode]);

  const handlePinDrag = useCallback((locationId: string, x: number, y: number) => {
    updateLocation(locationId, { x, y });
  }, [updateLocation]);

  const handleAddLocation = useCallback((location: Omit<MapLocation, 'id'>) => {
    addLocation(location);
    setAdminClickPosition(null);
  }, [addLocation]);

  const handleToggleLocation = useCallback(
    (location: MapLocation, multiSelect: boolean) => {
      setSelectedLocations(prev => {
        const next = new Set(multiSelect ? prev : []);
        if (next.has(location.id)) {
          next.delete(location.id);
        } else {
          next.add(location.id);
        }

        const locsToFocus = filteredLocations.filter(loc => next.has(loc.id));
        if (locsToFocus.length > 0) {
          setFocusedLocations([...locsToFocus]);
          setTimeout(() => setFocusedLocations([]), 100);
        }

        return next;
      });
    },
    [filteredLocations]
  );

  const handleLocationSelect = useCallback(
    (location: MapLocation) => {
      setHighlightedLocation(location);
      setTimeout(() => setHighlightedLocation(null), 500);
      setSelectedLocation(location);
    },
    [setSelectedLocation]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedLocations(new Set());
  }, []);

  const handleCloseChangelog = useCallback(() => {
    markChangelogSeen();
    setIsChangelogOpen(false);
  }, []);

  const displayedLocations = useMemo(
    () => (selectedLocations.size > 0
      ? filteredLocations.filter(loc => selectedLocations.has(loc.id))
      : filteredLocations),
    [filteredLocations, selectedLocations]
  );

  const currentCredit = BG_CREDITS[currentBgIndex];

  return (
    <>
      {isPreloaderVisible && (
        <Preloader
          onLoaded={handleLoaded}
          isFadingOut={isFadingOut}
          onFadeComplete={handleFadeComplete}
        />
      )}
      <div className={`app ${isLoading ? 'app-hidden' : 'app-visible'}`}>
        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
          onOpenChangelog={() => setIsChangelogOpen(true)}
        />
        <ChangelogModal isOpen={isChangelogOpen} onClose={handleCloseChangelog} />

        <button
          className={`sidebar-toggle-btn${showSidebar ? '' : ' sidebar-hidden'}`}
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          <span className="sidebar-toggle-glyph">{showSidebar ? '◀' : '▶'}</span>
        </button>

        <div className={`sidebar${showSidebar ? '' : ' hidden'}`}>
          <div className="sidebar-header">
            <div className="sidebar-lockup">
              <img src="/logos/logowhite.svg" alt="BRMap5" className="sidebar-logo" />
              <span className="sidebar-lockup-secondary">Operation CRYO Zombies</span>
            </div>
            <div className="sidebar-readout">
              <div className="readout-row">
                <span className="readout-value tabular">{locations.length}</span>
                <span className="readout-label">Markers</span>
              </div>
              <div className="readout-row">
                <span className="readout-value tabular">{displayedLocations.length}</span>
                <span className="readout-label">Shown</span>
              </div>
            </div>
          </div>

          <div className="sidebar-tabs">
            <button
              className={`brm-tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
            <button
              className={`brm-tab ${activeTab === 'locations' ? 'active' : ''}`}
              onClick={() => setActiveTab('locations')}
            >
              Locations
            </button>
          </div>

          <div className="sidebar-content">
            <div className="sidebar-panel" key={activeTab}>
              {activeTab === 'categories' && (
                <CategoryFilter
                  categories={allCategories}
                  selectedCategories={selectedCategories}
                  onToggle={toggleCategory}
                  onClear={clearFilters}
                />
              )}

              {activeTab === 'locations' && (
                <LocationsList
                  locations={filteredLocations}
                  selectedLocations={selectedLocations}
                  onToggleLocation={handleToggleLocation}
                  onSelectLocation={handleLocationSelect}
                  onClearSelection={handleClearSelection}
                />
              )}
            </div>
          </div>

          <div className="sidebar-display">
            <h2 className="brm-section-title">Display</h2>
            <div className="option-row">
              <span className="option-label">Map pins</span>
              <div className="brm-segment">
                <button aria-pressed={showPins} onClick={() => setShowPins(true)}>On</button>
                <button aria-pressed={!showPins} onClick={() => setShowPins(false)}>Off</button>
              </div>
            </div>
            <div className="option-row">
              <span className="option-label">Compass</span>
              <div className="brm-segment">
                <button aria-pressed={showCompass} onClick={() => setShowCompass(true)}>On</button>
                <button aria-pressed={!showCompass} onClick={() => setShowCompass(false)}>Off</button>
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="brm-btn sidebar-about" onClick={() => setIsAboutOpen(true)}>
              About
            </button>
            <div className="footer-credit">
              <span className="footer-credit-label">Art</span>
              {currentCredit?.url ? (
                <a href={currentCredit.url} target="_blank" rel="noopener noreferrer">
                  {currentCredit.name}
                </a>
              ) : (
                <span>{currentCredit?.name}</span>
              )}
            </div>
          </div>
        </div>

      <div className="map-container">
        <InteractiveMap
          locations={displayedLocations}
          hoveredLocation={hoveredLocation}
          selectedLocation={selectedLocation}
          onHover={setHoveredLocation}
          onClick={handleLocationClick}
          onMapClick={handleMapClick}
          highlightedLocation={highlightedLocation}
          isAdminMode={IS_DEV && isAdminOpen}
          showPins={showPins}
          showCompass={showCompass}
          onBgChange={setCurrentBgIndex}
          focusedLocations={focusedLocations}
          onPinDrag={handlePinDrag}
          placeholderPin={IS_DEV && isAdminOpen && adminViewMode === 'add' && adminClickPosition ? { x: adminClickPosition.x, y: adminClickPosition.y, category: adminFormCategory } : null}
          isDragMode={IS_DEV && isAdminOpen && adminDragMode}
        />
      </div>

      {!isMobile && <Tooltip location={hoveredLocation} />}

      <LocationModal
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />

      {IS_DEV && (
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          locations={locations}
          onAdd={handleAddLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
          clickPosition={adminClickPosition}
          saveStatus={saveStatus}
          onManualSave={manualSave}
          onFormCategoryChange={setAdminFormCategory}
          onModeChange={setAdminViewMode}
          onDragModeChange={setAdminDragMode}
          onImport={importLocations}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}
    </div>
    </>
  );
}

export default App;
