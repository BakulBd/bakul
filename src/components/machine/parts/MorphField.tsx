'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine, type QualityProfile } from '@/store/machine';
import {
  sampleMachineSurface,
  buildLattice,
  buildLinks,
  sampleLattice,
} from '../lib/blueprint';
import { timeline } from '@/lib/data/sections';
import {
  morphVertexShader,
  morphFragmentShader,
  linkVertexShader,
  linkFragmentShader,
} from '../lib/shaders';

const AMBER = new THREE.Color('#ff8c00');
const CYAN = new THREE.Color('#00e5ff');

/**
 * THE SIGNATURE MOMENT — mechanical → scattered → structured.
 *
 * A single Points object carries the entire transformation. Buffers are built
 * once and never re-uploaded; the morph is a one-uniform animation on the GPU.
 * The lattice link lines are a second draw call that fades in as the
 * structure forms.
 *
 * This is a pure background flourish now, not tied to a dedicated content
 * section — it plays once as the visitor crosses from the project rack
 * toward the assembly line, then holds as a structured field behind the
 * reading sections at reduced presence (see PRESENCE_FADE below).
 */
export function MorphField({ profile }: { profile: QualityProfile }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const linkMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const count = profile.particles;

  /* ---- Geometry: built once per quality tier ---- */
  const { geometry, linkGeometry } = useMemo(() => {
    const { positions: machine, normals } = sampleMachineSurface(count);
    const lattice = buildLattice();
    const neural = sampleLattice(lattice, count);

    // Scatter state: pushed out along each point's own surface normal.
    // This is why the silhouette survives the break-up — the cloud is the
    // machine's surface inflated, not a random sphere.
    const scatter = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const push = 1.6 + Math.random() * 3.4;
      const jitter = () => (Math.random() - 0.5) * 1.5;
      scatter[i3] = machine[i3] + normals[i3] * push + jitter();
      scatter[i3 + 1] = machine[i3 + 1] + normals[i3 + 1] * push + jitter() + 0.8;
      scatter[i3 + 2] = machine[i3 + 2] + normals[i3 + 2] * push + jitter();

      seeds[i] = Math.random();
      // Long tail of small particles, few large ones — reads as dust and sparks.
      scales[i] = 0.55 + Math.pow(Math.random(), 3) * 2.1;
    }

    const g = new THREE.BufferGeometry();
    // `position` must exist for three's frustum culling, but the vertex shader
    // computes the real position from the three morph targets.
    g.setAttribute('position', new THREE.BufferAttribute(machine, 3));
    g.setAttribute('posMachine', new THREE.BufferAttribute(machine, 3));
    g.setAttribute('posScatter', new THREE.BufferAttribute(scatter, 3));
    g.setAttribute('posNeural', new THREE.BufferAttribute(neural, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    // The field spans both the machine and the lattice; a generous manual
    // bounding sphere prevents it popping out of view mid-morph.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 26);

    /* ---- Links ---- */
    const linkPositions = buildLinks(lattice, profile.neuralLinks);
    const linkCount = linkPositions.length / 6;
    const ts = new Float32Array(linkCount * 2);
    const linkSeeds = new Float32Array(linkCount * 2);
    for (let i = 0; i < linkCount; i++) {
      ts[i * 2] = 0;
      ts[i * 2 + 1] = 1;
      const s = Math.random();
      linkSeeds[i * 2] = s;
      linkSeeds[i * 2 + 1] = s;
    }

    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(linkPositions, 3));
    lg.setAttribute('aT', new THREE.BufferAttribute(ts, 1));
    lg.setAttribute('aLinkSeed', new THREE.BufferAttribute(linkSeeds, 1));
    lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 26);

    return { geometry: g, linkGeometry: lg };
  }, [count, profile.neuralLinks]);

  /* ---- Explicit disposal: quality changes rebuild these buffers ---- */
  useEffect(() => {
    return () => {
      geometry.dispose();
      linkGeometry.dispose();
    };
  }, [geometry, linkGeometry]);

  const uniforms = useMemo(
    () => ({
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uPower: { value: 0 },
      uVelocity: { value: 0 },
      uSize: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uPulse: { value: 0 },
      uGravity: { value: 1 },
      uSpeed: { value: 1 },
      uPixelRatio: { value: 1 },
      uAmber: { value: AMBER },
      uCyan: { value: CYAN },
    }),
    [],
  );

  const linkUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPulse: { value: 0 },
      uCyan: { value: CYAN },
    }),
    [],
  );

  useEffect(() => {
    frame.particles = count;
  }, [count]);

  useFrame((state, dt) => {
    /*
     * Write to the material's OWN uniforms object, not the one we memoised.
     *
     * React Three Fiber does not guarantee that the object passed via the
     * `uniforms` prop is the object the compiled material ends up using — it
     * may substitute its own during reconciliation. Updating the closure copy
     * then silently does nothing, which shows up as a shader running with
     * every uniform stuck at its initial value. Going through the ref is the
     * only version that is guaranteed to reach the GPU.
     */
    const u = materialRef.current?.uniforms;
    const lu = linkMaterialRef.current?.uniforms;
    if (!u) return;

    const { debug, debugSpeed, lab } = useMachine.getState();

    // Lab speed scales the simulation clock itself, so slowing it down slows
    // every motion in the field rather than just the drift.
    const clamped = Math.min(dt, 0.05) * lab.speed * (debug ? debugSpeed : 1);

    /*
     * Presence: how much of the screen the field is entitled to.
     *
     * It peaks through the transformation, then recedes to a background
     * presence so the reading sections (experience, impact, contact) stay
     * legible. Without this the lattice sits on top of every subsequent
     * paragraph.
     */
    const presence =
      1 -
      THREE.MathUtils.smoothstep(frame.t, timeline.presenceFadeStart, timeline.presenceFadeEnd) *
        0.78;

    u.uTime.value += clamped;
    u.uMorph.value = frame.morph;
    u.uPower.value = frame.power * presence;
    // A fixed baseline replaces the old user-adjustable noise slider — the
    // lab controls that drove it were part of the Experiment Lab, which no
    // longer exists, so the field keeps the same idle drift at a constant.
    u.uVelocity.value = frame.velocity + 0.21;
    u.uPulse.value = frame.pulse;
    u.uGravity.value = 1;
    u.uSpeed.value = 1;
    u.uSize.value = 1;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uPointer.value.set(frame.pointer.x, frame.pointer.y);

    if (lu) {
      lu.uTime.value += clamped;
      // Links only exist once the lattice has actually formed.
      lu.uReveal.value =
        THREE.MathUtils.smoothstep(frame.morph, 0.6, 0.95) * frame.power * presence;
      lu.uPulse.value = frame.pulse;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={morphVertexShader}
          fragmentShader={morphFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments geometry={linkGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={linkMaterialRef}
          vertexShader={linkVertexShader}
          fragmentShader={linkFragmentShader}
          uniforms={linkUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
