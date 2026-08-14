'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine } from '@/store/machine';
import {
  CONDUIT_RAILS,
  CONDUIT_INNER_R,
  CONDUIT_OUTER_R,
  CONDUIT_Y,
  POWER_WINDOW,
  conduitRailAngle,
} from '../lib/blueprint';
import { glowVertexShader, glowFragmentShader } from '../lib/shaders';

const AMBER = new THREE.Color('#ffb163');

/**
 * Power-flow pulses (§4).
 *
 * The conduits already glow at a constant intensity, which implies energy
 * moving through them but never actually shows it. This makes it literal: a
 * bright point genuinely travels each rail from the core out to the rack, at
 * a speed that tracks real scroll velocity — the machine visibly working
 * harder as the visitor moves faster, not a looped decoration (§19).
 *
 * Four independent billboarded sprites, staggered in phase so the rails don't
 * pulse in lockstep. Cheap: one small circle geometry, one shared shader, four
 * draw calls total.
 */
function Pulse({ rail }: { rail: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const angle = useMemo(() => conduitRailAngle(rail), [rail]);
  const phase = rail / CONDUIT_RAILS;

  // Local simulation clock rather than raw elapsed time — this is what lets
  // the Experiment Lab's SPEED control and the debug override's speed slider
  // reach the conduits too, the same way they already reach the particle
  // field, instead of the pulses being the one thing in the scene those
  // controls don't touch.
  const tRef = useRef(phase);

  const uniforms = useMemo(
    () => ({
      uColor: { value: AMBER },
      uIntensity: { value: 0 },
    }),
    [],
  );

  useFrame(({ camera }, dt) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const [start, end] = POWER_WINDOW.conduit;
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
      // Travel speed tracks scroll energy on top of the sim clock — idle
      // machines still breathe power, a working one visibly pumps it faster.
      const railsPerSecond = (0.12 + frame.velocity * 1.6) * simSpeed;
      tRef.current = (tRef.current + Math.min(dt, 0.05) * railsPerSecond) % 1;
    }

    const t = tRef.current;
    const r = THREE.MathUtils.lerp(CONDUIT_INNER_R, CONDUIT_OUTER_R, t);

    mesh.position.set(Math.cos(angle) * r, CONDUIT_Y, Math.sin(angle) * r);
    mesh.quaternion.copy(camera.quaternion);

    // Fades in/out at each end of its run so it reads as emerging from the
    // core and arriving at the rack, not popping in and out abruptly.
    const edgeFade = Math.min(1, Math.sin(t * Math.PI) * 3);
    mat.uniforms.uIntensity.value = visible * edgeFade * (0.7 + frame.velocity * 1.2);
  });

  return (
    <mesh ref={meshRef} scale={0.32} renderOrder={1}>
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

export function ConduitPulses() {
  return (
    <>
      {Array.from({ length: CONDUIT_RAILS }, (_, i) => (
        <Pulse key={i} rail={i} />
      ))}
    </>
  );
}
