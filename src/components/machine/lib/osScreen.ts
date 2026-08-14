/**
 * BAKUL OS — the desktop drawn onto the monitor's screen.
 *
 * Rendered to a 2D canvas and uploaded as a texture rather than drawn in
 * GLSL: the screen is mostly *text*, and text is the one thing a fragment
 * shader is genuinely bad at. A canvas gives real font rendering at a
 * readable resolution for the cost of a single texture upload, and it only
 * redraws when the content actually changes — never per frame.
 *
 * Everything on it is real: the window lists the same projects, in the same
 * order, as the DOM rack beside it.
 */

interface OsScreenState {
  /** Index of the highlighted project row. */
  activeProject: number;
  /** Row labels, in rack order. */
  projects: { slot: string; title: string; stack: string }[];
  /** Whether a project has been pushed out through the screen. */
  emerged: boolean;
}

/** Texture resolution. 16:10 to match the screen mesh's aspect. */
export const OS_CANVAS_W = 1024;
export const OS_CANVAS_H = 632;

const CARBON = '#090a0f';
const PANEL = '#12141b';
const LINE = '#262a33';
const ASH = '#828a9b';
const CERAMIC = '#f0f2f5';
const AMBER = '#ff8c00';
const CYAN = '#00e5ff';

const MONO = '600 21px "Fira Code", ui-monospace, monospace';
const MONO_SM = '500 17px "Fira Code", ui-monospace, monospace';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Paints one frame of the desktop. Called only when state changes. */
export function drawOsScreen(ctx: CanvasRenderingContext2D, state: OsScreenState) {
  const W = OS_CANVAS_W;
  const H = OS_CANVAS_H;

  ctx.clearRect(0, 0, W, H);

  // --- Desktop background, with a faint amber wash from the machine ---
  ctx.fillStyle = CARBON;
  ctx.fillRect(0, 0, W, H);
  const wash = ctx.createRadialGradient(W * 0.75, H * 0.15, 0, W * 0.75, H * 0.15, W * 0.8);
  wash.addColorStop(0, 'rgba(255,140,0,0.10)');
  wash.addColorStop(1, 'rgba(255,140,0,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // --- Menu bar ---
  ctx.fillStyle = 'rgba(18,20,27,0.92)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = LINE;
  ctx.fillRect(0, 45, W, 1);

  ctx.font = MONO;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = AMBER;
  ctx.fillText('BAKUL OS', 26, 24);
  ctx.fillStyle = ASH;
  ctx.font = MONO_SM;
  ctx.fillText('project-bay', 172, 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = state.emerged ? CYAN : ASH;
  ctx.fillText(state.emerged ? 'PORTAL OPEN' : 'READY', W - 26, 24);
  ctx.textAlign = 'left';

  // --- Window chrome ---
  const wx = 44;
  const wy = 88;
  const ww = W - 88;
  const wh = H - 152;

  ctx.fillStyle = PANEL;
  roundRect(ctx, wx, wy, ww, wh, 12);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title bar + traffic lights
  ctx.fillStyle = 'rgba(38,42,51,0.6)';
  roundRect(ctx, wx, wy, ww, 46, 12);
  ctx.fill();
  ctx.fillStyle = LINE;
  ctx.fillRect(wx, wy + 45, ww, 1);

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(wx + 26 + i * 24, wy + 23, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = ['#3a3f4a', '#3a3f4a', '#3a3f4a'][i];
    ctx.fill();
  }
  ctx.font = MONO_SM;
  ctx.fillStyle = ASH;
  ctx.fillText('~/projects', wx + 118, wy + 23);

  // --- Project rows ---
  const rowH = 74;
  const listTop = wy + 62;

  state.projects.forEach((p, i) => {
    const y = listTop + i * rowH;
    const isActive = i === state.activeProject;

    if (isActive) {
      ctx.fillStyle = 'rgba(255,140,0,0.12)';
      roundRect(ctx, wx + 14, y, ww - 28, rowH - 10, 8);
      ctx.fill();
      ctx.fillStyle = AMBER;
      ctx.fillRect(wx + 14, y, 3, rowH - 10);
    }

    ctx.font = MONO_SM;
    ctx.fillStyle = isActive ? AMBER : '#4a5060';
    ctx.fillText(p.slot, wx + 36, y + 22);

    ctx.font = MONO;
    ctx.fillStyle = isActive ? CERAMIC : ASH;
    ctx.fillText(p.title, wx + 82, y + 22);

    ctx.font = MONO_SM;
    ctx.fillStyle = isActive ? ASH : '#4a5060';
    ctx.fillText(p.stack, wx + 82, y + 48);

    if (isActive) {
      ctx.textAlign = 'right';
      ctx.fillStyle = state.emerged ? CYAN : AMBER;
      ctx.fillText(state.emerged ? 'PROJECTED' : 'OPEN', wx + ww - 34, y + 34);
      ctx.textAlign = 'left';
    }
  });

  // --- Status line ---
  ctx.font = MONO_SM;
  ctx.fillStyle = '#4a5060';
  ctx.fillText(
    state.emerged
      ? '> render target: external — object is outside the display'
      : '> select a bay to project it into the machine',
    wx + 4,
    H - 44,
  );
}
