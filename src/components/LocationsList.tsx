// sidebar list of locations, grouped by category

import { useState, useMemo } from 'react';
import type { MapLocation } from '../types/location';
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      loc.category.toLowerCase().includes(query) ||
      loc.description?.toLowerCase().includes(query)
    );
  }, [locations, searchQuery]);

  const groupedLocations = useMemo(() => {
    const groups: Record<string, MapLocation[]> = {};
    filteredLocations.forEach(loc => {
      if (!groups[loc.category]) {
        groups[loc.category] = [];
      }
      groups[loc.category].push(loc);
    });
    return groups;
  }, [filteredLocations]);

  const toggleCategory = (category: string) => {
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

  const handleViewClick = (e: React.MouseEvent, location: MapLocation) => {
    e.stopPropagation();
    onSelectLocation(location);
  };

  return (
    <div className="locations-list">
      <div className="locations-list-search">
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="locations-list-clear"
            onClick={() => setSearchQuery('')}
          >
            X
          </button>
        )}
      </div>

      <div className="locations-list-info">
        {selectedLocations.size > 0 && (
          <>
            <span className="locations-selected-count">
              {selectedLocations.size} selected
            </span>
            <button
              className="locations-list-clear-selection"
              onClick={onClearSelection}
            >
              Clear
            </button>
          </>
        )}
        <span className="locations-total-count">
          {filteredLocations.length} locations
        </span>
      </div>

      <div className="locations-list-content">
        {Object.entries(groupedLocations).map(([category, locs]) => {
          const isExpanded = expandedCategories.has(category);
          const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#888';
          const selectedInCategory = locs.filter(l => selectedLocations.has(l.id)).length;

          return (
            <div key={category} className="locations-category">
              <button
                className="locations-category-header"
                onClick={() => toggleCategory(category)}
                aria-expanded={isExpanded}
                style={{ '--cat-color': color } as React.CSSProperties}
              >
                <span className="locations-category-icon">
                  <CategoryIcon category={category as any} size={16} color={color} />
                </span>
                <span className="locations-category-name">{category}</span>
                <span className="locations-category-count">
                  {selectedInCategory > 0 && (
                    <span className="locations-category-selected">{selectedInCategory}/</span>
                  )}
                  {locs.length}
                </span>
                <span className={`locations-category-arrow ${isExpanded ? 'expanded' : ''}`}>
                  &gt;
                </span>
              </button>

              <div className={`locations-group-body${isExpanded ? ' open' : ''}`}>
                <div className="locations-group-clip">
                  <div className="locations-category-items">
                    {locs.map(location => (
                      <div
                        key={location.id}
                        className={`locations-item ${selectedLocations.has(location.id) ? 'selected' : ''}`}
                        onClick={e => handleItemClick(e, location)}
                      >
                        <span className="locations-item-name">{location.name}</span>
                        <button
                          className="locations-item-view"
                          onClick={e => handleViewClick(e, location)}
                          tabIndex={isExpanded ? 0 : -1}
                          title="View on map"
                        >
                          VIEW
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
