'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine } from '@/store/machine';
import { BUS_TRACES, POWER_WINDOW, type Vec3 } from '../lib/blueprint';
import { glowVertexShader, glowFragmentShader } from '../lib/shaders';

const CYAN = new THREE.Color('#7fe9ff');

/**
 * BUS TRAFFIC (§4)
 *
 * The traces already glow at a constant intensity, which implies data moving
 * along them but never actually shows it. This makes it literal: a bright
 * packet genuinely walks each route from the socket out to its subsystem, at
 * a speed that tracks real scroll velocity — the machine visibly working
 * harder as the visitor moves faster, not a looped decoration (§19).
 *
 * Packets follow the same `BUS_TRACES` polylines the physical trace segments
 * were emitted from, so they run *on* the copper rather than near it. One
 * small circle geometry, one shared shader, one draw call per lane.
 */

/** Total run length of a polyline, and its cumulative segment lengths. */
function measure(path: Vec3[]) {
  const cumulative: number[] = [0];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, , az] = path[i];
    const [bx, , bz] = path[i + 1];
    total += Math.hypot(bx - ax, bz - az);
    cumulative.push(total);
  }
  return { cumulative, total };
}

function Packet({ lane }: { lane: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const path = BUS_TRACES[lane];
  const { cumulative, total } = useMemo(() => measure(path), [path]);

  // Staggered start so lanes don't pulse in lockstep.
  const tRef = useRef((lane * 0.37) % 1);

  const uniforms = useMemo(
    () => ({
      uColor: { value: CYAN },
      uIntensity: { value: 0 },
    }),
    [],
  );

  useFrame(({ camera }, dt) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const [start, end] = POWER_WINDOW.bus;
    const lit = THREE.MathUtils.smoothstep(frame.power, start, end);
    const dissolve = 1 - THREE.MathUtils.smoothstep(frame.morph, 0.0, 0.5);
    const visible = lit * dissolve;

    if (visible < 0.01) {
      mat.uniforms.uIntensity.value = 0;
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const { lab, debug, debugSpeed, reducedMotion } = useMachine.getState();
    if (!reducedMotion) {
      const simSpeed = lab.speed * (debug ? debugSpeed : 1);
      // Travel speed tracks scroll energy on top of the sim clock — an idle
      // machine still ticks over, a working one visibly moves data faster.
      const runsPerSecond = (0.14 + frame.velocity * 1.7) * simSpeed;
      tRef.current = (tRef.current + Math.min(dt, 0.05) * runsPerSecond) % 1;
    }

    const t = tRef.current;
    const dist = t * total;

    // Walk to the segment holding this distance, then interpolate within it.
    let seg = 0;
    while (seg < cumulative.length - 2 && cumulative[seg + 1] < dist) seg++;
    const segStart = cumulative[seg];
    const segLen = Math.max(1e-4, cumulative[seg + 1] - segStart);
    const k = THREE.MathUtils.clamp((dist - segStart) / segLen, 0, 1);

    const a = path[seg];
    const b = path[seg + 1];
    mesh.position.set(a[0] + (b[0] - a[0]) * k, a[1] + 0.04, a[2] + (b[2] - a[2]) * k);
    mesh.quaternion.copy(camera.quaternion);

    // Fades in/out at each end of its run so it reads as leaving the socket
    // and arriving at its destination, not popping in and out abruptly.
    const edgeFade = Math.min(1, Math.sin(t * Math.PI) * 3);
    mat.uniforms.uIntensity.value = visible * edgeFade * (0.75 + frame.velocity * 1.2);
  });

  return (
    <mesh ref={meshRef} scale={0.22} renderOrder={1}>
      <circleGeometry args={[1, 16]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={glowVertexShader}
        fragmentShader={glowFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function BusTraffic() {
  return (
    <>
      {BUS_TRACES.map((_, i) => (
        <Packet key={i} lane={i} />
      ))}
    </>
  );
}
