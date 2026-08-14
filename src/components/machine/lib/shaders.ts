/**
 * GLSL for the signature transformation.
 *
 * MECHANICAL → SCATTERED → STRUCTURED
 *
 * One draw call does the whole thing. Each particle carries three positions —
 * its point on the machine surface, a scatter position, and its slot in the
 * lattice — and a single `uMorph` uniform drives the journey between them.
 * No CPU-side per-particle work, no geometry swap, no re-upload.
 */

export const morphVertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 posMachine;   // sampled from the real machine surface
  attribute vec3 posScatter;   // intermediate: pushed along the surface normal
  attribute vec3 posNeural;    // final: a node in the lattice
  attribute float aSeed;       // per-particle randomness, [0,1)
  attribute float aScale;      // per-particle size variation

  uniform float uMorph;        // 0 = machine, 1 = lattice
  uniform float uTime;
  uniform float uPower;        // boot ramp — nothing is visible before this
  uniform float uVelocity;     // scroll energy
  uniform float uSize;
  uniform vec2  uPointer;
  uniform float uPulse;        // click-triggered activation wave
  uniform float uGravity;
  uniform float uSpeed;
  uniform float uPixelRatio;

  varying float vMix;
  varying float vEnergy;
  varying float vSeed;

  // Cheap hash-based value noise. Enough character without a texture fetch.
  vec3 hash3(float n) {
    return fract(sin(vec3(n, n + 1.0, n + 2.0)) * vec3(43758.5453, 22578.1459, 19642.3490));
  }

  void main() {
    vSeed = aSeed;
    float t = uTime * uSpeed;

    // --- Staggered two-stage morph -------------------------------
    // Particles release in waves rather than together, so the machine appears
    // to come apart progressively — components unlocking, then separating.
    float delay = aSeed * 0.3;
    float sep   = clamp((smoothstep(0.0, 0.55, uMorph) - delay) / (1.0 - delay), 0.0, 1.0);
    float form  = clamp((smoothstep(0.42, 1.0, uMorph) - delay) / (1.0 - delay), 0.0, 1.0);

    // Ease so separation feels mechanical (slow release, fast break)
    sep = sep * sep * (3.0 - 2.0 * sep);
    form = form * form * (3.0 - 2.0 * form);

    vec3 pos = mix(posMachine, posScatter, sep);
    pos = mix(pos, posNeural, form);

    // --- Idle behaviour -------------------------------------------
    vec3 rnd = hash3(aSeed * 137.0);

    // While mechanical: a tight vibration that scales with scroll energy.
    float mech = 1.0 - sep;
    float vib = (0.004 + uVelocity * 0.02) * mech;
    pos += (rnd - 0.5) * vib * sin(t * 9.0 + aSeed * 30.0);

    // While scattered: drifting, weightless — the transitional middle state.
    float mid = sep * (1.0 - form);
    pos.x += sin(t * 0.5 + aSeed * 22.0) * 0.42 * mid;
    pos.y += cos(t * 0.42 + aSeed * 17.0) * 0.42 * mid;
    pos.z += sin(t * 0.34 + aSeed * 11.0) * 0.30 * mid;
    pos.y -= (uGravity - 1.0) * mid * 1.6;

    // While structured: a slow breathing pulse through the lattice.
    float neural = form;
    float wave = sin(t * 1.7 - pos.z * 0.85 + aSeed * 5.0);
    pos += normalize(pos + vec3(0.0001)) * wave * 0.05 * neural;

    // --- Pointer influence ----------------------------------------
    // Only in the structured state, where the visitor is invited to interact.
    vec3 pointerWorld = vec3(uPointer * 7.0, 0.0);
    float pd = distance(pos.xy, pointerWorld.xy);
    float attract = exp(-pd * pd * 0.06) * neural;
    pos.xy += normalize(pointerWorld.xy - pos.xy + vec3(0.0001).xy) * attract * 0.55;

    // --- Activation wave -------------------------------------------
    // Expanding shell triggered by a click; displaces particles as it passes.
    float radius = uPulse * 16.0;
    float shell = 1.0 - smoothstep(0.0, 2.6, abs(length(pos) - radius));
    float pulseAmt = shell * (1.0 - uPulse) * neural;
    pos += normalize(pos + vec3(0.0001)) * pulseAmt * 0.85;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Perspective-correct point size, calibrated against the camera stations.
    // Clamped so near particles cannot blow out into full-screen quads.
    float size = aScale * uSize * uPixelRatio * (1.0 + attract * 1.6 + pulseAmt * 2.0);
    gl_PointSize = clamp(size * (110.0 / -mv.z), 1.0, 46.0);

    vMix = form;

    // Base energy is high enough to compete with a dark scene and bloom, but
    // the structured state is damped: particles cluster onto shared nodes
    // there, so identical per-particle energy stacks additively and blows the
    // lattice out to white. Damping by the morph factor keeps node cores
    // defined.
    float density = mix(1.0, 0.30, form);
    vEnergy = uPower * density * (1.1 + uVelocity * 0.55 + attract * 0.95 + pulseAmt * 1.35);

    // Sparse flicker so the lattice never looks frozen even with no pointer
    // input. Re-rolled roughly twice a second per particle via a coarse time
    // bucket, so each spike reads as a discrete event rather than a smooth
    // pulse.
    float fireBucket = floor(t * 2.0 + aSeed * 97.0);
    float fireRoll = fract(sin(fireBucket * 12.9898 + aSeed * 78.233) * 43758.5453);
    float firing = step(0.982, fireRoll) * neural;
    vEnergy += firing * 2.6;
  }
`;

export const morphFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uPower;
  uniform vec3 uAmber;
  uniform vec3 uCyan;

  varying float vMix;
  varying float vEnergy;
  varying float vSeed;

  void main() {
    // Round soft point. Discarding early beats blending a transparent quad.
    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;

    float falloff = 1.0 - smoothstep(0.0, 0.25, d);
    float core = 1.0 - smoothstep(0.0, 0.05, d);

    // Amber (mechanical / power) → cyan (structured). The colour shift IS the
    // narrative, so it tracks the morph exactly.
    vec3 color = mix(uAmber, uCyan, clamp(vMix, 0.0, 1.0));
    color += core * 0.6;

    // Slight per-particle brightness variance keeps the field from reading flat.
    float variance = 0.72 + vSeed * 0.5;

    float alpha = falloff * clamp(vEnergy, 0.0, 1.6) * variance * uPower;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Lattice link lines. Signal travels along each connection as a travelling
 * bright band, so the network reads as firing rather than merely wired.
 */
export const linkVertexShader = /* glsl */ `
  precision highp float;
  attribute float aT;        // 0 at source node, 1 at target node
  attribute float aLinkSeed;
  varying float vT;
  varying float vSeed;
  void main() {
    vT = aT;
    vSeed = aLinkSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const linkFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uReveal;
  uniform float uPulse;
  uniform vec3  uCyan;
  varying float vT;
  varying float vSeed;

  void main() {
    // Travelling activation band along the connection.
    float head = fract(uTime * 0.34 + vSeed);
    float band = 1.0 - smoothstep(0.0, 0.22, abs(fract(vT - head + 1.0) - 0.0));
    float signal = max(band, 1.0 - smoothstep(0.0, 0.4, abs(vT - head)));

    float base = 0.06;
    float alpha = (base + signal * 0.55 + uPulse * 0.3) * uReveal;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(uCyan, alpha);
  }
`;

/**
 * Soft radial glow billboard. Shared by the conduit power-flow pulses and the
 * turbine engine-glow discs — both are "a bright core that falls off toward
 * the edge," just at different positions, colours, and intensities, so one
 * cheap shader covers both rather than writing it twice.
 */
export const glowVertexShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float falloff = pow(clamp(1.0 - d, 0.0, 1.0), 2.4);
    float alpha = falloff * uIntensity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
