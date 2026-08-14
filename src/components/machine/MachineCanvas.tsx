'use client';

import { Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useMachine, useQualityProfile } from '@/store/machine';
import { Scene } from './Scene';

/**
 * If WebGL dies mid-session — a lost context, a driver fault, a shader that
 * will not compile on some GPU — the site must keep working. This boundary
 * drops the canvas and lets the DOM layer stand on its own, which it is built
 * to do (§21).
 */
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    // Surfaced for diagnosis; the visitor sees the DOM experience regardless.
    console.error('[machine] 3D layer failed, continuing without it:', error);
    useMachine.getState().setWebglFailed(true);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/** Post-processing, gated by quality tier. Two passes maximum (§23). */
function Effects() {
  const profile = useQualityProfile();
  if (!profile.bloom) return null;

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      {/* Controlled bloom: high threshold so only genuinely emissive surfaces
          glow, and the metal keeps its shape instead of washing out. Intensity
          nudged up from the original 0.72 — with the lattice transformation
          back in the scene, the brighter glow is what makes its structured
          state read as luminous rather than merely lit. */}
      <Bloom intensity={0.85} luminanceThreshold={0.42} luminanceSmoothing={0.28} mipmapBlur radius={0.52} />
      <Vignette offset={0.28} darkness={0.62} eskil={false} />
    </EffectComposer>
  );
}

export default function MachineCanvas() {
  const profile = useQualityProfile();
  const webglFailed = useMachine((s) => s.webglFailed);

  if (webglFailed) return null;

  return (
    <CanvasBoundary>
      <Canvas
        className="no-print"
        dpr={profile.dpr}
        gl={{
          antialias: false, // bloom + additive particles hide aliasing; MSAA is not worth the fill cost
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0.15, 4.6], fov: 34, near: 0.1, far: 400 }}
        // The canvas is pure decoration for assistive tech — every fact it
        // shows also exists in the DOM layer above it.
        aria-hidden="true"
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault();
              useMachine.getState().setWebglFailed(true);
            },
            { once: true },
          );
        }}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <Suspense fallback={null}>
          <Scene />
          <Effects />
        </Suspense>
      </Canvas>
    </CanvasBoundary>
  );
}
