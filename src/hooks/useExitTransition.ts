// keeps things mounted a moment so they can animate out

import { useEffect, useState } from 'react';

export function useExitTransition<T>(value: T | null | undefined, duration = 170) {
  const [state, setState] = useState<{ rendered: T | null; isClosing: boolean }>(
    () => ({ rendered: value ?? null, isClosing: false })
  );

  useEffect(() => {
    if (value != null) {
      setState({ rendered: value, isClosing: false });
      return;
    }

    setState(prev => (prev.rendered == null ? prev : { rendered: prev.rendered, isClosing: true }));
    const timer = window.setTimeout(() => {
      setState(prev => (prev.rendered == null && !prev.isClosing
        ? prev
        : { rendered: null, isClosing: false }));
    }, duration);

    return () => window.clearTimeout(timer);
  }, [value, duration]);

  return state;
}
