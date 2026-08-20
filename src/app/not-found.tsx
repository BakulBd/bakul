import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Atmosphere } from '@/components/dom/Atmosphere';
import { Backdrop } from '@/components/dom/Backdrop';

/**
 * Deliberately lightweight — pure DOM/CSS, no 3D, no client state. A 404 page
 * that depended on the machine would be a bad place to discover the machine
 * itself is what broke.
 *
 * It is not, however, a reason to leave the site. The atmosphere and the
 * substrate are gradients and keyframes with no JavaScript behind them and no
 * WebGL context to lose, so a visitor who mistypes a URL stays in the same room
 * rather than landing on a flat rectangle that could belong to any site — which
 * is the moment a portfolio stops feeling built and starts feeling assembled.
 *
 * `--power: 1` because there is no boot sequence on this route to ramp it, and
 * `--tone` is left at its amber default: amber is this site's mechanical, this-
 * needs-your-attention end of the scale, which is what a 404 is.
 */
export default function NotFound() {
  return (
    <div style={{ '--power': 1 } as CSSProperties}>
      <Atmosphere />
      <Backdrop />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="t-label emissive-amber">404 — Sector Not Found</p>
      <h1 className="t-display mt-4 text-[clamp(2.4rem,8vw,5rem)]">Off the Map</h1>
      <p className="t-body mt-5 max-w-[46ch]">
        Nothing is mapped to this address. The machine only has one floor — everything lives at
        the root.
      </p>
        <Link href="/" className="btn btn-primary mt-8">
          Return to the Machine
        </Link>
      </main>
    </div>
  );
}
