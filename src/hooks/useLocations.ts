import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import type { MapLocation, LocationCategory } from '../types/location';
import { loadLocations, generateId } from '../data/locations';

const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

async function saveToFile(locations: MapLocation[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/save-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locations, null, 2),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || 'Save failed' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach dev server' };
  }
}

export function useLocations() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<LocationCategory>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<MapLocation | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocations(loadLocations());
    initialLoadDone.current = true;
  }, []);

  // Auto-save to file in dev mode when locations change
  useEffect(() => {
    if (!IS_DEV || !initialLoadDone.current || locations.length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await saveToFile(locations);
      setSaveStatus(result.ok ? 'saved' : 'error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [locations]);

  const manualSave = useCallback(async () => {
    setSaveStatus('saving');
    const result = await saveToFile(locations);
    setSaveStatus(result.ok ? 'saved' : 'error');
    setTimeout(() => setSaveStatus('idle'), 2000);
    return result;
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
    saveStatus,
    manualSave,
  };
}
