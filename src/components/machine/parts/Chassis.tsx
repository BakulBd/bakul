'use client';

import { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine } from '@/store/machine';
import {
  blueprint,
  dimmTag,
  MEMORY_SLOTS,
  POWER_WINDOW,
  RACK_MODULE_COUNT,
  rackModuleTag,
  type Group,
  type Shape,
} from '../lib/blueprint';
import { projects } from '@/lib/data/projects';

const TITANIUM = new THREE.Color('#454a52');

/**
 * Base colour per subsystem.
 *
 * A single titanium for everything is what made the board read as moulded
 * foam rather than hardware: a real mainboard is a near-black laminate with
 * bright metal only where there is actually metal. Giving the deck its own
 * dark substrate and reserving the light alloy for heatsinks and fan rotors
 * is what separates the components from the thing they are mounted on.
 */
const COLOR_BY_GROUP: Record<Group, THREE.Color> = {
  board: new THREE.Color('#0e1219'),
  core: new THREE.Color('#4a4f58'),
  memory: new THREE.Color('#242932'),
  bus: new THREE.Color('#5c4a24'),
  gpu: new THREE.Color('#1e222a'),
  cooling: new THREE.Color('#4e535c'),
  storage: new THREE.Color('#363b43'),
  monitor: new THREE.Color('#252a32'),
};
const AMBER = new THREE.Color('#ff8c00');
const CYAN = new THREE.Color('#00e5ff');
const IDLE_EMISSIVE = new THREE.Color('#8b909c');

/**
 * Emissive gain per subsystem.
 *
 * Deliberately low for structural parts. Titanium should read as metal caught
 * by the key light — if every surface emits, the whole machine flattens into a
 * single orange silhouette and all the modelling is lost. Only the conduits
 * genuinely glow, because they are the part that is actually carrying energy.
 */
const EMISSIVE_GAIN: Record<Group, number> = {
  // Bare PCB and casework are surfaces the key light catches, not sources.
  board: 0.05,
  core: 0.12,
  // Memory glows on access — the bank is the most legible activity readout
  // on a real board, so it gets to actually read as one here.
  memory: 0.32,
  bus: 0.85,
  gpu: 0.18,
  cooling: 0.1,
  storage: 0.16,
  // The bezel is a housing, not a light source — the screen inside it does
  // the glowing, so the frame stays as dark as the rest of the casework.
  monitor: 0.06,
};

const dummy = new THREE.Object3D();

/** Builds the per-instance matrices for one primitive kind within one group. */
function useInstances(kind: Shape['kind'], group: Group) {
  return useMemo(() => {
    // Tagged shapes (the rack module bodies) are rendered individually by
    // RackModules below, so the active bay can glow and move on its own —
    // excluded here to avoid drawing them twice.
    const items = blueprint.filter((s) => s.kind === kind && s.group === group && !s.tag);
    const matrices = items.map((s) => {
      dummy.position.set(...s.pos);
      dummy.rotation.set(...(s.rot ?? [0, 0, 0]));

      if (s.kind === 'box') dummy.scale.set(...s.size);
      else if (s.kind === 'cyl') dummy.scale.set(s.radius, s.height, s.radius);
      else dummy.scale.setScalar(1);

      dummy.updateMatrix();
      return dummy.matrix.clone();
    });
    return { items, matrices };
  }, [kind, group]);
}

/**
 * A batch of identical primitives sharing one draw call. Torus instances carry
 * baked radii, so each distinct torus gets its own batch keyed by dimensions.
 */
function InstancedBatch({
  kind,
  group,
  geometry,
  materialRef,
}: {
  kind: Shape['kind'];
  group: Group;
  geometry: THREE.BufferGeometry;
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { matrices } = useInstances(kind, group);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  if (matrices.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, matrices.length]}
      castShadow={false}
      receiveShadow={false}
    >
      <meshStandardMaterial
        ref={materialRef}
        color={COLOR_BY_GROUP[group] ?? TITANIUM}
        metalness={group === 'board' ? 0.22 : 0.58}
        roughness={group === 'board' ? 0.72 : 0.42}
        emissive={AMBER}
        emissiveIntensity={0}
        transparent
        opacity={0}
      />
    </instancedMesh>
  );
}

/** One machine subsystem: all its primitives, lit as a unit. */
function Subsystem({ group }: { group: Group }) {
  const boxMat = useRef<THREE.MeshStandardMaterial>(null);
  const cylMat = useRef<THREE.MeshStandardMaterial>(null);
  const torusMats = useRef<THREE.MeshStandardMaterial[]>([]);

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const cylGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 12), []);

  // Torus radius cannot be expressed in an instance matrix without distorting
  // the tube, so each distinct torus profile becomes its own small batch.
  const toruses = useMemo(
    () =>
      blueprint.filter((s): s is Extract<Shape, { kind: 'torus' }> => s.kind === 'torus' && s.group === group),
    [group],
  );

  const torusGeos = useMemo(
    () => toruses.map((t) => new THREE.TorusGeometry(t.radius, t.tube, 6, 48)),
    [toruses],
  );

  useLayoutEffect(() => {
    const geos = [boxGeo, cylGeo, ...torusGeos];
    return () => geos.forEach((g) => g.dispose());
  }, [boxGeo, cylGeo, torusGeos]);

  useFrame(() => {
    const [start, end] = POWER_WINDOW[group];
    const lit = THREE.MathUtils.smoothstep(frame.power, start, end);

    // The machine yields to the particle field during the transformation.
    const dissolve = 1 - THREE.MathUtils.smoothstep(frame.morph, 0.0, 0.5);
    const opacity = lit * dissolve;

    // Emissive tracks scroll energy, so a faster scroll visibly drives the
    // machine harder — motion reporting state, not decoration (§19).
    const drive = 0.4 + frame.velocity * 1.1;
    const intensity = lit * dissolve * drive * EMISSIVE_GAIN[group];

    const mats = [boxMat.current, cylMat.current, ...torusMats.current];
    for (const m of mats) {
      if (!m) continue;
      m.opacity = opacity;
      m.emissiveIntensity = intensity;
      m.visible = opacity > 0.01;
    }
  });

  return (
    <group>
      <InstancedBatch kind="box" group={group} geometry={boxGeo} materialRef={boxMat} />
      <InstancedBatch kind="cyl" group={group} geometry={cylGeo} materialRef={cylMat} />
      {toruses.map((t, i) => (
        <mesh
          key={`${group}-torus-${i}`}
          geometry={torusGeos[i]}
          position={t.pos}
          rotation={t.rot ?? [0, 0, 0]}
        >
          <meshStandardMaterial
            ref={(m) => {
              if (m) torusMats.current[i] = m;
            }}
            color={COLOR_BY_GROUP[group] ?? TITANIUM}
            metalness={0.58}
            roughness={0.38}
            emissive={group === 'bus' || group === 'memory' ? CYAN : AMBER}
            emissiveIntensity={0}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * One rack module body, addressable on its own — this is what makes "active
 * project modules physically move" (§7) literally true instead of implied.
 * The bay matching the DOM's `activeProject` slides forward and lights up in
 * full amber; the others stay in place at a dim idle glow. Populated bays get
 * a brighter idle state than empty slots, a small honest touch since the
 * rack itself already knows which bays are real (`projects` data).
 */
function RackModule({ index, shape }: { index: number; shape: Extract<Shape, { kind: 'box' }> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const populated = projects[index]?.status === 'online';

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const [start, end] = POWER_WINDOW.storage;
    const lit = THREE.MathUtils.smoothstep(frame.power, start, end);
    const dissolve = 1 - THREE.MathUtils.smoothstep(frame.morph, 0.0, 0.5);
    const opacity = lit * dissolve;

    const isActive = index === useMachine.getState().activeProject;
    const targetX = shape.pos[0] + (isActive ? 0.55 : 0);
    // Snaps instantly under reduced motion, matching the camera rig — a
    // continuous slide is exactly the kind of motion that preference exists
    // to suppress, even a small one.
    const reducedMotion = useMachine.getState().reducedMotion;
    const damp = reducedMotion ? 1 : 1 - Math.exp(-8 * Math.min(dt, 0.05));
    mesh.position.x += (targetX - mesh.position.x) * damp;

    const drive = 0.4 + frame.velocity * 1.1;
    const idleGain = populated ? 0.22 : 0.08;
    const targetIntensity = isActive ? drive * 1.6 : drive * idleGain;
    mat.emissiveIntensity += (targetIntensity - mat.emissiveIntensity) * damp;
    mat.emissive.copy(isActive ? AMBER : populated ? AMBER : IDLE_EMISSIVE);

    mat.opacity = opacity;
    mat.visible = opacity > 0.01;
  });

  return (
    <mesh ref={meshRef} position={shape.pos} scale={shape.size}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        ref={matRef}
        color={TITANIUM}
        metalness={0.58}
        roughness={0.4}
        emissive={AMBER}
        emissiveIntensity={0}
        transparent
        opacity={0}
      />
    </mesh>
  );
}

function RackModules() {
  const modules = useMemo(
    () =>
      Array.from({ length: RACK_MODULE_COUNT }, (_, i) => {
        const tag = rackModuleTag(i);
        const shape = blueprint.find(
          (s): s is Extract<Shape, { kind: 'box' }> => s.kind === 'box' && s.tag === tag,
        );
        return shape ? { index: i, shape } : null;
      }).filter((m): m is { index: number; shape: Extract<Shape, { kind: 'box' }> } => m !== null),
    [],
  );

  return (
    <>
      {modules.map((m) => (
        <RackModule key={m.index} index={m.index} shape={m.shape} />
      ))}
    </>
  );
}

/**
 * The memory bank, addressed one module at a time.
 *
 * A bank of DIMMs lit uniformly is just four bright slabs; a bank where the
 * modules light in turn is unmistakably memory being accessed. The address
 * walks the bank on the same clock the bus packets travel on, so what the
 * traces are carrying and what the memory is doing describe one machine
 * rather than two independent loops — and the rate rides scroll velocity, so
 * the bank visibly works harder exactly when everything else does.
 */
function MemoryBank() {
  const modules = useMemo(
    () =>
      Array.from({ length: MEMORY_SLOTS }, (_, i) => {
        const tag = dimmTag(i);
        const shape = blueprint.find(
          (s): s is Extract<Shape, { kind: 'box' }> => s.kind === 'box' && s.tag === tag,
        );
        return shape ? { index: i, shape } : null;
      }).filter((m): m is { index: number; shape: Extract<Shape, { kind: 'box' }> } => m !== null),
    [],
  );

  const matsRef = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const cursor = useRef(0);

  useFrame((_, dt) => {
    const [start, end] = POWER_WINDOW.memory;
    const lit = THREE.MathUtils.smoothstep(frame.power, start, end);
    const dissolve = 1 - THREE.MathUtils.smoothstep(frame.morph, 0.0, 0.5);
    const opacity = lit * dissolve;

    const { reducedMotion } = useMachine.getState();
    if (!reducedMotion) {
      // Same cadence the bus packets run at, so access and transfer agree.
      cursor.current += Math.min(dt, 0.05) * (0.9 + frame.velocity * 5.5);
    }

    for (let i = 0; i < matsRef.current.length; i++) {
      const m = matsRef.current[i];
      if (!m) continue;
      // Triangular falloff around the addressed module: the neighbour either
      // side glows faintly, which reads as a burst walking the bank rather
      // than four independent blinkers.
      const phase = Math.abs(((cursor.current - i) % MEMORY_SLOTS) + MEMORY_SLOTS) % MEMORY_SLOTS;
      const d = Math.min(phase, MEMORY_SLOTS - phase);
      const hit = Math.max(0, 1 - d);
      m.opacity = opacity;
      m.visible = opacity > 0.01;
      m.emissiveIntensity = opacity * (0.12 + hit * 1.5);
    }
  });

  return (
    <>
      {modules.map((m) => (
        <mesh key={m.index} position={m.shape.pos} scale={m.shape.size}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            ref={(mat) => {
              if (mat) matsRef.current[m.index] = mat;
            }}
            color={COLOR_BY_GROUP.memory}
            metalness={0.5}
            roughness={0.44}
            emissive={CYAN}
            emissiveIntensity={0}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </>
  );
}

/**
 * The solid machine body. Deliberately holds no transform of its own: the
 * shared MachineTransform in Scene.tsx moves the chassis and the particle
 * field together, so the particles dissolving off a surface stay locked to
 * the surface they came from.
 */
export function Chassis() {
  return (
    <group>
      {/* Fans are rendered separately — see Turbines.tsx */}
      {(['board', 'core', 'memory', 'bus', 'gpu', 'storage', 'monitor'] as Group[]).map((g) => (
        <Subsystem key={g} group={g} />
      ))}
      <MemoryBank />
      <RackModules />
    </group>
  );
}
