'use client';

import { useEffect } from 'react';

/**
 * Runs `onScroll` at most once per animation frame instead of once per native
 * scroll event. A raw `scroll` listener can fire far more often than the
 * display refreshes — a fling on a trackpad or Lenis's own momentum can queue
 * dozens of events per frame — and this callback's shape (read layout via
 * `getBoundingClientRect`, then write React state) is exactly the pattern that
 * turns into repeated forced synchronous layout if it isn't coalesced.
 *
 * Fires once immediately on mount so the initial state is correct before the
 * first scroll event arrives.
 */
export function useRafScroll(onScroll: () => void, deps: readonly unknown[] = []) {
  useEffect(() => {
    let scheduled = false;
    let raf = 0;

    const run = () => {
      scheduled = false;
      onScroll();
    };

    const handleScroll = () => {
      if (scheduled) return;
      scheduled = true;
      raf = requestAnimationFrame(run);
    };

    onScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
