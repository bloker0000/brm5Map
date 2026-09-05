import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import type { MapLocation, LocationCategory } from '../types/location';
import { loadLocations, generateId, sanitizeLocation } from '../data/locations';

const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

async function saveToFile(payload: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/save-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || 'Save failed' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach dev server' };
  }
}

const MAX_UNDO = 50;

// matches what the dev server writes, so we can tell a real change from a no-op
function serialize(locations: MapLocation[]): string {
  return JSON.stringify(locations, null, 2);
}

export function useLocations() {
  const [locations, setLocationsRaw] = useState<MapLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<LocationCategory>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedRef = useRef<string | null>(null);

  const undoStack = useRef<MapLocation[][]>([]);
  const redoStack = useRef<MapLocation[][]>([]);
  const skipHistoryRef = useRef(false);
  const locationsRef = useRef(locations);
  locationsRef.current = locations;

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const setLocations = useCallback((action: MapLocation[] | ((prev: MapLocation[]) => MapLocation[])) => {
    if (!skipHistoryRef.current && initialLoadDone.current) {
      undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), locationsRef.current];
      redoStack.current = [];
      syncHistoryFlags();
    }
    setLocationsRaw(action);
  }, [syncHistoryFlags]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, locationsRef.current];
    skipHistoryRef.current = true;
    setLocationsRaw(prev);
    skipHistoryRef.current = false;
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [...undoStack.current, locationsRef.current];
    skipHistoryRef.current = true;
    setLocationsRaw(next);
    skipHistoryRef.current = false;
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  useEffect(() => {
    const initial = loadLocations();
    lastSavedRef.current = serialize(initial);
    skipHistoryRef.current = true;
    setLocationsRaw(initial);
    skipHistoryRef.current = false;
    initialLoadDone.current = true;
  }, []);

  const flashStatus = useCallback((status: 'saved' | 'error') => {
    setSaveStatus(status);
    clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const persist = useCallback(async (payload: string) => {
    setSaveStatus('saving');
    const result = await saveToFile(payload);
    if (result.ok) lastSavedRef.current = payload;
    flashStatus(result.ok ? 'saved' : 'error');
    return result;
  }, [flashStatus]);

  useEffect(() => {
    if (!IS_DEV || !initialLoadDone.current) return;

    const payload = serialize(locations);
    // skip the write on initial load and on undo/redo back to a saved state
    if (payload === lastSavedRef.current) return;

    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => { void persist(payload); }, 500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [locations, persist]);

  useEffect(() => () => {
    clearTimeout(saveTimeoutRef.current);
    clearTimeout(statusTimeoutRef.current);
  }, []);

  const manualSave = useCallback(() => {
    clearTimeout(saveTimeoutRef.current);
    return persist(serialize(locationsRef.current));
  }, [persist]);

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

  // held by id so an edit or delete is reflected without going stale
  const selectedLocation = useMemo(
    () => locations.find(loc => loc.id === selectedId) ?? null,
    [locations, selectedId]
  );
  const hoveredLocation = useMemo(
    () => locations.find(loc => loc.id === hoveredId) ?? null,
    [locations, hoveredId]
  );
  const setSelectedLocation = useCallback(
    (loc: MapLocation | null) => setSelectedId(loc?.id ?? null),
    []
  );
  const setHoveredLocation = useCallback(
    (loc: MapLocation | null) => setHoveredId(loc?.id ?? null),
    []
  );

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

  const importLocations = (incoming: unknown[], replace: boolean = false) => {
    const seenIds = new Set<string>();
    const cleaned: MapLocation[] = [];

    for (const raw of incoming) {
      const loc = sanitizeLocation(raw);
      if (!loc) continue;
      if (seenIds.has(loc.id)) loc.id = generateId();
      seenIds.add(loc.id);
      cleaned.push(loc);
    }

    if (cleaned.length > 0) {
      if (replace) {
        setLocations(cleaned);
      } else {
        setLocations(prev => [
          ...prev.filter(p => !seenIds.has(p.id)),
          ...cleaned,
        ]);
      }
    }

    return { imported: cleaned.length, skipped: incoming.length - cleaned.length };
  };

  const updateLocation = (id: string, updates: Partial<MapLocation>) => {
    setLocations(prev =>
      prev.map(loc => (loc.id === id ? { ...loc, ...updates } : loc))
    );
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
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
    importLocations,
    saveStatus,
    manualSave,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
