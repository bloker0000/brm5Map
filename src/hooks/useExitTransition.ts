// keeps things mounted a moment so they can animate out

import { useEffect, useState } from 'react';

export function useExitTransition<T>(value: T | null | undefined, duration = 170) {
  const [rendered, setRendered] = useState<T | null>(value ?? null);
  const [previous, setPrevious] = useState(value);

  if (value !== previous) {
    setPrevious(value);
    if (value != null) setRendered(value);
  }

  const isClosing = value == null && rendered != null;

  useEffect(() => {
    if (!isClosing) return;
    const timer = window.setTimeout(() => setRendered(null), duration);
    return () => window.clearTimeout(timer);
  }, [isClosing, duration]);

  return { rendered, isClosing };
}
