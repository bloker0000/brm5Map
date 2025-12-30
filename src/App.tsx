import { useState, useEffect, useCallback } from 'react';
import {
  Preloader,
  InteractiveMap,
  Tooltip,
  LocationModal,
  SearchBar,
  CategoryFilter,
  // AdminPanel,
  WelcomeModal,
} from './components';
import { useLocations } from './hooks/useLocations';
import type { MapLocation } from './types/location';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // const [isAdminOpen, setIsAdminOpen] = useState(false);
  // const [adminClickPosition, setAdminClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightedLocation, setHighlightedLocation] = useState<MapLocation | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    locations,
    filteredLocations,
    searchQuery,
    setSearchQuery,
    selectedCategories,
    toggleCategory,
    clearFilters,
    allCategories,
    selectedLocation,
    setSelectedLocation,
    hoveredLocation,
    setHoveredLocation,
    // addLocation,
    // updateLocation,
    // deleteLocation,
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
        // if (isAdminOpen) {
        //   setIsAdminOpen(false);
        // } else if (selectedLocation) {
        if (selectedLocation) {
          setSelectedLocation(null);
        }
      }
      // if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      //   e.preventDefault();
      //   setIsAdminOpen((prev) => !prev);
      // }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLocation, setSelectedLocation]);

  const handleLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleLocationClick = useCallback(
    (location: MapLocation) => {
      setSelectedLocation(location);
    },
    [setSelectedLocation]
  );

  // const handleMapClick = useCallback((x: number, y: number) => {
  //   setAdminClickPosition({ x, y });
  // }, []);

  const handleSearchSelect = useCallback(
    (location: MapLocation) => {
      setHighlightedLocation(location);
      setTimeout(() => setHighlightedLocation(null), 500);
      setSelectedLocation(location);
    },
    [setSelectedLocation]
  );

  if (isLoading) {
    return <Preloader onLoaded={handleLoaded} />;
  }

  return (
    <div className="app">
      <WelcomeModal />
      
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">BRM5 MAP</h1>
          <div className="sidebar-subtitle">Blackhawk Rescue Mission 5</div>
        </div>

        <div className="sidebar-content">
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            results={filteredLocations}
            onSelectLocation={handleSearchSelect}
          />

          {!isMobile && (
            <CategoryFilter
              categories={allCategories}
              selectedCategories={selectedCategories}
              onToggle={toggleCategory}
              onClear={clearFilters}
            />
          )}

          <div className="sidebar-stats">
            <div className="stat">
              <span className="stat-value">{locations.length}</span>
              <span className="stat-label">Total Locations</span>
            </div>
            <div className="stat">
              <span className="stat-value">{filteredLocations.length}</span>
              <span className="stat-label">Showing</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          {/* <div className="sidebar-hint">Ctrl+Shift+A for Admin</div> */}
        </div>
      </div>

      <div className="map-container">
        <InteractiveMap
          locations={filteredLocations}
          hoveredLocation={hoveredLocation}
          selectedLocation={selectedLocation}
          onHover={setHoveredLocation}
          onClick={handleLocationClick}
          onMapClick={() => {}}
          highlightedLocation={highlightedLocation}
          isAdminMode={false}
        />
      </div>

      {!isMobile && (
        <Tooltip location={hoveredLocation} mousePosition={mousePosition} />
      )}

      <LocationModal
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />

      {/* <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        locations={locations}
        onAdd={addLocation}
        onUpdate={updateLocation}
        onDelete={deleteLocation}
        clickPosition={adminClickPosition}
      /> */}
    </div>
  );
}

export default App;

