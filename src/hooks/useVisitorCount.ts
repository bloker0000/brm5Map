import { useState, useEffect } from 'react';

const STORAGE_KEY = 'brm5-real-visit-number';
const OLD_STORAGE_KEY = 'brm5-visit-number';
const OLD_FIRST_VISIT_KEY = 'brm5-first-visit-time';

interface VisitorData {
  totalVisits: number | null;
  yourVisitNumber: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useVisitorCount(): VisitorData {
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [yourVisitNumber, setYourVisitNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.removeItem(OLD_FIRST_VISIT_KEY);
    
    const storedVisitNumber = localStorage.getItem(STORAGE_KEY);
    
    if (storedVisitNumber) {
      setYourVisitNumber(parseInt(storedVisitNumber, 10));
      fetch('/api/visitor-count')
        .then(res => res.json())
        .then(data => {
          setTotalVisits(data.count);
          setIsLoading(false);
        })
        .catch(() => {
          setError('Failed to load visit count');
          setIsLoading(false);
        });
    } else {
      fetch('/api/visitor-count', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          const visitNumber = data.count;
          setTotalVisits(visitNumber);
          setYourVisitNumber(visitNumber);
          localStorage.setItem(STORAGE_KEY, visitNumber.toString());
          setIsLoading(false);
        })
        .catch(() => {
          setError('Failed to load visit count');
          setIsLoading(false);
        });
    }
  }, []);

  return { totalVisits, yourVisitNumber, isLoading, error };
}
