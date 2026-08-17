'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, useMachine, useQualityProfile } from '@/store/machine';
import { audio } from '@/lib/audio/engine';
import { CameraRig } from './CameraRig';
import { Chassis } from './parts/Chassis';
import { Turbines } from './parts/Turbines';
import { BusTraffic } from './parts/BusTraffic';
import { Starfield } from './parts/Starfield';
import { CircuitPanel } from './parts/CircuitPanel';
import { MorphField } from './parts/MorphField';
import { Monitor } from './parts/Monitor';
import { BOOT_STAGES } from './lib/blueprint';
import { timeline } from '@/lib/data/sections';

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

      // A relay clicks as each subsystem comes online. Read from BOOT_STAGES —
      // the same list the POST screen prints its rows from and the same
      // POWER_WINDOW starts the 3D subsystems illuminate at — so the sound,
      // the light, and the "OK" all land on one frame instead of a beat
      // apart. Copies of these numbers in three files is precisely how a boot
      // drifts out of sync.
      //
      // Thresholds are tracked as crossed regardless of whether sound is on —
      // only the playback is gated. If tracking were gated too, a visitor who
      // boots muted and then enables sound partway through (or after boot
      // finishes) would hear every threshold they'd already silently crossed
      // fire at once, a burst of clicks with nothing on screen to match them.
      for (const stage of BOOT_STAGES) {
        if (frame.power >= stage.at && !relayFired.current.has(stage.at)) {
          relayFired.current.add(stage.at);
          if (audioEnabled && !reducedMotion) audio.play('tick');
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
    const morphBefore = frame.morph;
    frame.morph = THREE.MathUtils.smoothstep(frame.t, timeline.morphStart, timeline.morphEnd);

    // The transformation is the site's signature moment, so it gets its own
    // voice — a long filter sweep that runs alongside the machine coming
    // apart. Fired once, on the way in only: scrolling back up should not
    // retrigger a two-and-a-half-second sweep, and scrubbing across the
    // threshold would otherwise stack them.
    if (audioEnabled && !reducedMotion && morphBefore < 0.02 && frame.morph >= 0.02) {
      audio.play('morph');
    }

    /* ---- Activation pulse decay ---- */
    if (frame.pulse > 0) {
      frame.pulse = Math.max(0, frame.pulse - clamped * 0.85);
    }

    /* ---- Project emergence ---- */
    // Eased toward its target rather than snapped, so the glass stretches and
    // relaxes at a physical rate. Reduced motion jumps straight to the end
    // state: the project is still shown outside the screen, it just doesn't
    // travel there — the information is identical either way.
    const wantEmerge = useMachine.getState().projectEmerged ? 1 : 0;
    if (reducedMotion) {
      frame.emerge = wantEmerge;
    } else {
      // Out faster than back: breaking through should feel like it has force
      // behind it, returning like it is being drawn back in.
      const rate = wantEmerge > frame.emerge ? 1.55 : 1.1;
      frame.emerge += (wantEmerge - frame.emerge) * (1 - Math.exp(-rate * clamped * 3));
      if (Math.abs(wantEmerge - frame.emerge) < 0.001) frame.emerge = wantEmerge;
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

    const clamped = Math.min(dt, 0.05);

    /*
     * The machine settles square while a project is coming out.
     *
     * The idle yaw is what makes the machine feel alive at rest, but the
     * monitor rides on this same group — so with the yaw still running, the
     * camera's dolly toward the screen would be aiming at a target that has
     * rotated away by the time it arrives, and the close shot would land
     * off-axis. Damping the rotation back to zero as `emerge` rises makes the
     * shot deterministic, and reads as the machine deliberately squaring up
     * to present something rather than as the animation being switched off.
     */
    const settle = frame.emerge;
    if (settle > 0.001) {
      const k = 1 - Math.exp(-3.2 * clamped * (0.4 + settle));
      // Shortest way home, so a machine sitting just past a full turn
      // unwinds a few degrees instead of spinning all the way back.
      const wrapped = Math.atan2(Math.sin(g.rotation.y), Math.cos(g.rotation.y));
      g.rotation.y = wrapped + (0 - wrapped) * k * settle;
    } else {
      // Slow idle yaw — an idling machine, not a turntable.
      g.rotation.y += clamped * 0.03 * (0.35 + frame.velocity * 1.6);
    }

    // Pointer tilt, heavily damped, and eased out while presenting.
    const targetTilt = -frame.pointer.y * 0.07 * (1 - settle);
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

    /*
     * Narrative tone, shared with the DOM.
     *
     * `frame.tone` runs 0 (mechanical) to 1 (computational) and is the same
     * number the section wash behind the copy is tinted from. Cross-fading
     * the warm key against the cool rim on it means the machine is lit amber
     * while the page is talking about hardware and turns cyan as it turns to
     * outcomes — so the background is reporting the page's state rather than
     * running its own independent light show.
     *
     * Applied as a rebalance, not a switch: the key never goes fully dark, or
     * the metal would lose its form entirely on the later sections.
     */
    const tone = frame.tone;
    const warm = 1 - tone * 0.62;
    const cool = 1 + tone * 0.85;

    // Key light belongs to the mechanical half; it fades as the machine
    // becomes structured and the particles become self-illuminating.
    if (keyRef.current) keyRef.current.intensity = p * mechanical * 252 * gain * warm;
    if (fillRef.current) fillRef.current.intensity = p * mechanical * 58 * gain * warm;
    if (rimRef.current) rimRef.current.intensity = p * (0.35 + frame.morph * 0.68) * 96 * gain * cool;

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
        <BusTraffic />
        <Monitor />
        <MorphField profile={profile} />
      </MachineTransform>
    </>
  );
}
