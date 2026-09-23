import { useCallback, useSyncExternalStore } from 'react';

// matches the max-width: 768px blocks in the css
export const PHONE_QUERY = '(max-width: 768px)';

// a mouse or trackpad, as opposed to a finger or a tablet pen
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
