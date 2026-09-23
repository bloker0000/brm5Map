import { useState, useEffect } from 'react';
import { readStorage, writeStorage, removeStorage, canUseStorage } from '../storage';

const STORAGE_KEY = 'brm5-real-visit-number';
const OLD_STORAGE_KEY = 'brm5-visit-number';
const OLD_FIRST_VISIT_KEY = 'brm5-first-visit-time';

interface VisitorData {
  totalVisits: number | null;
  yourVisitNumber: number | null;
  isLoading: boolean;
}

function parseCount(value: unknown): number | null {
  const count = typeof value === 'string' ? Number(value) : value;
  return typeof count === 'number' && Number.isInteger(count) && count > 0 ? count : null;
}

async function fetchCount(method: 'GET' | 'POST'): Promise<number | null> {
  try {
    const res = await fetch('/api/visitor-count', { method });
    if (!res.ok) return null;
    const data = await res.json();
    return parseCount(data?.count);
  } catch {
    return null;
  }
}

// a new visitor is counted on arrival, the total is only asked for once the
// about panel is actually opened
export function useVisitorCount(isOpen: boolean): VisitorData {
  const [yourVisitNumber, setYourVisitNumber] = useState(() => parseCount(readStorage(STORAGE_KEY)));
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [hasTotal, setHasTotal] = useState(false);

  useEffect(() => {
    removeStorage(OLD_STORAGE_KEY);
    removeStorage(OLD_FIRST_VISIT_KEY);

    // without storage every page load would look like a first visit
    if (readStorage(STORAGE_KEY) !== null || !canUseStorage()) return;

    let cancelled = false;
    fetchCount('POST').then(count => {
      if (count === null) return;
      writeStorage(STORAGE_KEY, String(count));
      if (cancelled) return;
      setYourVisitNumber(count);
      setTotalVisits(count);
      setHasTotal(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || hasTotal) return;
    let cancelled = false;
    fetchCount('GET').then(count => {
      if (cancelled) return;
      setTotalVisits(count);
      setHasTotal(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, hasTotal]);

  return { totalVisits, yourVisitNumber, isLoading: !hasTotal };
}
