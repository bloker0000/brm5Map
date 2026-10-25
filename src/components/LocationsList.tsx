// sidebar list of locations, grouped by category

import { useState, useMemo } from 'react';
import type { MapLocation, LocationCategory } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './LocationsList.css';

interface LocationsListProps {
  locations: MapLocation[];
  selectedLocations: Set<string>;
  onToggleLocation: (location: MapLocation, multiSelect: boolean) => void;
  onSelectLocation: (location: MapLocation) => void;
  onClearSelection: () => void;
}

export function LocationsList({
  locations,
  selectedLocations,
  onToggleLocation,
  onSelectLocation,
  onClearSelection,
}: LocationsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<LocationCategory>>(new Set());

  const query = searchQuery.trim().toLowerCase();

  const filteredLocations = useMemo(() => {
    if (!query) return locations;
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      loc.category.toLowerCase().includes(query) ||
      loc.description?.toLowerCase().includes(query)
    );
  }, [locations, query]);

  const groupedLocations = useMemo(() => {
    const groups = new Map<LocationCategory, MapLocation[]>();
    filteredLocations.forEach(loc => {
      const group = groups.get(loc.category);
      if (group) {
        group.push(loc);
      } else {
        groups.set(loc.category, [loc]);
      }
    });
    return [...groups];
  }, [filteredLocations]);

  const toggleCategory = (category: LocationCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleItemClick = (e: React.MouseEvent, location: MapLocation) => {
    const multiSelect = e.ctrlKey || e.metaKey;
    const isSelected = selectedLocations.has(location.id);
    const isOnlyOneSelected = selectedLocations.size === 1 && isSelected;

    if (isOnlyOneSelected) {
      onClearSelection();
    } else {
      onToggleLocation(location, multiSelect);
    }
  };

  return (
    <div className="locations-list">
      <div className="brm-section-title">
        <h2>Locations</h2>
        {selectedLocations.size > 0 ? (
          <>
            <span className="brm-section-meta locations-selected-count tabular">
              {selectedLocations.size} selected
            </span>
            <button className="brm-btn locations-clear-selection" onClick={onClearSelection}>
              Clear
            </button>
          </>
        ) : (
          <span className="brm-section-meta tabular">{filteredLocations.length}</span>
        )}
      </div>

      <div className="brm-search">
        <input
          className="brm-input"
          type="text"
          placeholder="Search locations"
          aria-label="Search locations"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="brm-btn brm-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            X
          </button>
        )}
      </div>

      <div className="brm-box locations-box">
        <div className="locations-list-content">
          {groupedLocations.map(([category, locs]) => {
            // while searching every group with a match is open, or the matches stay hidden
            const isExpanded = query !== '' || expandedCategories.has(category);
            const selectedInCategory = locs.filter(l => selectedLocations.has(l.id)).length;

            return (
              <div key={category} className="locations-category">
                <button
                  className="brm-btn locations-category-header"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isExpanded}
                  disabled={query !== ''}
                >
                  <CategoryIcon category={category} size={16} color={CATEGORY_COLORS[category]} />
                  <span className="locations-category-name">{category}</span>
                  <span className="locations-category-count tabular">
                    {selectedInCategory > 0 && (
                      <span className="locations-category-selected">{selectedInCategory}/</span>
                    )}
                    {locs.length}
                  </span>
                  <span className={`locations-category-arrow${isExpanded ? ' expanded' : ''}`} aria-hidden="true">
                    &gt;
                  </span>
                </button>

                <div className={`locations-group-body${isExpanded ? ' open' : ''}`}>
                  <div className="locations-group-clip">
                    <div className="locations-category-items">
                      {locs.map(location => (
                        <div key={location.id} className="locations-item">
                          <button
                            className="brm-btn locations-item-select"
                            onClick={e => handleItemClick(e, location)}
                            aria-pressed={selectedLocations.has(location.id)}
                            tabIndex={isExpanded ? 0 : -1}
                          >
                            <span className="locations-item-name">{location.name}</span>
                          </button>
                          <button
                            className="brm-btn locations-item-view"
                            onClick={() => onSelectLocation(location)}
                            tabIndex={isExpanded ? 0 : -1}
                            title="View on map"
                            aria-label={`View ${location.name} on the map`}
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {groupedLocations.length === 0 && <p className="locations-empty">No locations match</p>}
        </div>
      </div>
    </div>
  );
}
