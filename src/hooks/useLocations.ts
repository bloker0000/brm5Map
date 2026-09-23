import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import type { MapLocation, LocationCategory } from '../types/location';
import { loadLocations, generateId, sanitizeLocation } from '../data/locations';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
  const [locations, setLocationsRaw] = useState(loadLocations);
  const [selectedCategories, setSelectedCategories] = useState<Set<LocationCategory>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedRef = useRef<string | null>(null);

  const undoStack = useRef<MapLocation[][]>([]);
  const redoStack = useRef<MapLocation[][]>([]);
  const locationsRef = useRef(locations);

  useLayoutEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const setLocations = useCallback((action: MapLocation[] | ((prev: MapLocation[]) => MapLocation[])) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), locationsRef.current];
    redoStack.current = [];
    syncHistoryFlags();
    setLocationsRaw(action);
  }, [syncHistoryFlags]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, locationsRef.current];
    setLocationsRaw(prev);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [...undoStack.current, locationsRef.current];
    setLocationsRaw(next);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

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
    if (!import.meta.env.DEV) return;

    const payload = serialize(locations);
    // the first run only records what is already on disk
    if (lastSavedRef.current === null) {
      lastSavedRef.current = payload;
      return;
    }
    // also skips undo/redo back to a saved state
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

  const filteredLocations = useMemo(
    () => (selectedCategories.size > 0
      ? locations.filter(loc => selectedCategories.has(loc.category))
      : locations),
    [locations, selectedCategories]
  );

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

  const addLocation = useCallback((location: Omit<MapLocation, 'id'>) => {
    const newLocation: MapLocation = {
      ...location,
      id: generateId(),
    };
    setLocations(prev => [...prev, newLocation]);
    return newLocation;
  }, [setLocations]);

  const importLocations = useCallback((incoming: unknown[], replace: boolean = false) => {
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
  }, [setLocations]);

  const updateLocation = useCallback((id: string, updates: Partial<MapLocation>) => {
    setLocations(prev =>
      prev.map(loc => (loc.id === id ? { ...loc, ...updates } : loc))
    );
  }, [setLocations]);

  const deleteLocation = useCallback((id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  }, [setLocations]);

  const toggleCategory = useCallback((category: LocationCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories(new Set());
  }, []);

  return {
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
  };
}
