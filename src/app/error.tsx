'use client';

import { useEffect } from 'react';

/**
 * Deliberately lightweight — pure DOM/CSS, no 3D, no client state beyond
 * what Next.js hands it. If the machine itself threw, this page cannot
 * depend on the machine to render.
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
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
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
  );
}
