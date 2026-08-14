'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame } from '@/store/machine';
import {
  TURBINE_PIVOTS,
  TURBINE_BLADES,
  TURBINE_BLADE_RADIUS,
} from '../lib/blueprint';
import { glowVertexShader, glowFragmentShader } from '../lib/shaders';

const TITANIUM = new THREE.Color('#4e535c');
const CYAN = new THREE.Color('#00e5ff');
const HEAT_GLOW = new THREE.Color('#ffab5c');

/**
 * Cooling turbines — the machine's most direct load indicator.
 *
 * Rotation rate is driven by real scroll velocity with mechanical inertia:
 * they spin up when the visitor moves and coast down when they stop, so the
 * machine visibly reports how hard it is being worked (§4).
 */
const dummy = new THREE.Object3D();

function Turbine({ pivot, direction }: { pivot: [number, number, number]; direction: number }) {
  const bladesRef = useRef<THREE.Group>(null);
  const bladeMeshRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMatRef = useRef<THREE.ShaderMaterial>(null);

  // Angular velocity persists between frames — this is the inertia.
  const spin = useRef(0);

  const glowUniforms = useMemo(
    () => ({ uColor: { value: HEAT_GLOW }, uIntensity: { value: 0 } }),
    [],
  );

  const bladeGeo = useMemo(() => new THREE.BoxGeometry(0.62, 0.035, 0.19), []);
  const hubGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.2, 0.3, 14), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.92, 0.11, 8, 40), []);
  const glowGeo = useMemo(() => new THREE.CircleGeometry(1, 16), []);

  // One material instance shared by every rotor part, so a single per-frame
  // update drives them all and there is only one shader program to compile.
  const rotorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: TITANIUM,
        metalness: 0.55,
        roughness: 0.44,
        emissive: CYAN,
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  const housingMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: TITANIUM,
        metalness: 0.6,
        roughness: 0.36,
        emissive: CYAN,
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      rotorMat.dispose();
      housingMat.dispose();
      bladeGeo.dispose();
      hubGeo.dispose();
      ringGeo.dispose();
      glowGeo.dispose();
    };
  }, [rotorMat, housingMat, bladeGeo, hubGeo, ringGeo, glowGeo]);

  // All seven blades are static relative to the group that spins them, so
  // their instance matrices are built once and never touched again — only
  // bladesRef's own rotation animates, exactly as when each blade was its own
  // mesh, but as one draw call instead of seven.
  const bladeMatrices = useMemo(
    () =>
      Array.from({ length: TURBINE_BLADES }, (_, b) => {
        const a = (b / TURBINE_BLADES) * Math.PI * 2;
        dummy.position.set(Math.cos(a) * TURBINE_BLADE_RADIUS, 0, Math.sin(a) * TURBINE_BLADE_RADIUS);
        dummy.rotation.set(0, -a, 0.34);
        dummy.updateMatrix();
        return dummy.matrix.clone();
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = bladeMeshRef.current;
    if (!mesh) return;
    bladeMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [bladeMatrices]);

  useFrame(({ camera }, dt) => {
    const clamped = Math.min(dt, 0.05);

    // Target rate: idle hum plus whatever the visitor is driving into it.
    const target = 0.55 + frame.velocity * 11;
    // Asymmetric response — spins up faster than it coasts down, like mass.
    const rate = target > spin.current ? 2.4 : 0.7;
    spin.current += (target - spin.current) * Math.min(1, clamped * rate);

    if (bladesRef.current) {
      bladesRef.current.rotation.y += spin.current * clamped * direction;
    }

    const lit = THREE.MathUtils.smoothstep(frame.power, 0.5, 0.78);
    const dissolve = 1 - THREE.MathUtils.smoothstep(frame.morph, 0, 0.5);
    const visible = lit * dissolve;
    // Kept low: turbines are structural metal, lit by the rig rather than
    // glowing on their own. Only the rate of spin reports load.
    const emissive = visible * (0.03 + frame.velocity * 0.12);

    for (const m of [rotorMat, housingMat]) {
      m.opacity = visible;
      m.visible = visible > 0.01;
      m.emissiveIntensity = emissive;
    }

    // Engine-glow disc: a soft heat bloom behind the rotor that visibly
    // flares as the turbine spins up under load, and settles to a faint idle
    // warmth otherwise — the same "load, not decoration" logic as the spin
    // rate itself, just made visible as light instead of motion.
    const glow = glowRef.current;
    const glowMat = glowMatRef.current;
    if (glow && glowMat) {
      const spinNorm = THREE.MathUtils.clamp((spin.current - 0.55) / 8, 0, 1);
      glowMat.uniforms.uIntensity.value = visible * (0.12 + spinNorm * 0.85);
      const scale = 0.5 + spinNorm * 0.4;
      glow.scale.setScalar(scale);
      glow.quaternion.copy(camera.quaternion);
      glow.visible = visible > 0.01;
    }
  });

  return (
    <group position={pivot}>
      <mesh geometry={ringGeo} material={housingMat} rotation={[Math.PI / 2, 0, 0]} />

      <mesh ref={glowRef} geometry={glowGeo} renderOrder={1}>
        <shaderMaterial
          ref={glowMatRef}
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={bladesRef}>
        <mesh geometry={hubGeo} material={rotorMat} />
        <instancedMesh ref={bladeMeshRef} args={[bladeGeo, rotorMat, TURBINE_BLADES]} />
      </group>
    </group>
  );
}

export function Turbines() {
  return (
    <group>
      {TURBINE_PIVOTS.map((p, i) => (
        <Turbine key={i} pivot={p} direction={i % 2 === 0 ? 1 : -1} />
      ))}
    </group>
  );
}
