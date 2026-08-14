'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine } from '@/store/machine';
import {
  MONITOR_POS,
  MONITOR_ROT_Y,
  MONITOR_SCREEN_W,
  MONITOR_SCREEN_H,
  POWER_WINDOW,
} from '../lib/blueprint';
import { drawOsScreen, OS_CANVAS_W, OS_CANVAS_H } from '../lib/osScreen';
import { projects } from '@/lib/data/projects';

/**
 * THE MONITOR — a real display inside the machine, and the portal a project
 * breaks out through.
 *
 * Three pieces, all driven by the single `frame.emerge` value so they cannot
 * drift apart mid-motion:
 *
 *   1. The screen. A subdivided plane carrying the BAKUL OS canvas texture.
 *      As a project pushes through, the vertex shader bulges the glass
 *      outward from the exit point and the fragment shader refracts the UI
 *      through that bulge — the display physically deforms rather than
 *      cross-fading.
 *   2. The emerging module. A solid slab that travels from *behind* the
 *      screen plane to out in front of it, so it genuinely crosses the
 *      boundary instead of appearing beside it.
 *   3. Escape particles. A burst that only exists while the surface is being
 *      broken, seeded across the aperture.
 *
 * All of it is decoration: the project's real content lives in the DOM panel
 * beside the rack, and nothing here is the only source of anything.
 */

/** Where the module punches through, in screen-local UV space. */
const EXIT_UV = new THREE.Vector2(0.5, 0.52);

const screenVertex = /* glsl */ `
  precision highp float;

  uniform float uEmerge;
  uniform vec2  uExit;

  varying vec2  vUv;
  varying float vBulge;

  void main() {
    vUv = uv;

    // Distance from the exit point, corrected for the screen's aspect so the
    // bulge is circular on the glass rather than an ellipse.
    vec2 d = (uv - uExit) * vec2(1.62, 1.0);
    float r = length(d);

    // A smooth dome that grows and then relaxes: the glass stretches most
    // while the object is mid-crossing, not once it is already clear.
    float crossing = sin(clamp(uEmerge, 0.0, 1.0) * 3.14159);
    float dome = exp(-r * r * 9.0) * crossing;

    vBulge = dome;

    // Push along the screen's own normal (+z in local space).
    vec3 pos = position + vec3(0.0, 0.0, dome * 0.62);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const screenFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform float uPower;    // CRT warm-up, gated by the monitor's boot window
  uniform float uTime;
  uniform float uEmerge;
  uniform vec2  uExit;
  uniform vec3  uCyan;

  varying vec2  vUv;
  varying float vBulge;

  void main() {
    vec2 uv = vUv;

    // --- Glass refraction -------------------------------------------
    // The bulge acts as a lens: sample the UI displaced toward the exit
    // point, proportional to how hard the surface is being stretched.
    vec2 toExit = uv - uExit;
    uv -= toExit * vBulge * 0.55;

    // Barrel curvature — a real display is not a perfect plane.
    vec2 c = uv - 0.5;
    uv += c * dot(c, c) * 0.045;

    // --- Chromatic split through the stretched glass ------------------
    float split = vBulge * 0.012;
    vec3 ui;
    ui.r = texture2D(uMap, uv + toExit * split).r;
    ui.g = texture2D(uMap, uv).g;
    ui.b = texture2D(uMap, uv - toExit * split).b;

    // Outside the panel after refraction reads as bezel, not stretched edge.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // --- CRT character -----------------------------------------------
    // Scanlines and a faint rolling refresh band. Subtle: this is a modern
    // panel with a little soul, not a 1970s tube.
    float scan = 0.955 + 0.045 * sin(vUv.y * 900.0);
    float roll = 0.985 + 0.015 * sin((vUv.y + uTime * 0.09) * 6.2831);
    vec3 color = ui * scan * roll;

    // Corner falloff so the panel sits in its bezel instead of floating.
    float vig = 1.0 - smoothstep(0.55, 1.05, length(c) * 1.6);
    color *= mix(0.55, 1.0, vig);

    // The break-out rim glows cyan along the stretched glass.
    color += uCyan * vBulge * 1.15;

    // --- Power-on ----------------------------------------------------
    // A horizontal band opens out from the centre as the display wakes, the
    // way a panel's backlight comes up.
    float open = smoothstep(0.0, 0.55, uPower);
    float band = smoothstep(0.5 - open * 0.55, 0.5 - open * 0.5, vUv.y)
               * smoothstep(0.5 + open * 0.55, 0.5 + open * 0.5, vUv.y);
    float on = mix(band, 1.0, smoothstep(0.5, 1.0, uPower));

    gl_FragColor = vec4(color * on, 1.0);

    /*
     * The UI texture is tagged sRGB, so sampling it decodes to linear. Without
     * converting back on the way out, the panel renders roughly a full gamma
     * too dark — a screen that is technically lit but looks switched off.
     * ShaderMaterial gets no automatic output conversion, so the chunk has to
     * be requested explicitly.
     */
    #include <colorspace_fragment>
  }
`;

/** Solid module that travels out through the glass. */
function EmergingModule() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const e = frame.emerge;

    // Travels from behind the screen plane to well in front of it, so the
    // crossing is real rather than a fade beside the glass.
    const z = THREE.MathUtils.lerp(-0.55, 1.35, e);
    mesh.position.set(0, 0, z);

    // Settles to full size as it clears — restrained, no overshoot bounce.
    const s = THREE.MathUtils.lerp(0.32, 1.0, THREE.MathUtils.smoothstep(e, 0.15, 0.85));
    mesh.scale.setScalar(s);

    // A slow presentation turn once it is outside.
    mesh.rotation.y = (1 - e) * -0.5 + e * 0.22;

    // Hidden entirely at rest — nothing hovers inside the screen when idle.
    const visible = e > 0.01;
    mesh.visible = visible;
    mat.opacity = THREE.MathUtils.smoothstep(e, 0.02, 0.3);
    mat.emissiveIntensity = 0.5 + e * 1.4;
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <boxGeometry args={[1.15, 0.72, 0.14]} />
      <meshStandardMaterial
        ref={matRef}
        color="#454a52"
        metalness={0.62}
        roughness={0.32}
        emissive="#ff8c00"
        emissiveIntensity={0}
        transparent
        opacity={0}
      />
    </mesh>
  );
}

/** Particles thrown off the glass while it is being broken through. */
function EscapeParticles({ count = 220 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const { geometry, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const s = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Seeded across the aperture, biased toward the exit point.
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6);
      s[i * 3] = Math.cos(a) * r;
      s[i * 3 + 1] = Math.sin(a) * r;
      s[i * 3 + 2] = 0.3 + Math.random() * 0.7;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6);
    return { geometry: g, seeds: s };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const pts = pointsRef.current;
    const mat = matRef.current;
    if (!pts || !mat) return;

    const e = frame.emerge;
    // Only exists during the crossing — peaks mid-break, gone once settled.
    const crossing = Math.sin(THREE.MathUtils.clamp(e, 0, 1) * Math.PI);
    pts.visible = crossing > 0.02;
    mat.opacity = crossing * 0.85;
    if (!pts.visible) return;

    const arr = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const spread = 0.25 + crossing * 1.1;
      arr[i3] = seeds[i3] * MONITOR_SCREEN_W * 0.42 * spread;
      arr[i3 + 1] = seeds[i3 + 1] * MONITOR_SCREEN_H * 0.42 * spread;
      // Blown outward along the screen normal as the surface gives way.
      arr[i3 + 2] = seeds[i3 + 2] * crossing * 1.6;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false} visible={false}>
      <pointsMaterial
        ref={matRef}
        color="#00e5ff"
        size={0.045}
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

export function Monitor() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const activeProject = useMachine((s) => s.activeProject);
  const projectEmerged = useMachine((s) => s.projectEmerged);

  /* ---- The OS desktop, drawn to a canvas and uploaded once per change ---- */
  const { texture, canvas } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = OS_CANVAS_W;
    c.height = OS_CANVAS_H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return { texture: t, canvas: c };
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  // Redraws only when the content genuinely changes — never per frame.
  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawOsScreen(ctx, {
      activeProject,
      emerged: projectEmerged,
      projects: projects.map((p) => ({
        slot: p.slot,
        title: p.title,
        stack: p.stack.slice(0, 3).join(' · '),
      })),
    });
    texture.needsUpdate = true;
  }, [canvas, texture, activeProject, projectEmerged]);

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uPower: { value: 0 },
      uTime: { value: 0 },
      uEmerge: { value: 0 },
      uExit: { value: EXIT_UV },
      uCyan: { value: new THREE.Color('#00e5ff') },
    }),
    [texture],
  );

  useFrame((_, dt) => {
    // Through the material's own uniforms object — R3F may swap the one
    // passed as a prop during reconciliation, and writing to the stale copy
    // silently leaves every uniform at its initial value.
    const u = materialRef.current?.uniforms;
    if (!u) return;

    const [start, end] = POWER_WINDOW.monitor;
    u.uPower.value = THREE.MathUtils.smoothstep(frame.power, start, end);
    u.uTime.value += Math.min(dt, 0.05);
    u.uEmerge.value = frame.emerge;
  });

  return (
    <group position={MONITOR_POS} rotation={[0, MONITOR_ROT_Y, 0]}>
      <mesh>
        {/* Subdivided enough for the bulge to read as a smooth dome rather
            than a faceted tent. */}
        <planeGeometry args={[MONITOR_SCREEN_W, MONITOR_SCREEN_H, 64, 40]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={screenVertex}
          fragmentShader={screenFragment}
          uniforms={uniforms}
        />
      </mesh>

      <EmergingModule />
      <EscapeParticles />
    </group>
  );
}
