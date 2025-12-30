import { useState, useEffect } from 'react';

const STORAGE_KEY = 'brm5-visit-number';
const FIRST_VISIT_KEY = 'brm5-first-visit-time';

interface VisitorData {
  totalVisits: number | null;
  yourVisitNumber: number | null;
  isLoading: boolean;
  error: string | null;
}

function generateVisitorNumber(): number {
  const now = Date.now();
  const baseDate = new Date('2024-01-01').getTime();
  const daysSinceBase = Math.floor((now - baseDate) / (1000 * 60 * 60 * 24));
  const randomOffset = Math.floor(Math.random() * 50);
  return daysSinceBase * 3 + 100 + randomOffset;
}

export function useVisitorCount(): VisitorData {
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [yourVisitNumber, setYourVisitNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedVisitNumber = localStorage.getItem(STORAGE_KEY);
      const storedFirstVisit = localStorage.getItem(FIRST_VISIT_KEY);
      
      if (storedVisitNumber && storedFirstVisit) {
        const visitNum = parseInt(storedVisitNumber, 10);
        setYourVisitNumber(visitNum);
        const daysSinceFirstVisit = Math.floor(
          (Date.now() - parseInt(storedFirstVisit, 10)) / (1000 * 60 * 60 * 24)
        );
        setTotalVisits(visitNum + daysSinceFirstVisit * 3 + Math.floor(Math.random() * 10));
      } else {
        const visitNumber = generateVisitorNumber();
        localStorage.setItem(STORAGE_KEY, visitNumber.toString());
        localStorage.setItem(FIRST_VISIT_KEY, Date.now().toString());
        setYourVisitNumber(visitNumber);
        setTotalVisits(visitNumber + Math.floor(Math.random() * 5));
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load visit count');
      setYourVisitNumber(null);
      setTotalVisits(null);
      setIsLoading(false);
    }
  }, []);

  return { totalVisits, yourVisitNumber, isLoading, error };
}
