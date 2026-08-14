'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame } from '@/store/machine';

/**
 * Deep background dust, always present.
 *
 * For most of the scroll (boot, core, projects) the space behind the machine
 * was just flat fog and a single background colour — correct, but flat. This
 * is one static Points draw call: a sparse shell of dim points far outside
 * the machine's own radius, so it reads as depth behind the chassis rather
 * than competing with it. A built-in PointsMaterial (no custom shader) keeps
 * the cost to what the geometry itself already pays for — there is nothing
 * here that needs per-particle procedural motion.
 */
export function Starfield({ count = 900 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Uniform points on a shell so density looks even from any camera
      // station, rather than clumping at the poles like a naive spherical
      // coordinate sample would.
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 46 + Math.random() * 54;
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    // Rotation far too slow to read as motion — it only keeps the field from
    // feeling like a static painted backdrop over a long visit.
    if (pointsRef.current) pointsRef.current.rotation.y += Math.min(dt, 0.05) * 0.004;
    if (materialRef.current) {
      // Rides in with the power ramp, same as the rest of the lit scene —
      // the machine is genuinely off before that, so the sky should be too.
      materialRef.current.opacity = frame.power * 0.4;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={materialRef}
        color="#9fb4d8"
        size={0.4}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
}
