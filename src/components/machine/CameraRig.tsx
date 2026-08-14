'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine } from '@/store/machine';
import { sections } from '@/lib/data/sections';

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
  // Standby: tight on the core, deep inside the dark machine.
  boot: { pos: [0, 0.3, 5.2], target: [0, 0, 0], fov: 34 },
  // Post-reveal resting view of the complete machine.
  core: { pos: [0, 3.6, 17.5], target: [0, -0.2, 0], fov: 42 },
  // Track along the project rack, angled so the bay reads in perspective.
  // Tightened for a 3-bay rack — the shortest span this station has framed;
  // pulled in closer than the original 4-bay tuning so 3 modules don't read
  // as sparse.
  projects: { pos: [12.0, 1.9, 10.2], target: [6.4, 0, 0], fov: 38 },
  // Raised three-quarter view for the assembly line.
  experience: { pos: [-11.5, 4.8, 14.0], target: [0, -0.4, 0], fov: 44 },
  // Control-centre overhead.
  impact: { pos: [0, 10.0, 15.0], target: [0, 0, 0], fov: 46 },
  // Communication terminal.
  contact: { pos: [0, 1.4, 14.0], target: [0, 0, -2], fov: 42 },
};

/**
 * The reveal (§3.10). During activation the camera pulls back from inside the
 * machine to the full exterior view, driven by the power ramp rather than by
 * scroll — otherwise a visitor who powers on without scrolling would sit inside
 * the heatsink and never see what they switched on.
 */
const REVEAL_TARGET: Station = { pos: [0, 3.6, 17.5], target: [0, -0.2, 0], fov: 42 };

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

    const fov = station.fov * fovScale;

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
