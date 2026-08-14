/**
 * MACHINE BLUEPRINT
 *
 * A single declarative description of the machine's physical form.
 *
 * Both consumers read from this list:
 *   1. The renderer — instances a unit box / cylinder / torus per entry.
 *   2. The particle sampler — scatters points across those same surfaces.
 *
 * That shared source is what makes the signature transformation honest: when
 * the machine dissolves, the particles are genuinely sampled from the geometry
 * the visitor was just looking at, so the silhouette survives the scatter.
 */

export type Vec3 = [number, number, number];

/**
 * `tag` is an optional, narrower address than `group` — most shapes never
 * need one, but a few (the rack module bodies) need to be picked out
 * individually rather than only as part of their group's shared batch. It's
 * inert everywhere else: the sampler and the generic instanced renderer both
 * key on `kind`/`group` alone and simply ignore it.
 */
export type Shape =
  | { kind: 'box'; pos: Vec3; size: Vec3; rot?: Vec3; group: Group; tag?: string }
  | { kind: 'cyl'; pos: Vec3; radius: number; height: number; rot?: Vec3; group: Group; tag?: string }
  | { kind: 'torus'; pos: Vec3; radius: number; tube: number; rot?: Vec3; group: Group; tag?: string };

/** Groups let sections light or hide parts of the machine independently. */
export type Group = 'core' | 'chassis' | 'conduit' | 'turbine' | 'rack';

/**
 * Boot choreography (§3). Each subsystem illuminates inside its own window of
 * the power ramp, so the machine wakes in a readable order: power reaches the
 * core, travels the conduits, lights the chassis, spins up cooling, then
 * brings the project rack online. Shared by the chassis renderer and the
 * conduit power-flow pulses, so both read the exact same boot timing.
 */
export const POWER_WINDOW: Record<Group, [number, number]> = {
  core: [0.0, 0.22],
  conduit: [0.1, 0.42],
  chassis: [0.32, 0.62],
  turbine: [0.5, 0.78],
  rack: [0.66, 1.0],
};

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/**
 * Turbine hub locations. Exported because turbines are the one part rendered
 * outside the instanced chassis — they spin about their own axis, which an
 * instance matrix baked in world space cannot express. The sampler still reads
 * them from the blueprint, so the spinning visuals and the particles that
 * dissolve from them stay describing the same object.
 */
export const TURBINE_PIVOTS: Vec3[] = [
  [-4.6, -0.4, 3.4],
  [4.6, -0.4, -3.4],
];

export const TURBINE_BLADES = 7;
export const TURBINE_BLADE_RADIUS = 0.55;

/**
 * Conduit rail geometry. Exported so the power-flow pulses can travel the
 * exact path the physical rails occupy, rather than an approximation that
 * would drift out of alignment the moment either side changed independently.
 */
export const CONDUIT_RAILS = 4;
export const CONDUIT_INNER_R = 2.9;
export const CONDUIT_OUTER_R = 5.6;
export const CONDUIT_Y = -0.4;
export const conduitRailAngle = (i: number): number => (i / CONDUIT_RAILS) * TAU + Math.PI / 4;

/** Rack module bodies, tagged so a specific bay can be addressed individually. */
export const RACK_MODULE_COUNT = 3;
export const rackModuleTag = (i: number): string => `rack-module-${i}`;

/* ---------------------------------------------------------------- *
 * THE MACHINE
 * ---------------------------------------------------------------- */

function buildBlueprint(): Shape[] {
  const shapes: Shape[] = [];

  // --- Processor core: die on a substrate -------------------------
  shapes.push({ kind: 'box', pos: [0, 0, 0], size: [2.1, 0.44, 2.1], group: 'core' });
  shapes.push({ kind: 'box', pos: [0, -0.4, 0], size: [3.0, 0.26, 3.0], group: 'core' });

  // Heatsink fins — the strongest silhouette cue that this is a processor.
  const FINS = 11;
  for (let i = 0; i < FINS; i++) {
    const x = (i / (FINS - 1) - 0.5) * 1.9;
    shapes.push({ kind: 'box', pos: [x, 0.62, 0], size: [0.075, 0.78, 1.85], group: 'core' });
  }

  // --- Chassis collars --------------------------------------------
  shapes.push({ kind: 'torus', pos: [0, -0.4, 0], radius: 2.85, tube: 0.075, rot: [HALF_PI, 0, 0], group: 'chassis' });
  shapes.push({ kind: 'torus', pos: [0, -0.4, 0], radius: 4.1, tube: 0.05, rot: [HALF_PI, 0, 0], group: 'chassis' });

  // Structural ribs radiating from the core.
  const RIBS = 8;
  for (let i = 0; i < RIBS; i++) {
    const a = (i / RIBS) * TAU;
    const r = 3.5;
    shapes.push({
      kind: 'box',
      pos: [Math.cos(a) * r, -0.42, Math.sin(a) * r],
      size: [1.3, 0.12, 0.22],
      rot: [0, -a, 0],
      group: 'chassis',
    });
  }

  // --- Power conduits: four rails feeding the core ----------------
  for (let i = 0; i < CONDUIT_RAILS; i++) {
    const a = conduitRailAngle(i);
    for (let s = 0; s < 7; s++) {
      const r = CONDUIT_INNER_R + (s / 6) * (CONDUIT_OUTER_R - CONDUIT_INNER_R);
      shapes.push({
        kind: 'box',
        pos: [Math.cos(a) * r, CONDUIT_Y, Math.sin(a) * r],
        size: [0.34, 0.09, 0.09],
        rot: [0, -a, 0],
        group: 'conduit',
      });
    }
  }

  // --- Cooling turbines -------------------------------------------
  for (const p of TURBINE_PIVOTS) {
    shapes.push({ kind: 'torus', pos: p, radius: 0.92, tube: 0.11, rot: [HALF_PI, 0, 0], group: 'turbine' });
    shapes.push({ kind: 'cyl', pos: p, radius: 0.2, height: 0.3, group: 'turbine' });
    for (let b = 0; b < TURBINE_BLADES; b++) {
      const a = (b / TURBINE_BLADES) * TAU;
      shapes.push({
        kind: 'box',
        pos: [
          p[0] + Math.cos(a) * TURBINE_BLADE_RADIUS,
          p[1],
          p[2] + Math.sin(a) * TURBINE_BLADE_RADIUS,
        ],
        size: [0.62, 0.035, 0.19],
        rot: [0, -a, 0.34],
        group: 'turbine',
      });
    }
  }

  // --- Project rack: modules in a bay ------------------------------
  // Placed to one side so the camera can track along it (§7). Module bodies
  // are tagged individually — the active bay (matching the DOM's
  // activeProject) is rendered separately from this shared batch so it can
  // glow and slide forward on its own, distinct from the other bays.
  const rackCentre = (RACK_MODULE_COUNT - 1) / 2;
  for (let i = 0; i < RACK_MODULE_COUNT; i++) {
    const z = (i - rackCentre) * 1.55;
    shapes.push({
      kind: 'box',
      pos: [6.4, 0.1, z],
      size: [1.5, 0.95, 1.28],
      group: 'rack',
      tag: rackModuleTag(i),
    });
    shapes.push({ kind: 'box', pos: [7.2, 0.1, z], size: [0.08, 0.62, 0.9], group: 'rack' });
  }
  // Rack frame uprights, bracketing the full span with a small margin past
  // the outermost module regardless of how many bays there are.
  const rackEnd = rackCentre * 1.55 + 1.1;
  shapes.push({ kind: 'box', pos: [6.4, 0.1, rackEnd], size: [1.9, 1.5, 0.1], group: 'rack' });
  shapes.push({ kind: 'box', pos: [6.4, 0.1, -rackEnd], size: [1.9, 1.5, 0.1], group: 'rack' });

  return shapes;
}

export const blueprint: Shape[] = buildBlueprint();

/* ---------------------------------------------------------------- *
 * SURFACE SAMPLING
 *
 * Analytic per-primitive sampling. Chosen over MeshSurfaceSampler because it
 * needs no merged BufferGeometry, allocates nothing beyond the output array,
 * and gives us the surface normal for free — which the morph shader uses to
 * push particles outward along the machine's own surface as it separates.
 * ---------------------------------------------------------------- */

/** Rotate v in place by intrinsic XYZ euler angles. */
function applyEuler(v: Vec3, rot: Vec3): Vec3 {
  const [rx, ry, rz] = rot;
  let [x, y, z] = v;

  let c = Math.cos(rx), s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  // Y
  c = Math.cos(ry); s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  // Z
  c = Math.cos(rz); s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];

  return [x, y, z];
}

function shapeArea(sh: Shape): number {
  switch (sh.kind) {
    case 'box': {
      const [w, h, d] = sh.size;
      return 2 * (w * h + w * d + h * d);
    }
    case 'cyl':
      return TAU * sh.radius * sh.height + TAU * sh.radius * sh.radius;
    case 'torus':
      return TAU * sh.radius * TAU * sh.tube;
  }
}

/** One uniform surface point + outward normal, both in world space. */
function sampleShape(sh: Shape): { p: Vec3; n: Vec3 } {
  let local: Vec3;
  let normal: Vec3;

  if (sh.kind === 'box') {
    const [w, h, d] = sh.size;
    const areas = [h * d, h * d, w * d, w * d, w * h, w * h];
    const total = areas.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let face = 0;
    while (face < 5 && r > areas[face]) r -= areas[face++];

    const u = Math.random() - 0.5;
    const v = Math.random() - 0.5;
    switch (face) {
      case 0: local = [w / 2, u * h, v * d]; normal = [1, 0, 0]; break;
      case 1: local = [-w / 2, u * h, v * d]; normal = [-1, 0, 0]; break;
      case 2: local = [u * w, h / 2, v * d]; normal = [0, 1, 0]; break;
      case 3: local = [u * w, -h / 2, v * d]; normal = [0, -1, 0]; break;
      case 4: local = [u * w, v * h, d / 2]; normal = [0, 0, 1]; break;
      default: local = [u * w, v * h, -d / 2]; normal = [0, 0, -1]; break;
    }
  } else if (sh.kind === 'cyl') {
    const a = Math.random() * TAU;
    const ca = Math.cos(a), sa = Math.sin(a);
    if (Math.random() < 0.82) {
      local = [ca * sh.radius, (Math.random() - 0.5) * sh.height, sa * sh.radius];
      normal = [ca, 0, sa];
    } else {
      const cap = Math.random() < 0.5 ? 1 : -1;
      const rr = Math.sqrt(Math.random()) * sh.radius;
      local = [ca * rr, (cap * sh.height) / 2, sa * rr];
      normal = [0, cap, 0];
    }
  } else {
    const u = Math.random() * TAU;
    const v = Math.random() * TAU;
    const cu = Math.cos(u), su = Math.sin(u);
    const cv = Math.cos(v), sv = Math.sin(v);
    local = [(sh.radius + sh.tube * cv) * cu, (sh.radius + sh.tube * cv) * su, sh.tube * sv];
    normal = [cv * cu, cv * su, sv];
  }

  if (sh.rot) {
    local = applyEuler(local, sh.rot);
    normal = applyEuler(normal, sh.rot);
  }

  return {
    p: [local[0] + sh.pos[0], local[1] + sh.pos[1], local[2] + sh.pos[2]],
    n: normal,
  };
}

/**
 * Scatter `count` points across the whole machine, area-weighted so large
 * surfaces receive proportionally more particles.
 */
export function sampleMachineSurface(count: number): {
  positions: Float32Array;
  normals: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  const areas = blueprint.map(shapeArea);
  const cumulative: number[] = [];
  let running = 0;
  for (const a of areas) cumulative.push((running += a));
  const total = running;

  for (let i = 0; i < count; i++) {
    const target = Math.random() * total;
    // Binary search the cumulative area table.
    let lo = 0, hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const { p, n } = sampleShape(blueprint[lo]);
    positions[i * 3] = p[0];
    positions[i * 3 + 1] = p[1];
    positions[i * 3 + 2] = p[2];
    normals[i * 3] = n[0];
    normals[i * 3 + 1] = n[1];
    normals[i * 3 + 2] = n[2];
  }

  return { positions, normals };
}

/* ---------------------------------------------------------------- *
 * NEURAL LATTICE
 *
 * The end state of the transformation. A layered feed-forward topology —
 * NOT a galaxy. Layer sizes taper the way a real classifier does, so the
 * shape reads as a network rather than a cloud.
 * ---------------------------------------------------------------- */

export const NEURAL_LAYERS = [24, 40, 40, 28, 12];

export interface Lattice {
  /** Node centres, one xyz triple per node. */
  nodes: Float32Array;
  /** Which layer each node belongs to. */
  layerOf: Uint8Array;
  /** Per-layer index ranges into `nodes`. */
  ranges: { start: number; count: number }[];
}

export function buildLattice(): Lattice {
  const totalNodes = NEURAL_LAYERS.reduce((a, b) => a + b, 0);
  const nodes = new Float32Array(totalNodes * 3);
  const layerOf = new Uint8Array(totalNodes);
  const ranges: { start: number; count: number }[] = [];

  const SPACING = 2.6;
  let n = 0;

  NEURAL_LAYERS.forEach((size, li) => {
    ranges.push({ start: n, count: size });
    const z = (li - (NEURAL_LAYERS.length - 1) / 2) * SPACING;

    // Distribute each layer on a disc via a sunflower spiral — even coverage,
    // no clustering at the centre, and it reads as a deliberate plane.
    const golden = Math.PI * (3 - Math.sqrt(5));
    const radius = 1.5 + Math.sqrt(size) * 0.42;

    for (let i = 0; i < size; i++) {
      const t = Math.sqrt((i + 0.5) / size) * radius;
      const a = i * golden;
      nodes[n * 3] = Math.cos(a) * t;
      nodes[n * 3 + 1] = Math.sin(a) * t;
      nodes[n * 3 + 2] = z + (Math.random() - 0.5) * 0.22;
      layerOf[n] = li;
      n++;
    }
  });

  return { nodes, layerOf, ranges };
}

/**
 * Connections between adjacent layers, capped at `maxLinks` so the link count
 * scales with the quality tier instead of exploding combinatorially.
 */
export function buildLinks(lattice: Lattice, maxLinks: number): Float32Array {
  const pairs: [number, number][] = [];
  const { ranges } = lattice;

  for (let li = 0; li < ranges.length - 1; li++) {
    const a = ranges[li];
    const b = ranges[li + 1];
    for (let i = 0; i < a.count; i++) {
      for (let j = 0; j < b.count; j++) {
        pairs.push([a.start + i, b.start + j]);
      }
    }
  }

  // Deterministic stride keeps the sampled subset evenly spread across layers.
  const stride = Math.max(1, Math.ceil(pairs.length / maxLinks));
  const chosen: [number, number][] = [];
  for (let i = 0; i < pairs.length && chosen.length < maxLinks; i += stride) {
    chosen.push(pairs[i]);
  }

  const out = new Float32Array(chosen.length * 6);
  chosen.forEach(([ai, bi], k) => {
    out[k * 6] = lattice.nodes[ai * 3];
    out[k * 6 + 1] = lattice.nodes[ai * 3 + 1];
    out[k * 6 + 2] = lattice.nodes[ai * 3 + 2];
    out[k * 6 + 3] = lattice.nodes[bi * 3];
    out[k * 6 + 4] = lattice.nodes[bi * 3 + 1];
    out[k * 6 + 5] = lattice.nodes[bi * 3 + 2];
  });

  return out;
}

/** Assigns `count` particles onto lattice nodes, jittered into small clusters. */
export function sampleLattice(lattice: Lattice, count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const nodeCount = lattice.nodes.length / 3;

  for (let i = 0; i < count; i++) {
    const ni = i % nodeCount;

    // Jitter is scaled to the particles-per-node ratio. With a high particle
    // budget, hundreds land on each node; a tight jitter stacks them all in one
    // place and additive blending blows the node out to a white blob. Spreading
    // wider as density rises keeps nodes reading as discrete units at every
    // quality tier.
    const perNode = count / nodeCount;
    const j = Math.min(0.62, 0.16 + perNode * 0.0022);

    // Gaussian-ish falloff (sum of two uniforms) concentrates particles toward
    // the node centre, so the node still has a defined core.
    const g = () => (Math.random() + Math.random() - 1) * j;

    out[i * 3] = lattice.nodes[ni * 3] + g();
    out[i * 3 + 1] = lattice.nodes[ni * 3 + 1] + g();
    out[i * 3 + 2] = lattice.nodes[ni * 3 + 2] + g();
  }

  return out;
}
