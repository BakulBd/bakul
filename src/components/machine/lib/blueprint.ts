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

/**
 * Groups let sections light or hide parts of the machine independently — and
 * they are named after real mainboard hardware, because that is what this
 * machine now is.
 *
 * The scene used to be an abstract reactor: torus collars, radial ribs, and
 * conduits orbiting a core. It looked like something, but it did not mean
 * anything — least of all to the computer scientists this portfolio is for.
 * Every part is now a component someone reading this can name on sight, and
 * the boot order below is the order a real machine brings them up.
 */
export type Group =
  | 'board'
  | 'core'
  | 'memory'
  | 'bus'
  | 'gpu'
  | 'cooling'
  | 'storage'
  | 'monitor';

/**
 * Boot choreography (§3). Each subsystem illuminates inside its own window of
 * the power ramp, so the machine wakes in a readable order: power reaches the
 * core, travels the conduits, lights the chassis, spins up cooling, brings the
 * display up, then mounts the project rack. Shared by the chassis renderer,
 * the conduit power-flow pulses, the monitor's CRT warm-up, and the DOM POST
 * screen, so every layer reads the exact same boot timing.
 */
export const POWER_WINDOW: Record<Group, [number, number]> = {
  board: [0.0, 0.16],
  core: [0.08, 0.3],
  memory: [0.22, 0.44],
  bus: [0.34, 0.56],
  gpu: [0.46, 0.68],
  cooling: [0.56, 0.78],
  storage: [0.66, 0.88],
  // The display comes up last, exactly as it does on a real machine — POST
  // finishes against hardware that is already running.
  monitor: [0.78, 1.0],
};

/**
 * The boot sequence as an ordered list, derived from POWER_WINDOW rather than
 * restated.
 *
 * This is the single source every layer of the boot reads: the DOM POST
 * screen prints a line when a stage is crossed, the 3D subsystem starts
 * illuminating at that same value, and the relay click fires on that same
 * frame. Hand-written copies of these numbers in three files is exactly how
 * a boot ends up with the sound a beat ahead of the light and a log line
 * behind both.
 */
export const BOOT_STAGES: { group: Group; at: number }[] = (
  Object.keys(POWER_WINDOW) as Group[]
)
  .map((group) => ({ group, at: POWER_WINDOW[group][0] }))
  .sort((a, b) => a.at - b.at);

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/** Board deck. Everything else is mounted relative to this surface. */
const BOARD_Y = -0.65;
const BOARD_TOP = BOARD_Y + 0.07;
const BOARD_W = 15.5;
const BOARD_D = 11;

/**
 * Fan hub locations — CPU cooler, two on the graphics card, one case fan.
 * Exported because fans are the one part rendered outside the instanced
 * board: they spin about their own axis, which an instance matrix baked in
 * world space cannot express. The sampler still reads them from the
 * blueprint, so the spinning visuals and the particles that dissolve from
 * them stay describing the same object.
 */
export const TURBINE_PIVOTS: Vec3[] = [
  [0, 1.32, 0], // on top of the CPU heatsink
  [-2.6, -0.02, 3.4], // graphics card, intake
  [0.3, -0.02, 3.4], // graphics card, exhaust
  [-6.0, 0.05, -3.6], // case fan at the board edge
];

export const TURBINE_BLADES = 7;
export const TURBINE_BLADE_RADIUS = 0.55;

/** Memory: four DIMM slots in a bank beside the socket. */
export const MEMORY_SLOTS = 4;

/**
 * Modules are tagged so each one can be addressed on its own — the instanced
 * batch skips tagged shapes, so tagging is all it takes to hand a DIMM to the
 * component that lights it individually (see MemoryBank).
 */
export const dimmTag = (i: number): string => `dimm-${i}`;
const MEMORY_X0 = 3.1;
const MEMORY_PITCH = 0.44;
const MEMORY_Z = -0.4;

/**
 * Data bus routing.
 *
 * Real board traces run in right angles — Manhattan routing — because that is
 * what an autorouter and a fabrication process produce. Curved orbital rails
 * were the single strongest cue that the old scene was science fiction rather
 * than hardware, so these are strictly axis-aligned polylines from the socket
 * out to each subsystem.
 *
 * Exported as paths rather than baked straight into shapes so the packets
 * travelling them (see BusTraffic) follow the exact route the physical trace
 * occupies, instead of an approximation that drifts the moment either side is
 * retuned.
 */
const TRACE_Y = BOARD_TOP + 0.03;
export const BUS_TRACES: Vec3[][] = [
  // socket → memory bank
  [
    [1.6, TRACE_Y, 0.6],
    [2.5, TRACE_Y, 0.6],
    [2.5, TRACE_Y, -0.4],
    [3.0, TRACE_Y, -0.4],
  ],
  // socket → graphics card
  [
    [0.6, TRACE_Y, 1.6],
    [0.6, TRACE_Y, 2.6],
    [-1.2, TRACE_Y, 2.6],
    [-1.2, TRACE_Y, 3.2],
  ],
  // socket → storage bays
  [
    [1.6, TRACE_Y, -1.0],
    [5.0, TRACE_Y, -1.0],
    [5.0, TRACE_Y, -2.0],
    [6.4, TRACE_Y, -2.0],
  ],
  // socket → voltage regulators
  [
    [-1.6, TRACE_Y, -1.0],
    [-2.7, TRACE_Y, -1.0],
    [-2.7, TRACE_Y, -2.9],
  ],
  // regulators → power input at the board edge
  [
    [-2.7, TRACE_Y, -3.6],
    [-6.6, TRACE_Y, -3.6],
  ],
  // socket → display out
  [
    [1.6, TRACE_Y, 1.2],
    [3.6, TRACE_Y, 1.2],
    [3.6, TRACE_Y, 3.2],
  ],
];

/** Rack module bodies, tagged so a specific bay can be addressed individually. */
export const RACK_MODULE_COUNT = 3;
export const rackModuleTag = (i: number): string => `rack-module-${i}`;

/**
 * The monitor — the machine's display surface, and the portal a project
 * emerges through.
 *
 * Exported because three separate things must agree on exactly where it sits:
 * the bezel/stand shapes built into the blueprint below, the screen mesh in
 * Monitor.tsx, and the camera station that dollies in for the emergence. A
 * drifting copy of these numbers would put the camera slightly off-axis from
 * the screen, which reads immediately as "wrong" in a close shot.
 *
 * Placed on the machine's right-hand side, raised above the conduit ring and
 * angled toward the viewer. That side is deliberate: the reading column holds
 * the left of the viewport and the camera's composition offset pushes the
 * machine right, so this is the band that is actually visible on a wide
 * screen — and it sits between the core and the project rack, which is
 * exactly where the eye already is when a bay is opened. A monitor on the
 * far side would spend the whole emergence hidden behind the text.
 */
export const MONITOR_POS: Vec3 = [3.6, 2.3, 3.9];
export const MONITOR_ROT_Y = 0.42;
export const MONITOR_SCREEN_W = 3.0;
export const MONITOR_SCREEN_H = 1.85;

/** Monitor-local point → world space. Only a Y rotation is involved. */
function monitorToWorld(local: Vec3): Vec3 {
  const c = Math.cos(MONITOR_ROT_Y);
  const s = Math.sin(MONITOR_ROT_Y);
  return [
    local[0] * c + local[2] * s + MONITOR_POS[0],
    local[1] + MONITOR_POS[1],
    -local[0] * s + local[2] * c + MONITOR_POS[2],
  ];
}

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

  // --- The board itself --------------------------------------------
  shapes.push({ kind: 'box', pos: [0, BOARD_Y, 0], size: [BOARD_W, 0.14, BOARD_D], group: 'board' });

  // Stiffener rails around the perimeter, so the deck reads as a fabricated
  // board with an edge rather than a floating plane.
  const halfBW = BOARD_W / 2;
  const halfBD = BOARD_D / 2;
  shapes.push({ kind: 'box', pos: [0, BOARD_Y + 0.06, halfBD], size: [BOARD_W, 0.1, 0.16], group: 'board' });
  shapes.push({ kind: 'box', pos: [0, BOARD_Y + 0.06, -halfBD], size: [BOARD_W, 0.1, 0.16], group: 'board' });
  shapes.push({ kind: 'box', pos: [halfBW, BOARD_Y + 0.06, 0], size: [0.16, 0.1, BOARD_D], group: 'board' });
  shapes.push({ kind: 'box', pos: [-halfBW, BOARD_Y + 0.06, 0], size: [0.16, 0.1, BOARD_D], group: 'board' });

  // Mounting standoffs at the corners.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      shapes.push({
        kind: 'cyl',
        pos: [sx * (halfBW - 0.55), BOARD_Y + 0.12, sz * (halfBD - 0.55)],
        radius: 0.14,
        height: 0.16,
        group: 'board',
      });
    }
  }

  // Electrolytic capacitors clustered around the socket — the single most
  // recognisable "this is a mainboard" detail there is.
  const CAPS: [number, number][] = [
    [-1.9, 1.5], [-2.3, 0.9], [-1.9, -1.6], [-2.4, -2.2],
    [1.9, 1.9], [2.4, 1.3], [2.0, -1.9], [-0.6, 2.4], [0.9, 2.5],
  ];
  for (const [cx, cz] of CAPS) {
    shapes.push({
      kind: 'cyl',
      pos: [cx, BOARD_TOP + 0.21, cz],
      radius: 0.11,
      height: 0.42,
      group: 'board',
    });
  }

  // Voltage regulator heatsink, finned like the real thing.
  shapes.push({ kind: 'box', pos: [-2.7, BOARD_TOP + 0.2, -3.3], size: [2.3, 0.4, 0.62], group: 'board' });
  for (let i = 0; i < 7; i++) {
    shapes.push({
      kind: 'box',
      pos: [-3.65 + i * 0.32, BOARD_TOP + 0.5, -3.3],
      size: [0.1, 0.4, 0.58],
      group: 'board',
    });
  }

  // --- Memory: a bank of DIMMs standing in their slots --------------
  for (let i = 0; i < MEMORY_SLOTS; i++) {
    const x = MEMORY_X0 + i * MEMORY_PITCH;
    // Slot body.
    shapes.push({
      kind: 'box',
      pos: [x, BOARD_TOP + 0.09, MEMORY_Z],
      size: [0.3, 0.18, 3.5],
      group: 'memory',
    });
    // The module standing in it — tagged so it can light on its own.
    shapes.push({
      kind: 'box',
      pos: [x, BOARD_TOP + 0.95, MEMORY_Z],
      size: [0.13, 1.55, 3.25],
      group: 'memory',
      tag: dimmTag(i),
    });
  }

  // --- Data bus: right-angle traces across the board ----------------
  // Emitted as short segments along each polyline, so the physical trace and
  // the packets that travel it are describing the same route by construction.
  for (const path of BUS_TRACES) {
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, ay, az] = path[i];
      const [bx, , bz] = path[i + 1];
      const alongX = Math.abs(bx - ax) > Math.abs(bz - az);
      const length = alongX ? Math.abs(bx - ax) : Math.abs(bz - az);
      const steps = Math.max(1, Math.round(length / 0.34));
      for (let s = 0; s < steps; s++) {
        const k = (s + 0.5) / steps;
        shapes.push({
          kind: 'box',
          pos: [ax + (bx - ax) * k, ay, az + (bz - az) * k],
          size: alongX ? [0.26, 0.05, 0.08] : [0.08, 0.05, 0.26],
          group: 'bus',
        });
      }
    }
  }

  // --- Graphics card in its slot ------------------------------------
  shapes.push({ kind: 'box', pos: [-1.2, BOARD_TOP + 0.05, 3.4], size: [0.4, 0.16, 1.9], group: 'gpu' });
  shapes.push({ kind: 'box', pos: [-1.2, BOARD_TOP + 0.34, 3.4], size: [6.9, 0.14, 1.85], group: 'gpu' });
  // Shroud rails along the card's long edges.
  shapes.push({ kind: 'box', pos: [-1.2, BOARD_TOP + 0.5, 4.28], size: [6.9, 0.28, 0.1], group: 'gpu' });
  shapes.push({ kind: 'box', pos: [-1.2, BOARD_TOP + 0.5, 2.52], size: [6.9, 0.28, 0.1], group: 'gpu' });
  // I/O bracket at the card's end.
  shapes.push({ kind: 'box', pos: [2.35, BOARD_TOP + 0.55, 3.4], size: [0.12, 1.0, 1.9], group: 'gpu' });

  // --- Cooling fans --------------------------------------------------
  for (const p of TURBINE_PIVOTS) {
    shapes.push({ kind: 'torus', pos: p, radius: 0.92, tube: 0.11, rot: [HALF_PI, 0, 0], group: 'cooling' });
    shapes.push({ kind: 'cyl', pos: p, radius: 0.2, height: 0.3, group: 'cooling' });
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
        group: 'cooling',
      });
    }
  }

  // --- Monitor: bezel, back shell, and stand -----------------------
  // Built in monitor-local space and transformed, so the whole assembly
  // stays welded to MONITOR_POS/ROT no matter how those are retuned.
  {
    const halfW = MONITOR_SCREEN_W / 2;
    const halfH = MONITOR_SCREEN_H / 2;
    const bezel = 0.11;
    const rot: Vec3 = [0, MONITOR_ROT_Y, 0];

    // Frame: four thin slabs around the screen aperture.
    const frame: [Vec3, Vec3][] = [
      [[0, halfH + bezel / 2, 0], [MONITOR_SCREEN_W + bezel * 2, bezel, 0.14]],
      [[0, -halfH - bezel / 2, 0], [MONITOR_SCREEN_W + bezel * 2, bezel, 0.14]],
      [[-halfW - bezel / 2, 0, 0], [bezel, MONITOR_SCREEN_H, 0.14]],
      [[halfW + bezel / 2, 0, 0], [bezel, MONITOR_SCREEN_H, 0.14]],
    ];
    for (const [p, size] of frame) {
      shapes.push({ kind: 'box', pos: monitorToWorld(p), size, rot, group: 'monitor' });
    }

    // Back shell, set behind the screen plane.
    shapes.push({
      kind: 'box',
      pos: monitorToWorld([0, 0, -0.16]),
      size: [MONITOR_SCREEN_W * 0.94, MONITOR_SCREEN_H * 0.94, 0.2],
      rot,
      group: 'monitor',
    });

    // Neck and foot, dropping to the machine deck.
    shapes.push({
      kind: 'box',
      pos: monitorToWorld([0, -halfH - 0.55, -0.1]),
      size: [0.3, 1.0, 0.16],
      rot,
      group: 'monitor',
    });
    shapes.push({
      kind: 'box',
      pos: monitorToWorld([0, -halfH - 1.06, 0.05]),
      size: [1.5, 0.09, 0.85],
      rot,
      group: 'monitor',
    });
  }

  // --- Storage bays: one drive per project --------------------------
  // Mounted along the board's right edge so the camera can track down them
  // (§7). Bodies are tagged individually — the active bay (matching the DOM's
  // activeProject) is rendered separately from this shared batch so it can
  // glow and slide forward on its own, distinct from the others.
  const rackCentre = (RACK_MODULE_COUNT - 1) / 2;
  const bayY = BOARD_TOP + 0.42;
  for (let i = 0; i < RACK_MODULE_COUNT; i++) {
    const z = (i - rackCentre) * 1.55;
    shapes.push({
      kind: 'box',
      pos: [6.4, bayY, z],
      size: [1.5, 0.8, 1.28],
      group: 'storage',
      tag: rackModuleTag(i),
    });
    // Drive face plate, with its own activity strip.
    shapes.push({ kind: 'box', pos: [7.2, bayY, z], size: [0.08, 0.5, 0.9], group: 'storage' });
  }
  // Cage uprights, bracketing the full span with a small margin past the
  // outermost bay regardless of how many there are.
  const rackEnd = rackCentre * 1.55 + 1.1;
  shapes.push({ kind: 'box', pos: [6.4, bayY, rackEnd], size: [1.9, 1.3, 0.1], group: 'storage' });
  shapes.push({ kind: 'box', pos: [6.4, bayY, -rackEnd], size: [1.9, 1.3, 0.1], group: 'storage' });

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

const NEURAL_LAYERS = [24, 40, 40, 28, 12];

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
