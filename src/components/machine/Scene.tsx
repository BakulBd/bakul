'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine, useQualityProfile } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { CameraRig } from './CameraRig';
import { Chassis } from './parts/Chassis';
import { Turbines } from './parts/Turbines';
import { ConduitPulses } from './parts/ConduitPulses';
import { Starfield } from './parts/Starfield';
import { CircuitPanel } from './parts/CircuitPanel';
import { MorphField } from './parts/MorphField';
import { MORPH_START, MORPH_END } from '@/lib/data/sections';

/**
 * SYSTEM DRIVER
 *
 * Converts discrete state and raw scroll into the continuous values the scene
 * renders from. This is the single place where "what the visitor did" becomes
 * "what the machine does" — every part downstream just reads `frame`.
 */
function Driver() {
  const { gl } = useThree();
  const powerState = useMachine((s) => s.powerState);
  const completeActivation = useMachine((s) => s.completeActivation);
  const audioEnabled = useMachine((s) => s.audioEnabled);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  const fpsAccum = useRef({ frames: 0, last: performance.now() });
  const relayFired = useRef(new Set<number>());

  useFrame((_, dt) => {
    const clamped = Math.min(dt, 0.05);

    /* ---- Power ramp ---- */
    if (powerState === 'ACTIVATING' || powerState === 'ONLINE') {
      // Reduced motion still powers on — instantly, and without the sequence.
      const rate = reducedMotion ? 4 : 0.34;
      frame.power = Math.min(1, frame.power + clamped * rate);

      // Relay clicks as each subsystem comes online, keyed by the threshold
      // they cross so they track the visual boot exactly. These four values
      // are a literal subset of BOOT_LOG's own thresholds in BootSequence —
      // not just close to them — so the click and its matching log line
      // ("energising primary conduits", "vent actuators released",
      // "mechanical relays engaged", "project bay powered") print on the
      // exact same frame instead of a beat apart.
      //
      // Thresholds are tracked as crossed regardless of whether sound is on —
      // only the playback is gated. If tracking were gated too, a visitor who
      // boots muted and then enables sound partway through (or after boot
      // finishes) would hear every threshold they'd already silently crossed
      // fire at once, a burst of clicks with nothing on screen to match them.
      for (const threshold of [0.12, 0.34, 0.58, 0.82]) {
        if (frame.power >= threshold && !relayFired.current.has(threshold)) {
          relayFired.current.add(threshold);
          if (audioEnabled && !reducedMotion) audio.play('relay');
        }
      }

      if (frame.power >= 0.999 && powerState === 'ACTIVATING') {
        completeActivation();
      }
    }

    /* ---- Signature transformation ---- */
    // Mapped to the scroll span between the project rack and the assembly
    // line — a pure background flourish now, no dedicated section to justify
    // it narratively, but the same visual spectacle the machine always had.
    frame.morph = THREE.MathUtils.smoothstep(frame.t, MORPH_START, MORPH_END);

    /* ---- Activation pulse decay ---- */
    if (frame.pulse > 0) {
      frame.pulse = Math.max(0, frame.pulse - clamped * 0.85);
    }

    /* ---- Audio load ---- */
    if (audioEnabled) audio.setLoad(frame.velocity);

    /* ---- Telemetry (real values, read from the renderer) ---- */
    const acc = fpsAccum.current;
    acc.frames++;
    const now = performance.now();
    if (now - acc.last >= 500) {
      frame.fps = Math.round((acc.frames * 1000) / (now - acc.last));
      acc.frames = 0;
      acc.last = now;
      frame.drawCalls = gl.info.render.calls;
      frame.triangles = gl.info.render.triangles;
    }
  });

  return null;
}

/**
 * Shared transform for the machine and its particle field. Both live under
 * this group so that when the chassis dissolves, the particles it becomes are
 * already in the same frame of reference — no drift, no re-alignment.
 */
function MachineTransform({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const reducedMotion = useMachine((s) => s.reducedMotion);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (reducedMotion) return;

    // Slow idle yaw — an idling machine, not a turntable.
    g.rotation.y += Math.min(dt, 0.05) * 0.03 * (0.35 + frame.velocity * 1.6);

    // Pointer tilt, heavily damped.
    const targetTilt = -frame.pointer.y * 0.07;
    g.rotation.x += (targetTilt - g.rotation.x) * 0.028;
  });

  return <group ref={ref}>{children}</group>;
}

/** Lighting rig. Dark, directional, and driven by the power ramp. */
function Lights() {
  const keyRef = useRef<THREE.SpotLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const coreRef = useRef<THREE.PointLight>(null);
  const activeSubsystem = useMachine((s) => s.activeSubsystem);

  useFrame(() => {
    const p = frame.power;
    const mechanical = 1 - frame.morph;
    // The lab's LIGHT slider scales the whole rig, so the control visibly
    // changes the environment rather than one isolated lamp.
    const gain = useMachine.getState().lab.light;

    // Key light belongs to the mechanical half; it fades as the machine
    // becomes structured and the particles become self-illuminating.
    if (keyRef.current) keyRef.current.intensity = p * mechanical * 252 * gain;
    if (fillRef.current) fillRef.current.intensity = p * mechanical * 58 * gain;
    if (rimRef.current) rimRef.current.intensity = p * (0.35 + frame.morph * 0.68) * 96 * gain;

    if (coreRef.current) {
      // The core breathes — a slow processing rhythm, faster under load (§6).
      const breath = 0.72 + Math.sin(performance.now() * 0.0016) * 0.14;
      const focus = activeSubsystem ? 1.5 : 1;
      coreRef.current.intensity = p * mechanical * breath * focus * 15 * gain;
    }
  });

  return (
    <>
      {/*
        Hemisphere light replaces the environment map this scene deliberately
        does not load. Without some ambient gradient, metals have nothing to
        reflect and render nearly black regardless of how bright the key is.
      */}
      <hemisphereLight intensity={0.42} color="#6a7080" groundColor="#0d0f16" />
      <ambientLight intensity={0.16} color="#333944" />

      <spotLight
        ref={keyRef}
        position={[9, 16, 12]}
        angle={0.75}
        penumbra={0.85}
        intensity={0}
        color="#ffb163"
        distance={80}
        decay={2}
      />
      {/* Cool fill from the opposite side keeps the shadow side readable. */}
      <directionalLight ref={fillRef} position={[-10, 6, 8]} intensity={0} color="#9fb0c4" />
      <pointLight ref={rimRef} position={[-12, 4, -10]} intensity={0} color="#00e5ff" distance={70} decay={2} />
      <pointLight ref={coreRef} position={[0, 0.6, 0]} intensity={0} color="#ff8c00" distance={20} decay={2} />
    </>
  );
}

/**
 * Pointer tracking. Written straight into the frame singleton rather than React
 * state — this fires on every mouse move and must never trigger a re-render.
 */
function PointerTracker() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      frame.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      frame.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return null;
}

export function Scene() {
  const profile = useQualityProfile();
  const { gl } = useThree();

  // Renderer settings tuned once. Filmic tone mapping keeps the bloom from
  // clipping to white and preserves the metal's tonal range.
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl]);

  const fog = useMemo(() => new THREE.FogExp2('#090a0f', 0.019), []);

  return (
    <>
      <primitive object={fog} attach="fog" />
      <color attach="background" args={['#090a0f']} />

      <Driver />
      <PointerTracker />
      <CameraRig />
      <Lights />

      {/* Skipped on the lowest tier — the draw call is cheap, but that tier
          exists specifically for devices where every call counts. */}
      {profile.particles >= 4000 && (
        <Starfield count={profile.particles >= 10000 ? 900 : 450} />
      )}

      <CircuitPanel />

      <MachineTransform>
        <Chassis />
        <Turbines />
        <ConduitPulses />
        <MorphField profile={profile} />
      </MachineTransform>
    </>
  );
}
