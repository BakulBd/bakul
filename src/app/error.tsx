'use client';

import { useEffect, type CSSProperties } from 'react';
import { Atmosphere } from '@/components/dom/Atmosphere';
import { Backdrop } from '@/components/dom/Backdrop';

/**
 * Deliberately lightweight — pure DOM/CSS, no 3D, no client state beyond
 * what Next.js hands it. If the machine itself threw, this page cannot
 * depend on the machine to render.
 *
 * The two background layers are the exception, and they are safe to mount for
 * the same reason they are cheap: each is a handful of divs with no props, no
 * state, no effects and no imports of its own — there is nothing in either that
 * can throw a second time inside the boundary that is already handling a throw.
 * What they buy is that a fault still looks like this machine reporting a fault,
 * rather than like the site having been replaced by a system dialog.
 *
 * `--power: 1` because the boot sequence that normally ramps it is on the page
 * that just failed. `--tone` stays at its amber default — the mechanical,
 * something-needs-attention end of the scale.
 */

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <div style={{ '--power': 1 } as CSSProperties}>
      <Atmosphere />
      <Backdrop />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="t-label" style={{ color: 'var(--color-alert)' }}>
          System Fault
        </p>
        <h1 className="t-display mt-4 text-[clamp(2.4rem,8vw,5rem)]">Something Broke</h1>
        <p className="t-body mt-5 max-w-[46ch]">
          An unhandled error stopped the page from rendering. It has been logged. Reloading usually
          clears it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try Again
          </button>
          {/* A real anchor, deliberately: this needs a full page reload to clear
              whatever client state caused the error, which is exactly what
              next/link's client-side navigation would not do. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="btn">
            Reload From Scratch
          </a>
        </div>
      </main>
    </div>
  );
}

