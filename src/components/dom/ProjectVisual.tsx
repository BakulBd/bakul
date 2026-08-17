'use client';

import type { ReactNode } from 'react';

/**
 * PROJECT SIGNATURE VISUALS
 *
 * One bespoke diagram per bay, animating the single idea that makes that
 * project worth reading about.
 *
 * ── Why diagrams and not screenshots ────────────────────────────────────
 * A screenshot of a VS Code extension is a screenshot of VS Code. A
 * screenshot of a multiplayer game is one frozen frame that says nothing
 * about the thing that is actually hard — that two machines are stepping the
 * same physics and agreeing about it. The interesting claim in each of these
 * projects is structural, and structure is what a diagram shows and a
 * screenshot cannot.
 *
 * Each one is drawn from that project's own case study — the same `problem`
 * and `architecture` text rendered beside it — so the picture and the prose
 * are describing one thing. Nothing here depicts a feature the project does
 * not have.
 *
 * ── Cost ────────────────────────────────────────────────────────────────
 * Inline SVG and CSS keyframes. No WebGL, no canvas, no per-frame
 * JavaScript, no image download, and nothing that invalidates layout — every
 * animation is a transform or an opacity on a handful of nodes. That is what
 * makes them affordable on the phone, where they matter most: this is the
 * visual evidence the mobile layout previously had none of.
 *
 * The global reduced-motion rule in globals.css zeroes every animation
 * duration, so each diagram degrades to a still schematic that still reads
 * correctly — which is why the resting state of each is composed to be
 * legible on its own rather than being a frame the motion happens to start on.
 */

function Frame({
  children,
  caption,
}: {
  children: ReactNode;
  caption: string;
}) {
  return (
    <figure className="pv m-0">
      <div className="pv__stage">
        <svg
          viewBox="0 0 320 180"
          // Decorative: the caption below and the case study beside it carry
          // the same information as text.
          aria-hidden="true"
          focusable="false"
          className="pv__svg"
        >
          {children}
        </svg>
      </div>
      {/* Sans, not the mono `.t-label` used elsewhere for chrome: this is a
          sentence to be read, and setting a full clause in letter-spaced
          monospace makes it scan as a data readout rather than a caption. */}
      <figcaption className="pv__caption">{caption}</figcaption>
    </figure>
  );
}

/**
 * hdgame.me — the shared deterministic step.
 *
 * Two lanes running the same simulation from one imported module, with the
 * client's predicted state travelling ahead of the server's authoritative
 * one and being pulled back into line. That reconciliation is the whole
 * reason `packages/shared` exists.
 */
function Reconciliation() {
  return (
    <Frame caption="Client prediction and server authority stepping one shared physics module">
      {/* Lanes */}
      <line x1="14" y1="52" x2="306" y2="52" className="pv-rail" />
      <line x1="14" y1="132" x2="306" y2="132" className="pv-rail" />

      {/* Fixed-timestep ticks. Both lanes are marked identically because that
          is the claim: the same simulation advancing at the same rate on both
          ends, which is what makes the two states comparable at all. */}
      {Array.from({ length: 21 }, (_, i) => 20 + i * 14).map((x) => (
        <g key={x}>
          <line x1={x} y1="48" x2={x} y2="52" className="pv-tick" />
          <line x1={x} y1="132" x2={x} y2="136" className="pv-tick" />
        </g>
      ))}

      <text x="14" y="38" className="pv-text pv-text--cyan">CLIENT · PREDICTED</text>
      <text x="14" y="158" className="pv-text pv-text--amber">SERVER · AUTHORITATIVE</text>

      {/* The shared module both lanes import. */}
      <rect x="110" y="78" width="100" height="28" rx="7" className="pv-box" />
      <text x="160" y="96" textAnchor="middle" className="pv-text pv-text--bright">
        packages/shared
      </text>

      {/* Ties from the module up to the client lane and down to the server. */}
      <line x1="160" y1="78" x2="160" y2="54" className="pv-tie" />
      <line x1="160" y1="106" x2="160" y2="130" className="pv-tie" />

      {/* State markers. The client's runs ahead; the server's follows, and the
          client's is periodically snapped back onto it. */}
      <rect className="pv-ghost pv-run-client" x="-5" y="46" width="10" height="12" rx="2" />
      <rect className="pv-solid pv-run-server" x="-5" y="126" width="10" height="12" rx="2" />

      {/* Correction packets travelling back up from server to client. */}
      <circle className="pv-packet pv-correct" cx="0" cy="0" r="2.6" />
    </Frame>
  );
}

/**
 * Epistemic Guard — the explanation gate.
 *
 * AI-generated code is detected on entry and held until an explanation
 * clears a rubric judged by a second model. The gate is the apparatus; the
 * point is that nothing passes it unexplained.
 */
function ExplanationGate() {
  return (
    <Frame caption="AI-generated code held at an explanation gate until a rubric judge clears it">
      <text x="14" y="34" className="pv-text">AI-GENERATED CODE</text>
      <text x="306" y="34" textAnchor="end" className="pv-text pv-text--cyan">PROJECT</text>

      {/* Entry rail into the gate, and the cleared rail out of it. */}
      <line x1="14" y1="96" x2="140" y2="96" className="pv-rail" />
      <line x1="180" y1="96" x2="306" y2="96" className="pv-rail" />

      {/* The rubric judge, sitting above the gate and driving it. */}
      <rect x="112" y="30" width="96" height="24" rx="6" className="pv-box" />
      <text x="160" y="46" textAnchor="middle" className="pv-text pv-text--bright">
        RUBRIC · LLM JUDGE
      </text>
      <line x1="160" y1="54" x2="160" y2="70" className="pv-tie" />

      {/* Gate jaws. They part only while a verdict is being granted. */}
      <rect className="pv-jaw pv-jaw--top" x="152" y="70" width="16" height="20" rx="2" />
      <rect className="pv-jaw pv-jaw--bottom" x="152" y="102" width="16" height="20" rx="2" />

      {/* Submissions arriving, holding at the gate, then released. */}
      <rect className="pv-solid pv-submit pv-submit--1" x="-6" y="90" width="12" height="12" rx="2" />
      <rect className="pv-solid pv-submit pv-submit--2" x="-6" y="90" width="12" height="12" rx="2" />

      <text x="160" y="146" textAnchor="middle" className="pv-text pv-text--amber">
        EXPLAIN TO PROCEED
      </text>
    </Frame>
  );
}

/**
 * Green Guardian — client-side proctoring into a serverless log.
 *
 * Face and gaze tracking run in the browser through TensorFlow.js, and the
 * integrity events they produce are what a backend with no monitoring server
 * scores after the fact. The diagram is that pipeline: mesh, gaze, event
 * stream, store.
 */
function IntegrityTelemetry() {
  /*
   * Landmark points arranged as an actual face rather than an abstract graph.
   *
   * The first attempt scattered nine nodes and linked them into what read as
   * a random heptagon — recognisable as "a mesh", not as "face tracking",
   * which is the entire claim being illustrated. Brow, eye, nose and jaw
   * points in roughly anatomical positions cost the same nine nodes and read
   * instantly. It is still a schematic, not a pretence at the real 468-point
   * topology.
   */
  const CX = 80;
  const nodes: [number, number][] = [
    [60, 62], [CX, 56], [100, 62], //  0-2  brow
    [64, 80], [96, 80], //             3-4  eyes
    [52, 96], [108, 96], //            5-6  cheeks
    [CX, 98], //                       7    nose
    [68, 116], [92, 116], //           8-9  mouth
    [CX, 126], //                      10   chin
  ];
  /*
   * Triangulated outward from the centre line — no link crosses another.
   * The first version connected brow straight to mouth, which drew a large X
   * through the middle of the face and turned the whole thing back into an
   * abstract lattice.
   */
  const links: [number, number][] = [
    [0, 1], [1, 2], //         brow
    [0, 3], [2, 4], //         brow → eyes
    [3, 7], [4, 7], //         eyes → nose
    [3, 5], [4, 6], //         eyes → cheeks
    [5, 8], [6, 9], //         cheeks → mouth
    [7, 8], [7, 9], //         nose → mouth
    [8, 9], //                 mouth
    [8, 10], [9, 10], //       mouth → chin
  ];

  return (
    <Frame caption="Browser-side face and gaze tracking emitting integrity events to a serverless store">
      <text x="14" y="28" className="pv-text">TENSORFLOW.JS · IN BROWSER</text>

      {/* Head outline. Sized to the landmark cluster it contains — an ellipse
          much wider than the mesh left the points floating in the middle of
          an empty circle rather than reading as the edge of a face. */}
      <ellipse cx={CX} cy="92" rx="34" ry="42" className="pv-outline" />

      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          className="pv-mesh"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="2.2"
          className="pv-node"
          style={{ animationDelay: `${i * 0.14}s` }}
        />
      ))}

      {/* Gaze vector, sweeping off-axis and back — the thing being detected.
          Originates between the eyes and is kept short: the earlier version
          ran the full height of the frame and crossed the label above it. */}
      <line x1={CX} y1="76" x2={CX} y2="46" className="pv-gaze" />

      {/* Event stream: each detection lights a row in the log, and one of them
          resolves amber — a flagged event is the output that matters. */}
      <text x="176" y="28" className="pv-text pv-text--cyan">INTEGRITY EVENTS</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="176" y={44 + i * 20} width="118" height="11" rx="3" className="pv-slot" />
          <rect
            x="176"
            y={44 + i * 20}
            width="118"
            height="11"
            rx="3"
            className={`pv-slot-fill ${i === 2 ? 'pv-slot-fill--flag' : ''}`}
            style={{ animationDelay: `${i * 0.55}s` }}
          />
        </g>
      ))}

      <line x1="235" y1="126" x2="235" y2="138" className="pv-tie" />
      <rect x="176" y="138" width="118" height="20" rx="5" className="pv-box" />
      <text x="235" y="152" textAnchor="middle" className="pv-text pv-text--bright">
        FIRESTORE
      </text>
    </Frame>
  );
}

/**
 * Keyed by slot rather than title: the slot is the stable identifier the rack
 * is ordered by, and a project can be renamed without silently losing its
 * diagram. A bay with no visual simply renders nothing.
 */
const VISUAL_BY_SLOT: Record<string, () => ReactNode> = {
  '01': Reconciliation,
  '02': ExplanationGate,
  '03': IntegrityTelemetry,
};

export function ProjectVisual({ slot }: { slot: string }) {
  const Visual = VISUAL_BY_SLOT[slot];
  if (!Visual) return null;
  return <Visual />;
}
