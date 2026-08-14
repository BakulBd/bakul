'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame } from '@/store/machine';

/**
 * COMPUTER BACKDROP (boot / core)
 *
 * A flat procedural circuit-board panel behind the machine, so the standby
 * scene reads unmistakably as "this is a computer" rather than an abstract
 * industrial shape. One plane, no textures — the trace grid, chip pads, and
 * a travelling signal sweep are all drawn analytically in the fragment
 * shader, so the cost is a single draw call regardless of pattern detail.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uPower;
  uniform vec3 uAmber;
  uniform vec3 uCyan;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
  }

  void main() {
    vec2 grid = vUv * vec2(30.0, 18.0);
    vec2 cell = floor(grid);
    vec2 f = fract(grid);

    // Trace lines: one seam per cell, alternating orientation by cell hash —
    // reads as a routed board rather than a plain checker grid.
    float edge = hash(cell);
    float line = 0.0;
    line = max(line, 1.0 - smoothstep(0.0, 0.07, abs(f.x - (edge > 0.5 ? 0.5 : 0.08))));
    line = max(line, 1.0 - smoothstep(0.0, 0.07, abs(f.y - (edge > 0.5 ? 0.08 : 0.5))));

    // Chip pads: a fraction of cells get a filled square, brighter than the traces.
    float chipRoll = hash(cell + 11.0);
    float chip = step(0.9, chipRoll) * (1.0 - smoothstep(0.24, 0.34, length(f - 0.5)));

    // A slow travelling signal sweep, only lighting traces it happens to cross.
    float sweep = fract(uTime * 0.045);
    float pulse = (1.0 - smoothstep(0.0, 0.1, abs(vUv.x - sweep))) * step(0.35, hash(cell + 3.0));

    vec3 color = mix(uAmber, uCyan, 0.15) * (line * 0.9 + chip * 1.6 + pulse * 1.3);
    float alpha = (line * 0.55 + chip * 0.85 + pulse * 0.75) * uPower;

    if (alpha < 0.003) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function CircuitPanel() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPower: { value: 0 },
      uAmber: { value: new THREE.Color('#ff8c00') },
      uCyan: { value: new THREE.Color('#00e5ff') },
    }),
    [],
  );

  useFrame((_, dt) => {
    /*
     * Write through the material's OWN uniforms object, not the memoised
     * closure copy — R3F doesn't guarantee the object passed via the
     * `uniforms` prop is the one the compiled material actually keeps (see
     * the identical note on MorphField's uniform updates). Updating the
     * closure copy compiles and renders fine, it just silently leaves uPower
     * stuck at its initial 0 forever, so alpha (which multiplies by uPower)
     * discards every fragment — a shader that "works" but is invisible.
     */
    const u = materialRef.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(dt, 0.05);
    u.uPower.value = frame.power;
  });

  return (
    <mesh position={[0, 1, -11]}>
      <planeGeometry args={[38, 22]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        fog={false}
      />
    </mesh>
  );
}
