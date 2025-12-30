import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { MapLocation, LocationCategory } from '../types/location';
import { loadLocations, saveLocations, generateId } from '../data/locations';

export function useLocations() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<LocationCategory>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<MapLocation | null>(null);

  useEffect(() => {
    setLocations(loadLocations());
  }, []);

  useEffect(() => {
    if (locations.length > 0) {
      saveLocations(locations);
    }
  }, [locations]);

  const fuse = useMemo(() => {
    return new Fuse(locations, {
      keys: ['name', 'description', 'category'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [locations]);

  const filteredLocations = useMemo(() => {
    let result = locations;

    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery);
      result = searchResults.map(r => r.item);
    }

    if (selectedCategories.size > 0) {
      result = result.filter(loc => selectedCategories.has(loc.category));
    }

    return result;
  }, [locations, searchQuery, selectedCategories, fuse]);

  const allCategories = useMemo(() => {
    const cats = new Set<LocationCategory>();
    locations.forEach(loc => cats.add(loc.category));
    return Array.from(cats).sort();
  }, [locations]);

  const addLocation = (location: Omit<MapLocation, 'id'>) => {
    const newLocation: MapLocation = {
      ...location,
      id: generateId(),
    };
    setLocations(prev => [...prev, newLocation]);
    return newLocation;
  };

  const updateLocation = (id: string, updates: Partial<MapLocation>) => {
    setLocations(prev =>
      prev.map(loc => (loc.id === id ? { ...loc, ...updates } : loc))
    );
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
    if (selectedLocation?.id === id) {
      setSelectedLocation(null);
    }
  };

  const toggleCategory = (category: LocationCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories(new Set());
  };

  return {
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
    addLocation,
    updateLocation,
    deleteLocation,
  };
}
