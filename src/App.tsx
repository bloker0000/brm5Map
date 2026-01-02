import { useState, useEffect, useCallback } from 'react';
import {
  Preloader,
  InteractiveMap,
  Tooltip,
  LocationModal,
  CategoryFilter,
  WelcomeModal,
  AboutModal,
  LocationsList,
  AdminPanel,
} from './components';
import { useLocations } from './hooks/useLocations';
import type { MapLocation } from './types/location';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [highlightedLocation, setHighlightedLocation] = useState<MapLocation | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [focusedLocations, setFocusedLocations] = useState<MapLocation[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminClickPosition, setAdminClickPosition] = useState<{ x: number; y: number } | null>(null);

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
  } = useLocations();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAdminOpen) {
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLocation, setSelectedLocation, isAboutOpen, isAdminOpen]);

  const handleLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleLocationClick = useCallback(
    (location: MapLocation) => {
      setSelectedLocation(location);
    },
    [setSelectedLocation]
  );

  const handleMapClick = useCallback((x: number, y: number) => {
    if (IS_DEV && isAdminOpen) {
      setAdminClickPosition({ x, y });
    }
  }, [isAdminOpen]);

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

  const displayedLocations = selectedLocations.size > 0
    ? filteredLocations.filter(loc => selectedLocations.has(loc.id))
    : filteredLocations;

  if (isLoading) {
    return <Preloader onLoaded={handleLoaded} />;
  }

  const currentCredit = BG_CREDITS[currentBgIndex];

  return (
    <div className="app">
      <WelcomeModal />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">BRMAP5</h1>
          <div className="sidebar-subtitle">Operation CRYO Zombies</div>
        </div>

        <div className="sidebar-actions">
          <button 
            className={`sidebar-action-btn ${showPins ? 'active' : ''}`}
            onClick={() => setShowPins(!showPins)}
          >
            {showPins ? 'HIDE PINS' : 'SHOW PINS'}
          </button>
          <button 
            className="sidebar-action-btn"
            onClick={() => setIsAboutOpen(true)}
          >
            ABOUT
          </button>
        </div>

        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
        </div>

        <div className="sidebar-content">
          {activeTab === 'categories' && !isMobile && (
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

          <div className="sidebar-stats">
            <div className="stat">
              <span className="stat-value">{locations.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-value">{displayedLocations.length}</span>
              <span className="stat-label">Showing</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <span className="footer-credit">
              Current Art By: {currentCredit?.url ? (
                <a href={currentCredit.url} target="_blank" rel="noopener noreferrer">
                  {currentCredit.name}
                </a>
              ) : (
                currentCredit?.name
              )}
            </span>
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
          onBgChange={setCurrentBgIndex}
          focusedLocations={focusedLocations}
        />
      </div>

      {!isMobile && (
        <Tooltip location={hoveredLocation} mousePosition={mousePosition} />
      )}

      <LocationModal
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />

      {IS_DEV && (
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          locations={locations}
          onAdd={addLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
          clickPosition={adminClickPosition}
        />
      )}
    </div>
  );
}

export default App;