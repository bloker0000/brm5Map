import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  Preloader,
  InteractiveMap,
  Tooltip,
  LocationModal,
  CategoryFilter,
  AboutModal,
  ChangelogModal,
  ErrorBoundary,
  shouldShowChangelog,
  markChangelogSeen,
  LocationsList,
} from './components';
import type { FocusRequest } from './components/InteractiveMap';
import { preloadMarkdown } from './components/markdownLoader';
import { useLocations } from './hooks/useLocations';
import { useMediaQuery, PHONE_QUERY, HOVER_QUERY } from './hooks/useMediaQuery';
import type { MapLocation, LocationCategory } from './types/location';
import { BG_CREDITS, randomBgIndex } from './data/backgrounds';
import './App.css';

// the mission data is a third of the bundle, so it only loads on its own route
const MissionsPage = lazy(() =>
  import('./components/MissionsPage').then(m => ({ default: m.MissionsPage }))
);

// a production build leaves the whole panel out, not just hides it
const AdminPanel = import.meta.env.DEV
  ? lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })))
  : null;

const MISSIONS_ROUTE = /^#\/missions(?:\/([A-Za-z0-9_-]+))?\/?$/;
// same as the title in index.html, restored when coming back from the mission library
const SITE_TITLE = 'BRMap5 - Blackhawk Rescue Mission 5 Zombies Map';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(shouldShowChangelog);
  const [showPins, setShowPins] = useState(true);
  // on a phone the sidebar covers the map, so it starts out of the way
  const [showSidebar, setShowSidebar] = useState(() => !window.matchMedia(PHONE_QUERY).matches);
  const [showCompass, setShowCompass] = useState(true);
  // one artwork per visit, shared by the loading screen, the map and the mission library
  const [bgIndex] = useState(randomBgIndex);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminClickPosition, setAdminClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [adminFormCategory, setAdminFormCategory] = useState<LocationCategory>('Other');
  const [adminViewMode, setAdminViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [adminDragMode, setAdminDragMode] = useState(false);
  const [route, setRoute] = useState(() => window.location.hash);

  const isPhone = useMediaQuery(PHONE_QUERY);
  const canHover = useMediaQuery(HOVER_QUERY);

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
    const sync = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const navigate = useCallback((hash: string) => {
    window.history.pushState(null, '', hash || window.location.pathname + window.location.search);
    setRoute(hash);
  }, []);

  const missionRoute = route.match(MISSIONS_ROUTE);
  const isMissionsRoute = missionRoute !== null;
  const missionId = missionRoute?.[1] ?? null;

  useEffect(() => {
    if (!isMissionsRoute) document.title = SITE_TITLE;
  }, [isMissionsRoute]);

  const closeChangelog = useCallback(() => {
    markChangelogSeen();
    setIsChangelogOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMissionsRoute) {
          // like the admin panel, back out of the mission first, then the page
          navigate(missionId ? '#/missions' : '');
        } else if (isChangelogOpen) {
          closeChangelog();
        } else if (isAdminOpen && adminViewMode === 'list') {
          // in add/edit the panel handles escape itself, backing out to the list
          setIsAdminOpen(false);
        } else if (isAboutOpen) {
          setIsAboutOpen(false);
        } else if (selectedLocation) {
          setSelectedLocation(null);
        } else if (isPhone && showSidebar) {
          setShowSidebar(false);
        }
      }
      if (import.meta.env.DEV && e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsAdminOpen(prev => !prev);
      }
      if (import.meta.env.DEV && isAdminOpen && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
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
  }, [selectedLocation, setSelectedLocation, isAboutOpen, isAdminOpen, adminViewMode, isChangelogOpen, closeChangelog, undo, redo, isMissionsRoute, missionId, navigate, isPhone, showSidebar]);

  const handleLoaded = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => {
      setIsFadingOut(true);
    }, 100);
    preloadMarkdown();
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

  const handleCloseLocation = useCallback(() => {
    setSelectedLocation(null);
  }, [setSelectedLocation]);

  const handleMapClick = useCallback((x: number, y: number) => {
    if (import.meta.env.DEV && isAdminOpen && (adminViewMode === 'add' || adminViewMode === 'edit')) {
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

  // a new request each time, so asking for the same place twice still moves the map
  const focusOn = useCallback((locs: MapLocation[]) => {
    setFocusRequest(prev => ({ locations: locs, id: (prev?.id ?? 0) + 1 }));
  }, []);

  const handleToggleLocation = useCallback(
    (location: MapLocation, multiSelect: boolean) => {
      const next = new Set(multiSelect ? selectedLocations : []);
      if (next.has(location.id)) {
        next.delete(location.id);
      } else {
        next.add(location.id);
      }
      setSelectedLocations(next);

      const locsToFocus = filteredLocations.filter(loc => next.has(loc.id));
      if (locsToFocus.length > 0) {
        focusOn(locsToFocus);
        if (isPhone) setShowSidebar(false);
      }
    },
    [selectedLocations, filteredLocations, focusOn, isPhone]
  );

  const handleLocationSelect = useCallback(
    (location: MapLocation) => {
      focusOn([location]);
      setSelectedLocation(location);
      if (isPhone) setShowSidebar(false);
    },
    [focusOn, setSelectedLocation, isPhone]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedLocations(new Set());
  }, []);

  const displayedLocations = useMemo(
    () => (selectedLocations.size > 0
      ? filteredLocations.filter(loc => selectedLocations.has(loc.id))
      : filteredLocations),
    [filteredLocations, selectedLocations]
  );

  const placeholderPin = useMemo(
    () => (import.meta.env.DEV && isAdminOpen && adminViewMode === 'add' && adminClickPosition
      ? { x: adminClickPosition.x, y: adminClickPosition.y, category: adminFormCategory }
      : null),
    [isAdminOpen, adminViewMode, adminClickPosition, adminFormCategory]
  );

  const currentCredit = BG_CREDITS[bgIndex];

  if (isMissionsRoute) {
    return (
      <ErrorBoundary
        title="The mission library did not load"
        message="The site was probably updated while you had it open. Reloading gets the new version."
        onBack={() => navigate('')}
      >
        <Suspense
          fallback={
            <div className="missions-boot">
              <div className="brm-loader">
                <div className="brm-loader-track" />
                <span className="brm-loader-label">Loading missions</span>
              </div>
            </div>
          }
        >
          <MissionsPage
            missionId={missionId}
            bgIndex={bgIndex}
            onSelectMission={id => navigate(id ? `#/missions/${id}` : '#/missions')}
            onExit={() => navigate('')}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <>
      {isPreloaderVisible && (
        <Preloader
          bgIndex={bgIndex}
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
        {/* waits for the loading screen, it cannot take focus while the app is hidden */}
        <ChangelogModal isOpen={isChangelogOpen && !isLoading} onClose={closeChangelog} />

        <button
          className={`sidebar-toggle-btn${showSidebar ? '' : ' sidebar-hidden'}`}
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
          aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
          aria-expanded={showSidebar}
          aria-controls="sidebar"
        >
          <span className="sidebar-toggle-glyph" aria-hidden="true">{showSidebar ? '◀' : '▶'}</span>
        </button>

        {isPhone && showSidebar && (
          <div className="sidebar-scrim" onClick={() => setShowSidebar(false)} />
        )}

        <aside id="sidebar" className={`sidebar${showSidebar ? '' : ' hidden'}`}>
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
              aria-pressed={activeTab === 'categories'}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
            <button
              className={`brm-tab ${activeTab === 'locations' ? 'active' : ''}`}
              aria-pressed={activeTab === 'locations'}
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

          <div className="sidebar-nav">
            <button className="brm-btn sidebar-missions" onClick={() => navigate('#/missions')}>
              Mission Library
              <span className="sidebar-missions-glyph" aria-hidden="true">▶</span>
            </button>
          </div>

          <div className="sidebar-display">
            <h2 className="brm-section-title">Display</h2>
            <div className="option-row">
              <span className="option-label">Map pins</span>
              <div className="brm-segment" role="group" aria-label="Map pins">
                <button aria-pressed={showPins} onClick={() => setShowPins(true)}>On</button>
                <button aria-pressed={!showPins} onClick={() => setShowPins(false)}>Off</button>
              </div>
            </div>
            <div className="option-row">
              <span className="option-label">Compass</span>
              <div className="brm-segment" role="group" aria-label="Compass">
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
        </aside>

        <main className="map-container">
          <InteractiveMap
            locations={displayedLocations}
            hoveredLocation={hoveredLocation}
            selectedLocation={selectedLocation}
            onHover={setHoveredLocation}
            onClick={handleLocationClick}
            onMapClick={handleMapClick}
            focusRequest={focusRequest}
            bgIndex={bgIndex}
            isAdminMode={import.meta.env.DEV && isAdminOpen}
            showPins={showPins}
            showCompass={showCompass}
            onPinDrag={handlePinDrag}
            placeholderPin={placeholderPin}
            isDragMode={import.meta.env.DEV && isAdminOpen && adminDragMode}
          />
        </main>

        {canHover && <Tooltip location={hoveredLocation} />}

        <LocationModal
          location={selectedLocation}
          onClose={handleCloseLocation}
        />

        {AdminPanel && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}
      </div>
    </>
  );
}

export default App;
