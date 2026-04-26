import { useCallback, useRef } from 'react';

// Dedup by querying the DOM — avoids stale module-level state across React
// unmount/remount cycles and keeps test isolation free of explicit resets.
function prefetchUrl(url: string): void {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'script';
  link.href = url;
  document.head.appendChild(link);
}

/** Returns a stable callback that, on first call, injects prefetch hints for
 *  the destination zone's _app chunk. Safe to call on mouseEnter/focus. */
export function usePrefetchCrossApp(href: string, options: { enabled?: boolean } = {}): () => void {
  const { enabled = true } = options;
  const triggered = useRef(false);

  return useCallback(() => {
    if (!enabled || triggered.current) return;
    triggered.current = true;
    const match = href.match(/^\/(app[^/]+)/);
    if (!match) return;
    const base = `/${match[1]}`;
    prefetchUrl(`${base}/_next/static/chunks/pages/_app.js`);
  }, [href, enabled]);
}
