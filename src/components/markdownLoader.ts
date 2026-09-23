// the markdown renderer is a big chunk that only a location description needs, so
// it stays out of the first load and is fetched in idle time once the map is up

export const loadMarkdown = () => import('./Markdown').then(m => ({ default: m.Markdown }));

export function preloadMarkdown() {
  const load = () => { void loadMarkdown(); };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(load, { timeout: 4000 });
  } else {
    setTimeout(load, 1500);
  }
}
