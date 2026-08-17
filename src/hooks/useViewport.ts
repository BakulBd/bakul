'use client';

import { useSyncExternalStore } from 'react';

/**
 * Is this a compact (phone / small tablet) viewport?
 *
 * 1024px is not an arbitrary number — it is the same `lg:` breakpoint the
 * layout already switches its grids at, so "compact" here means exactly "the
 * two-column layouts have collapsed to one". Deriving the behavioural
 * breakpoint from the visual one is what keeps the choreography and the
 * layout from disagreeing about which mode the page is in.
 *
 * Read through `useSyncExternalStore` rather than an effect + state: the
 * server snapshot is `false`, so SSR and the hydration pass render the wide
 * layout and match byte for byte, and the compact layout arrives on the
 * commit immediately after. An effect would do the same thing a frame later
 * and flash the wrong layout.
 */
const COMPACT_QUERY = '(max-width: 1023.98px)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(COMPACT_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * Returns a primitive, so React's snapshot comparison is a plain `===` and
 * cannot loop — the classic `useSyncExternalStore` footgun is returning a
 * fresh object from the getter every call.
 */
const getSnapshot = () => window.matchMedia(COMPACT_QUERY).matches;
const getServerSnapshot = () => false;

export function useIsCompact() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
