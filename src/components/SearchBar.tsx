import { useState, useRef, useEffect } from 'react';
import type { MapLocation } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { SearchIcon, CloseIcon, CategoryIcon } from './Icons';
import './SearchBar.css';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: MapLocation[];
  onSelectLocation: (location: MapLocation) => void;
}

export function SearchBar({ query, onQueryChange, results, onSelectLocation }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showResults = isFocused && query.trim().length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location: MapLocation) => {
    onSelectLocation(location);
    onQueryChange('');
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className="search-container" ref={containerRef}>
      <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
        <span className="search-icon">
          <SearchIcon size={16} color="#666" />
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search locations..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="search-input"
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => onQueryChange('')}
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-no-results">No locations found</div>
          ) : (
            results.slice(0, 10).map((location) => (
              <button
                key={location.id}
                className="search-result-item"
                onClick={() => handleSelect(location)}
                style={{ '--result-color': CATEGORY_COLORS[location.category] } as React.CSSProperties}
              >
                <span className="search-result-icon">
                  <CategoryIcon category={location.category} size={18} color={CATEGORY_COLORS[location.category]} />
                </span>
                <div className="search-result-info">
                  <div className="search-result-name">{location.name}</div>
                  <div className="search-result-category">{location.category}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
