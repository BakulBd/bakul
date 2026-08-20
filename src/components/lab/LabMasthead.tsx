import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { LAB_TRAIL } from '@/lib/seo';

/**
 * THE WAY OUT.
 *
 * /lab is the only route on this site that is not the site. A visitor who
 * arrives here from a search result or a shared link has never seen the machine,
 * and a visitor who came from it has scrolled a long way to get here — both need
 * the exit to be somewhere they can find it without hunting.
 *
 * ── Why this exists at all ─────────────────────────────────────────────
 * It replaces a single small text link that sat at the top of the shell. That
 * link was correct in every respect except the one that mattered: it scrolled
 * away the moment anyone touched a bench, and below that point the route had no
 * exit at all. Someone who landed here directly had no Back button to fall back
 * on either, so the lab was reachable and not leavable.
 *
 * ── Why it is a trail and not a button ─────────────────────────────────
 * The rungs come from `LAB_TRAIL`, the same array the page's `BreadcrumbList`
 * is generated from, so what a visitor reads and what a crawler resolves are
 * the same two strings by construction. A plain "back" button would have been
 * less work and would have left the visible page and its structured data as two
 * descriptions of the trail that nothing kept in agreement.
 *
 * It also answers a question a bare back link does not: not just *leave*, but
 * where this page sits — one level under a portfolio that has more on it than
 * benches.
 *
 * ── Why there is a second destination ──────────────────────────────────
 * Because "back to the top of the machine" was, until this, the complete list
 * of places this route could reach. The main page has six sections and the lab
 * could address exactly one position in it — the first pixel — on a route that
 * boots in standby, so a visitor who had finished evaluating and wanted to make
 * contact faced a page load, a power-on, and four screens of scroll.
 *
 * The scroll engine had already solved the hard half. `useHashLanding` honours
 * an inbound `#section-…`, powers the machine on arrival so the scene is not
 * dark, and skips the smooth-scroll because the browser has already jumped —
 * and its own docblock names "the lab's way back" as the case it was written
 * for. Nothing had ever sent it one. This does.
 *
 * One extra link and not a menu. The trail is the way out; this is the one
 * destination worth naming past it, and a row of section links here would be a
 * second navigation for a document that has none of those sections in it.
 *
 * ── Why two navs rather than one ───────────────────────────────────────
 * The trail is a `BreadcrumbList` and the shortcut is not part of it. Putting
 * the contact link inside `aria-label="Breadcrumb"` would announce it as a rung
 * in a path it has no position in; a second labelled `<nav>` costs one element
 * and describes what is actually there.
 *
 * ── Why it is a server component ───────────────────────────────────────
 * There is nothing to react to. The trail is two fixed rungs, and the open
 * bench is deliberately not one of them (see `LAB_TRAIL`) — which is what keeps
 * this static, because the bench is the one part that changes at runtime. So
 * `/lab` gets a permanent exit for zero added JavaScript, and the shell gets
 * slightly smaller by losing the link it used to own.
 *
 * `<Link>` rather than `<a>`: the App Router prefetches the machine, so the trip
 * back is instant rather than a cold page load of the heaviest route on the site.
 */
export function LabMasthead() {
  return (
    <div className="lab-masthead">
      <div className="lab-masthead__inner">
        <nav aria-label="Breadcrumb">
          <ol className="lab-trail">
            {LAB_TRAIL.map((rung, i) => (
              <li key={rung.name} className="lab-trail__rung">
                {rung.href ? (
                  <Link href={rung.href} className="lab-trail__link">
                    {/*
                      The arrow rides the first rung rather than sitting in a
                      control of its own. Both a back button and a trail whose
                      first rung is home would point at exactly the same URL, and
                      two affordances for one destination is chrome, not help.
                    */}
                    {i === 0 && <ArrowLeft aria-hidden="true" />}
                    <span>{rung.name}</span>
                  </Link>
                ) : (
                  /*
                    The last rung is where the visitor already is, so it is not a
                    link — and `aria-current="page"` is what tells a screen reader
                    that this is the position in the trail rather than a
                    destination that happens to be unclickable.
                  */
                  <span className="lab-trail__here" aria-current="page">
                    {rung.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <nav aria-label="Portfolio">
          {/*
            The fragment is the whole mechanism — see the note above and
            `useHashLanding`. It is written out rather than composed from the
            section registry because `@/lib/data/sections` is the main page's
            choreography spine: importing it here to interpolate one id would
            couple the lab's chrome to the camera's settle points, and `contact`
            is the one id in that registry that is load-bearing for this link.
          */}
          <Link href="/#section-contact" className="lab-exit">
            <span>Contact</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </div>
  );
}
