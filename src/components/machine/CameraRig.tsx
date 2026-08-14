'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine } from '@/store/machine';
import { sections } from '@/lib/data/sections';
import { MONITOR_POS, MONITOR_ROT_Y } from './lib/blueprint';

/**
 * Camera stations — one viewpoint per section, positioned around the machine
 * at origin. The camera never travels through a large empty level; instead the
 * machine reconfigures itself as the visitor scrolls, which keeps the scene
 * small, the draw distance short, and the choreography legible.
 */
interface Station {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/**
 * Distances are set against the machine's real extent: it spans roughly 14
 * units across (rack at x≈7, conduits to r≈5.6). Framing that at ~42° vertical
 * FOV needs the camera around 20 units out, so these are not arbitrary numbers.
 */
const STATIONS: Record<string, Station> = {
  // Standby: down at deck level among the components, before anything lights.
  boot: { pos: [0, 0.4, 5.2], target: [0, 0, 0], fov: 34 },
  // Post-reveal resting view. Raised well above the deck — the machine is a
  // board now, and a board only reads as one from an angle that shows its
  // surface. A near-level shot flattens it back into an abstract silhouette,
  // which is exactly the problem this redesign set out to fix.
  core: { pos: [1.5, 7.6, 15.5], target: [0, -0.5, 0.4], fov: 42 },
  // Track down the storage bays, angled so they read in perspective.
  projects: { pos: [12.5, 4.6, 9.8], target: [6.0, -0.2, 0], fov: 38 },
  // Raised three-quarter across the board, favouring the memory and socket.
  experience: { pos: [-11.0, 7.2, 13.0], target: [0, -0.5, 0], fov: 44 },
  // Near-overhead: the layout shot, where the board plan is clearest.
  impact: { pos: [0.5, 13.0, 11.0], target: [0, -0.5, 0], fov: 46 },
  // Low and forward, looking back across the deck past the card.
  contact: { pos: [0, 3.2, 14.0], target: [0, -0.4, -1.5], fov: 42 },
};

/**
 * The reveal (§3.10). During activation the camera pulls back from inside the
 * machine to the full exterior view, driven by the power ramp rather than by
 * scroll — otherwise a visitor who powers on without scrolling would sit inside
 * the heatsink and never see what they switched on.
 */
const REVEAL_TARGET: Station = { pos: [1.5, 7.6, 15.5], target: [0, -0.5, 0.4], fov: 42 };

/**
 * The monitor close-up, computed from the screen's own placement rather than
 * hand-typed — square onto the glass, far enough back that the emerging
 * module clears frame, and a longer lens so the shot compresses like a real
 * product close-up instead of bowing at the edges.
 *
 * This is only reachable while the machine has settled square (see
 * MachineTransform in Scene.tsx), which is what makes a fixed world-space
 * station land on-axis every time.
 */
const MONITOR_STATION: Station = (() => {
  const dist = 7.2;
  const c = Math.cos(MONITOR_ROT_Y);
  const s = Math.sin(MONITOR_ROT_Y);
  // The screen's outward normal in world space (+z rotated about Y).
  const nx = s;
  const nz = c;
  return {
    pos: [MONITOR_POS[0] + nx * dist, MONITOR_POS[1] + 0.55, MONITOR_POS[2] + nz * dist],
    target: [MONITOR_POS[0], MONITOR_POS[1], MONITOR_POS[2]],
    fov: 30,
  };
})();

function lerpStation(a: Station, b: Station, k: number): Station {
  return {
    pos: [
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], k),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], k),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], k),
    ],
    target: [
      THREE.MathUtils.lerp(a.target[0], b.target[0], k),
      THREE.MathUtils.lerp(a.target[1], b.target[1], k),
      THREE.MathUtils.lerp(a.target[2], b.target[2], k),
    ],
    fov: THREE.MathUtils.lerp(a.fov, b.fov, k),
  };
}

const _pos = new THREE.Vector3();
const _target = new THREE.Vector3();
const _monPos = new THREE.Vector3();
const _monTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Shifts the machine toward the right of the frame on wide viewports, so it
 * does not sit underneath the left-aligned text column.
 *
 * The offset is applied along the camera's own right vector rather than world
 * X, because the stations look at the machine from different angles — a fixed
 * world-space nudge would push the machine off-screen at some of them and do
 * nothing at others.
 */
function applyComposition(pos: THREE.Vector3, target: THREE.Vector3, amount: number) {
  if (amount === 0) return;
  _forward.subVectors(target, pos).normalize();
  _right.crossVectors(_forward, UP).normalize();
  // Aiming left of the machine puts the machine right of centre.
  target.addScaledVector(_right, -amount);
}

/** Blends between the two stations bracketing the current scroll position. */
function bracket(t: number) {
  let lower = sections[0];
  let upper = sections[sections.length - 1];

  for (let i = 0; i < sections.length - 1; i++) {
    if (t >= sections[i].t && t <= sections[i + 1].t) {
      lower = sections[i];
      upper = sections[i + 1];
      break;
    }
  }
  if (t < sections[0].t) { lower = upper = sections[0]; }
  if (t > sections[sections.length - 1].t) { lower = upper = sections[sections.length - 1]; }

  const span = upper.t - lower.t;
  const raw = span > 0 ? (t - lower.t) / span : 0;
  // Smoothstep the blend so stations feel like they settle rather than glide
  // linearly past — this is what makes modules read as "locking into position".
  const k = THREE.MathUtils.clamp(raw, 0, 1);
  const eased = k * k * (3 - 2 * k);

  const a = STATIONS[lower.id] ?? STATIONS.core;
  const b = STATIONS[upper.id] ?? STATIONS.core;
  return { a, b, eased };
}

/**
 * Resolves the camera for the current frame: the scroll-driven station, with
 * the activation pull-back applied on top while the boot is still running.
 */
function resolveStation(t: number, power: number): Station {
  const { a, b, eased } = bracket(t);
  const scrolled = lerpStation(a, b, eased);

  // Once the visitor has scrolled past standby, scroll owns the camera.
  if (t > 0.02) return scrolled;

  // At standby we are inside the machine; as power ramps we withdraw to the
  // full exterior view. Eased so the pull-back decelerates into its resting
  // position rather than stopping dead.
  const k = power * power * (3 - 2 * power);
  return lerpStation(STATIONS.boot, REVEAL_TARGET, k);
}

export function CameraRig() {
  const { camera, size } = useThree();
  const reducedMotion = useMachine((s) => s.reducedMotion);
  const initialised = useRef(false);

  // Narrower viewports need a wider field of view to keep the machine framed.
  const fovScale = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    return aspect < 0.85 ? 1.42 : aspect < 1.2 ? 1.18 : 1;
  }, [size.width, size.height]);

  // Portrait viewports also need the camera further back.
  const distanceScale = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    return aspect < 0.85 ? 1.45 : aspect < 1.2 ? 1.15 : 1;
  }, [size.width, size.height]);

  /**
   * Only wide viewports have room to hold the machine beside the text. On
   * narrow screens the content is full-width, so the machine stays centred and
   * simply sits behind it at low opacity.
   */
  const compositionOffset = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    if (aspect < 1.2) return 0;
    return aspect > 1.7 ? 4.2 : 2.6;
  }, [size.width, size.height]);

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const station = resolveStation(frame.t, frame.power);

    _pos.set(...station.pos).multiplyScalar(distanceScale);
    _target.set(...station.target);
    applyComposition(_pos, _target, compositionOffset);

    let fov = station.fov * fovScale;

    /*
     * Dolly toward the screen while a project breaks out of it.
     *
     * Blended here in world space, after the scroll station and its
     * composition offset are resolved, rather than inside resolveStation:
     * the scroll stations all aim near the origin, so their `distanceScale`
     * is applied from the origin, and reusing that on a station aimed at the
     * monitor (which is nowhere near the origin) would swing the camera off
     * the screen's axis on exactly the narrow viewports that need the pull-
     * back most. Scaling the monitor station about its own target instead
     * keeps it square to the glass at every aspect ratio.
     *
     * Skipped entirely under reduced motion — with the eased travel
     * suppressed this would be an instantaneous viewpoint teleport, which is
     * precisely the kind of jump that preference exists to prevent. Nothing
     * is lost: the project's content lives in the DOM panel either way.
     */
    if (!reducedMotion && frame.emerge > 0.001) {
      _monTarget.set(...MONITOR_STATION.target);
      _monPos
        .set(...MONITOR_STATION.pos)
        .sub(_monTarget)
        .multiplyScalar(distanceScale)
        .add(_monTarget);

      /*
       * Hold the screen off-centre for the same reason the wide shots hold
       * the machine off-centre — the reading column occupies the left of the
       * viewport, and a close-up that centres the monitor parks it directly
       * behind the heading. Scaled well down from the wide-shot offset
       * because this station sits ~6 units from its subject rather than ~18,
       * and the same world-space nudge that reads as a third of a screen out
       * there would throw the monitor out of frame entirely here.
       */
      applyComposition(_monPos, _monTarget, compositionOffset * 0.4);

      // Capped short of a full takeover so the visitor's scroll position
      // stays legible underneath the move.
      const e = frame.emerge;
      const k = e * e * (3 - 2 * e) * 0.66;

      _pos.lerp(_monPos, k);
      _target.lerp(_monTarget, k);
      fov = THREE.MathUtils.lerp(fov, MONITOR_STATION.fov * fovScale, k);
    }

    // Pointer parallax: a small camera offset, not a scene rotation, so the
    // visitor feels they are moving their head rather than spinning the object.
    if (!reducedMotion) {
      _pos.x += frame.pointer.x * 0.55;
      _pos.y += frame.pointer.y * 0.4;
    }

    if (!initialised.current) {
      cam.position.copy(_pos);
      cam.fov = fov;
      initialised.current = true;
    } else {
      // Critically-damped follow. Frame-rate independent, so a 144Hz display
      // and a 30fps laptop reach the target in the same wall-clock time.
      const damp = reducedMotion ? 1 : 1 - Math.exp(-6.5 * Math.min(dt, 0.05));
      cam.position.lerp(_pos, damp);
      cam.fov += (fov - cam.fov) * damp;
    }

    _lookTarget.lerp(_target, initialised.current ? 1 - Math.exp(-5 * Math.min(dt, 0.05)) : 1);
    cam.lookAt(_lookTarget);
    cam.updateProjectionMatrix();
  });

  return null;
}
