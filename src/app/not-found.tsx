import Link from 'next/link';

/**
 * Deliberately lightweight — pure DOM/CSS, no 3D, no client state. A 404 page
 * that depended on the machine would be a bad place to discover the machine
 * itself is what broke.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
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
  );
}
