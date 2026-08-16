'use client';

/**
 * PROCEDURAL AUDIO — no files, no downloads, one key.
 *
 * Every sound is synthesised from oscillators and shaped noise, so the whole
 * audio system costs zero network bytes. Muted by default; nothing is created
 * until the visitor explicitly enables sound, which also satisfies browser
 * autoplay policy since enabling is always a user gesture.
 *
 * ── Why this is built the way it is ──────────────────────────────────────
 *
 * 1. EVERYTHING IS IN ONE KEY. Every pitched voice draws from a single A minor
 *    pentatonic table (see `hz`). Arbitrary frequencies are what make synthesised
 *    interface audio sound like a smoke alarm: two sounds landing a semitone
 *    apart beat against each other, and the ambient drone fights every blip
 *    played over it. Constraining the whole site to one scale means any two
 *    sounds that overlap — by design or by accident — are consonant.
 *
 * 2. EVERYTHING GOES THROUGH ONE SPACE. A convolution reverb, built from a
 *    procedurally generated impulse response, glues the voices into a single
 *    room. Dry oscillators triggered straight at the output are the other half
 *    of why synth UI audio sounds cheap — real sounds arrive with a space
 *    around them.
 *
 * 3. NOTHING CAN CLIP. Voices are summed through per-role buses into a
 *    limiter. Without one, three overlapping events plus the pad exceed full
 *    scale and the browser hard-clips, which is heard as a crackle and reads
 *    as a broken page.
 *
 * 4. ENVELOPES, NOT GATES. Every voice has a real attack and decay. An
 *    oscillator switched on and off at full amplitude produces a click at both
 *    ends, because that is a step discontinuity in the waveform.
 *
 * 5. IT REPORTS STATE. The pad's filter, movement and voicing follow scroll
 *    energy and the active section. Audio here is an instrument reading, in the
 *    same way the visuals are — not a loop playing underneath them.
 */

/* ------------------------------------------------------------------ *
 * TUNING
 * ------------------------------------------------------------------ */

const A4 = 440;

/** A minor pentatonic — no semitone clashes are possible within it. */
const SCALE = [0, 3, 5, 7, 10];

/**
 * Scale degree → frequency. `degree` walks the scale and wraps into higher
 * octaves automatically, so `hz(7)` is two scale steps above the octave rather
 * than an arbitrary interval.
 */
function hz(degree: number, octave = 0): number {
  const len = SCALE.length;
  const oct = Math.floor(degree / len) + octave;
  const idx = ((degree % len) + len) % len;
  return A4 * Math.pow(2, (SCALE[idx] + oct * 12) / 12);
}

/** Detune in cents → frequency multiplier. */
const cents = (c: number) => Math.pow(2, c / 1200);

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ------------------------------------------------------------------ *
 * VOICES
 * ------------------------------------------------------------------ */

export type Voice =
  /** Boot: the machine coming up to voltage. */
  | 'power'
  /** One POST line resolving. Tiny. */
  | 'tick'
  /** Boot complete — the one genuinely musical moment. */
  | 'online'
  /** Pointer entering something interactive. A whisper. */
  | 'hover'
  /** Any click. The surface sound of a control being pressed. */
  | 'press'
  /** A mechanism responding: a bay locking in, a subsystem engaging. */
  | 'lock'
  /** Moving between sections. */
  | 'navigate'
  /** A panel or overlay opening. */
  | 'open'
  /** …and closing. */
  | 'close'
  /** Message sent — the one outbound action on the site. */
  | 'transmit'
  /** Neural field activation. */
  | 'activate'
  /** The mechanical → computational transformation. */
  | 'morph'
  /** Kernel panic. */
  | 'glitch'
  /** Something failed. Deliberately dissonant — the only such sound here. */
  | 'error';

/** Voices that must never be dropped by the polyphony guard. */
const PRIORITY: ReadonlySet<Voice> = new Set(['power', 'online', 'transmit', 'glitch', 'error', 'morph']);

/** Cheapest possible envelope floor — `exponentialRamp` cannot reach zero. */
const ZERO = 0.0001;

/* ------------------------------------------------------------------ *
 * ENGINE
 * ------------------------------------------------------------------ */

interface Pad {
  sub: OscillatorNode;
  voices: OscillatorNode[];
  air: AudioBufferSourceNode;
  airGain: GainNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  breath: OscillatorNode;
  breathDepth: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;

  /* Signal chain: voices → bus → master → limiter → destination */
  private master: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private busAmbient: GainNode | null = null;
  private busUi: GainNode | null = null;
  private busEvent: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbReturn: GainNode | null = null;

  private pad: Pad | null = null;
  private noise: AudioBuffer | null = null;

  private enabled = false;
  private volume = 0.7;
  /** Ducked to silence while the tab is in the background. */
  private suspendedByVisibility = false;
  private reducedMotion = false;

  /** Live one-shot count, for the polyphony guard. */
  private active = 0;
  /** Last trigger time per voice, for throttling. */
  private lastAt: Partial<Record<Voice, number>> = {};

  private static readonly MAX_VOICES = 14;

  /*
   * Breath LFO depth, in Hz, and the pad filter's resting cutoff.
   *
   * These two are a pair and must be read together: the LFO is *summed onto*
   * the filter's base frequency, so a depth larger than the base drives the
   * cutoff negative on every downswing. A lowpass clamped at zero passes
   * nothing, so the pad silently gated itself for part of every LFO cycle —
   * measured as the bed dropping from 0.049 RMS to 0.001 and back on a ~17
   * second period, which reads as the sound cutting out rather than as
   * movement. The base must stay comfortably above the depth at all times.
   */
  private static readonly BREATH_DEPTH = 200;
  private static readonly PAD_CUTOFF_BASE = 380;
  private static readonly PAD_CUTOFF_RANGE = 820;

  /** Minimum gap between repeats, in seconds. Keyed by voice. */
  private static readonly THROTTLE: Partial<Record<Voice, number>> = {
    hover: 0.055,
    press: 0.03,
    tick: 0.035,
    lock: 0.06,
    navigate: 0.14,
  };

  /* ---------------- lifecycle ---------------- */

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    this.ctx = ctx;

    /*
     * The limiter is the last thing before the speakers and exists purely so
     * that no combination of overlapping voices can ever exceed full scale.
     * A high ratio with a near-zero knee makes it a brick wall rather than a
     * musical compressor — it should be doing nothing at all most of the time.
     */
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    limiter.connect(ctx.destination);
    this.limiter = limiter;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(limiter);
    this.master = master;

    /* Per-role buses. Separating them is what allows the pad to sit at a
       different level from interface clicks without retuning every voice. */
    const mk = (level: number) => {
      const g = ctx.createGain();
      g.gain.value = level;
      g.connect(master);
      return g;
    };
    this.busAmbient = mk(0.5);
    this.busUi = mk(0.34);
    this.busEvent = mk(0.62);

    /* Shared reverb. One convolver for the whole site; voices send into it by
       their own amount rather than each building a space of their own. */
    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(ctx);
    const ret = ctx.createGain();
    ret.gain.value = 0.9;
    reverb.connect(ret).connect(master);
    this.reverb = reverb;
    this.reverbReturn = ret;

    return ctx;
  }

  /**
   * A synthetic impulse response: exponentially decaying noise with a handful
   * of discrete early reflections in front of it. The early reflections are
   * what make it read as a room rather than as a reverb effect — a pure noise
   * tail sounds like a wash, because real rooms return a few distinct bounces
   * before the diffuse tail arrives.
   */
  private impulse(ctx: AudioContext, seconds = 2.6, decay = 3.1): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * seconds));
    const buf = ctx.createBuffer(2, len, rate);

    // Times (s) and levels of the early reflections. Slightly different per
    // channel so the space has width instead of collapsing to the centre.
    const early: [number, number][][] = [
      [
        [0.011, 0.5],
        [0.023, 0.36],
        [0.041, 0.26],
        [0.067, 0.18],
      ],
      [
        [0.014, 0.46],
        [0.027, 0.34],
        [0.046, 0.24],
        [0.072, 0.17],
      ],
    ];

    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
      for (const [time, level] of early[ch]) {
        const idx = Math.floor(time * rate);
        if (idx < len) data[idx] += (Math.random() * 2 - 1) * level;
      }
    }
    return buf;
  }

  /**
   * Pink-ish noise, reused by every noise-based voice.
   *
   * White noise is flat per hertz, which puts most of its energy in the top
   * octave and sounds like static hiss. Filtering towards pink (equal energy
   * per octave) is what makes noise read as air, breath, or a mechanical
   * transient instead of as tape noise.
   */
  private getNoise(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;

    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // Paul Kellet's economical pink-noise filter.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }

    this.noise = buf;
    return buf;
  }

  /* ---------------- public control ---------------- */

  setEnabled(on: boolean) {
    this.enabled = on;
    const ctx = on ? this.ensure() : this.ctx;
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    // A slow fade in both directions: sound appearing or vanishing instantly is
    // startling, and an abrupt gain change on a running pad is an audible click.
    this.master.gain.setTargetAtTime(on ? this.targetGain() : 0, now, on ? 0.45 : 0.22);

    if (on) this.startPad();
    else this.stopPad();
  }

  isEnabled() {
    return this.enabled;
  }

  /** Visitor-facing level, [0,1]. */
  setVolume(v: number) {
    this.volume = clamp01(v);
    if (!this.ctx || !this.master || !this.enabled) return;
    this.master.gain.setTargetAtTime(this.targetGain(), this.ctx.currentTime, 0.08);
  }

  getVolume() {
    return this.volume;
  }

  private targetGain(): number {
    if (this.suspendedByVisibility) return 0;
    // 0.55 ceiling: this sits under the experience, never on it.
    return this.volume * 0.55;
  }

  /**
   * Silence while the tab is hidden. A drone continuing from a background tab
   * is the single most complained-about behaviour in audio-enabled sites, and
   * the visitor cannot even see which tab to go and mute.
   */
  setPageVisible(visible: boolean) {
    this.suspendedByVisibility = !visible;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(
      this.enabled ? this.targetGain() : 0,
      this.ctx.currentTime,
      0.15,
    );
  }

  /** Reduced motion also means reduced movement in the sound. */
  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
    if (!this.pad || !this.ctx) return;
    this.pad.breathDepth.gain.setTargetAtTime(v ? 0 : AudioEngine.BREATH_DEPTH, this.ctx.currentTime, 0.6);
  }

  /* ---------------- ambient pad ---------------- */

  /**
   * The bed: a sub, three detuned voices tuned to the root and its fifth, and a
   * band of air. It is a chord rather than a single sawtooth because one raw
   * saw at 42 Hz is a buzz — the frequency of a fault, not of a room.
   */
  private startPad() {
    const ctx = this.ensure();
    if (!ctx || !this.busAmbient || this.pad) return;

    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.value = ZERO;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = AudioEngine.PAD_CUTOFF_BASE;
    filter.Q.value = 1.4;
    filter.connect(gain).connect(this.busAmbient);
    // A little of the pad in the room as well, so it has depth behind it.
    if (this.reverb) gain.connect(this.reverb);

    /* Sub — the root, felt more than heard. */
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = hz(0, -3); // A1, 55 Hz
    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;
    sub.connect(subGain).connect(filter);
    sub.start(now);

    /* Body — root and fifth, detuned against each other. The detune is what
       creates slow beating, and that beating is what makes a synthesised pad
       sound alive rather than static. */
    const voices: OscillatorNode[] = [];
    const body: [number, number, number, number][] = [
      // [degree, octave, detune cents, level]
      [0, -2, -7, 0.16],
      [0, -2, +6, 0.16],
      [3, -2, +3, 0.1], // the fifth (E)
    ];
    for (const [deg, oct, det, level] of body) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz(deg, oct) * cents(det);
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(filter);
      osc.start(now);
      voices.push(osc);
    }

    /* Air — a quiet band of pink noise, the sound of a room with something
       running in it. */
    const air = ctx.createBufferSource();
    air.buffer = this.getNoise(ctx);
    air.loop = true;
    const airBand = ctx.createBiquadFilter();
    airBand.type = 'bandpass';
    airBand.frequency.value = 780;
    airBand.Q.value = 0.7;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.035;
    air.connect(airBand).connect(airGain).connect(this.busAmbient);
    air.start(now);

    /* Breath — a very slow LFO on the filter, so the pad opens and closes on
       its own. Without it the bed is a held chord, and a held chord stops being
       heard within about twenty seconds. */
    const breath = ctx.createOscillator();
    breath.type = 'sine';
    breath.frequency.value = 0.06;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = this.reducedMotion ? 0 : AudioEngine.BREATH_DEPTH;
    breath.connect(breathDepth).connect(filter.frequency);
    breath.start(now);

    gain.gain.setTargetAtTime(0.5, now, 1.6);

    this.pad = { sub, voices, air, airGain, filter, gain, breath, breathDepth };
  }

  private stopPad() {
    if (!this.pad || !this.ctx) return;
    const { sub, voices, air, breath, gain } = this.pad;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(ZERO, now, 0.3);

    const stopAt = now + 1.6;
    for (const node of [sub, ...voices, breath, air]) {
      try {
        node.stop(stopAt);
      } catch {
        /* already stopped */
      }
    }
    this.pad = null;
  }

  /**
   * Scroll energy drives the bed. Faster scrolling opens the filter and lifts
   * the air — the machine working harder. This is the audio counterpart of the
   * site's motion principle: the sound reports a state rather than looping
   * decoratively.
   */
  setLoad(load: number) {
    if (!this.enabled || !this.pad || !this.ctx) return;
    const l = clamp01(load);
    const now = this.ctx.currentTime;
    // The breath LFO is summed on top of this — see BREATH_DEPTH for why the
    // base can never be allowed below it.
    this.pad.filter.frequency.setTargetAtTime(
      AudioEngine.PAD_CUTOFF_BASE + l * AudioEngine.PAD_CUTOFF_RANGE,
      now,
      0.35,
    );
    this.pad.airGain.gain.setTargetAtTime(0.03 + l * 0.075, now, 0.35);
  }

  /**
   * Re-voices the pad's fifth as the visitor moves through the site, so the
   * score develops across a visit instead of holding one chord for its whole
   * duration. Small intervals only — this should never be noticed as a change,
   * just as the site not sounding the same at the end as at the start.
   */
  setTone(step: number) {
    if (!this.enabled || !this.pad || !this.ctx) return;
    const upper = this.pad.voices[2];
    if (!upper) return;
    const deg = 3 + (step % 3);
    upper.frequency.setTargetAtTime(hz(deg, -2) * cents(3), this.ctx.currentTime, 1.4);
  }

  /* ---------------- one-shots ---------------- */

  /**
   * Builds the standard tail of a voice: level → optional pan → dry bus, plus a
   * send into the shared reverb. Returns the node to connect sources into.
   */
  private out(
    ctx: AudioContext,
    bus: GainNode | null,
    opts: { pan?: number; send?: number } = {},
  ): GainNode {
    const g = ctx.createGain();
    const dest = bus ?? this.master!;

    if (opts.pan !== undefined && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      g.connect(p).connect(dest);
    } else {
      g.connect(dest);
    }

    if (this.reverb && opts.send) {
      const send = ctx.createGain();
      send.gain.value = opts.send;
      g.connect(send).connect(this.reverb);
    }
    return g;
  }

  /** Schedules teardown so nodes are collected rather than accumulating. */
  private retire(node: AudioScheduledSourceNode, at: number, chain: AudioNode[]) {
    this.active++;
    try {
      node.stop(at);
    } catch {
      /* already scheduled */
    }
    node.onended = () => {
      this.active = Math.max(0, this.active - 1);
      for (const n of chain) {
        try {
          n.disconnect();
        } catch {
          /* already disconnected */
        }
      }
    };
  }

  private allowed(voice: Voice, now: number): boolean {
    if (!this.enabled || this.suspendedByVisibility) return false;

    const gap = AudioEngine.THROTTLE[voice];
    if (gap !== undefined) {
      const last = this.lastAt[voice];
      if (last !== undefined && now - last < gap) return false;
    }
    // Under load, drop decorative voices rather than letting the mix turn to
    // mud and the limiter pump.
    if (this.active >= AudioEngine.MAX_VOICES && !PRIORITY.has(voice)) return false;

    this.lastAt[voice] = now;
    return true;
  }

  /** A single enveloped oscillator — the building block for most voices. */
  private blip(
    ctx: AudioContext,
    opts: {
      type: OscillatorType;
      freq: number;
      toFreq?: number;
      start?: number;
      attack: number;
      decay: number;
      level: number;
      bus: GainNode | null;
      pan?: number;
      send?: number;
      filter?: { type: BiquadFilterType; freq: number; toFreq?: number; q?: number };
    },
  ) {
    const t0 = ctx.currentTime + (opts.start ?? 0);
    const end = t0 + opts.attack + opts.decay;

    const osc = ctx.createOscillator();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.toFreq) osc.frequency.exponentialRampToValueAtTime(opts.toFreq, end);

    const g = this.out(ctx, opts.bus, { pan: opts.pan, send: opts.send });
    g.gain.setValueAtTime(ZERO, t0);
    g.gain.exponentialRampToValueAtTime(opts.level, t0 + opts.attack);
    g.gain.exponentialRampToValueAtTime(ZERO, end);

    const chain: AudioNode[] = [osc, g];
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = opts.filter.type;
      f.frequency.setValueAtTime(opts.filter.freq, t0);
      if (opts.filter.toFreq) f.frequency.exponentialRampToValueAtTime(opts.filter.toFreq, end);
      if (opts.filter.q) f.Q.value = opts.filter.q;
      osc.connect(f).connect(g);
      chain.push(f);
    } else {
      osc.connect(g);
    }

    osc.start(t0);
    this.retire(osc, end + 0.02, chain);
  }

  /** A shaped burst of noise — every mechanical transient on the site. */
  private hit(
    ctx: AudioContext,
    opts: {
      freq: number;
      q: number;
      decay: number;
      level: number;
      bus: GainNode | null;
      type?: BiquadFilterType;
      start?: number;
      pan?: number;
      send?: number;
      toFreq?: number;
    },
  ) {
    const t0 = ctx.currentTime + (opts.start ?? 0);
    const end = t0 + opts.decay;

    const src = ctx.createBufferSource();
    src.buffer = this.getNoise(ctx);
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.setValueAtTime(opts.freq, t0);
    if (opts.toFreq) f.frequency.exponentialRampToValueAtTime(opts.toFreq, end);
    f.Q.value = opts.q;

    const g = this.out(ctx, opts.bus, { pan: opts.pan, send: opts.send });
    g.gain.setValueAtTime(opts.level, t0);
    g.gain.exponentialRampToValueAtTime(ZERO, end);

    src.connect(f).connect(g);
    // Start from a random offset into the shared buffer. Playing the same two
    // seconds of noise from sample zero every time makes repeated hits
    // bit-identical, which is what makes a click sound like a recording being
    // replayed rather than a mechanism operating twice.
    src.start(t0, Math.random() * 1.5);
    this.retire(src, end + 0.02, [src, f, g]);
  }

  play(voice: Voice) {
    const ctx = this.enabled ? this.ensure() : null;
    if (!ctx || !this.master) return;
    if (!this.allowed(voice, ctx.currentTime)) return;

    const UI = this.busUi;
    const EV = this.busEvent;

    switch (voice) {
      /* ---- boot ---- */

      // Something coming up to voltage: a sub swelling in under a filtered saw
      // that rises and settles on the root, with an intake of air across it.
      case 'power': {
        this.blip(ctx, {
          type: 'sine', freq: hz(0, -4), toFreq: hz(0, -3),
          attack: 1.5, decay: 1.7, level: 0.42, bus: EV, send: 0.12,
        });
        this.blip(ctx, {
          type: 'sawtooth', freq: hz(0, -3), toFreq: hz(0, -1),
          attack: 1.7, decay: 1.5, level: 0.15, bus: EV, send: 0.3,
          filter: { type: 'lowpass', freq: 180, toFreq: 2400, q: 4 },
        });
        this.hit(ctx, {
          freq: 420, toFreq: 1900, q: 0.6, decay: 2.6, level: 0.05,
          bus: EV, send: 0.35,
        });
        break;
      }

      case 'tick': {
        this.hit(ctx, { freq: 3200, q: 12, decay: 0.018, level: 0.05, bus: UI, pan: (Math.random() - 0.5) * 0.5 });
        break;
      }

      // Boot complete. The one place the site allows itself an actual chord —
      // an A minor triad arpeggiated fast, bell-toned, with a long tail.
      case 'online': {
        [0, 1, 2, 3].forEach((d, i) => {
          this.blip(ctx, {
            type: 'triangle', freq: hz(d, 0), start: i * 0.075,
            attack: 0.008, decay: 0.9 + i * 0.22, level: 0.11 - i * 0.014,
            bus: EV, send: 0.5, pan: (i - 1.5) * 0.22,
          });
          // A quiet octave above each note gives the tone its bell character.
          this.blip(ctx, {
            type: 'sine', freq: hz(d, 1), start: i * 0.075,
            attack: 0.006, decay: 0.5, level: 0.035, bus: EV, send: 0.5,
          });
        });
        this.blip(ctx, {
          type: 'sine', freq: hz(0, -3), attack: 0.02, decay: 2.4, level: 0.3, bus: EV,
        });
        break;
      }

      /* ---- interface ---- */

      // A whisper. Deliberately near the threshold of notice: this fires on
      // every pointer entry on the page, so anything louder becomes chatter
      // within about ten seconds of normal mouse movement.
      case 'hover': {
        this.blip(ctx, {
          type: 'sine', freq: hz(7, 1), attack: 0.004, decay: 0.05,
          level: 0.022, bus: UI, send: 0.1,
        });
        break;
      }

      // The surface of a control being pressed: a hard transient with a short
      // tuned body under it, the way a real switch has both a click and a
      // housing that resonates.
      case 'press': {
        this.hit(ctx, { freq: 2100, q: 7, decay: 0.028, level: 0.075, bus: UI });
        this.blip(ctx, {
          type: 'sine', freq: hz(0, 0), attack: 0.003, decay: 0.07, level: 0.05, bus: UI, send: 0.12,
        });
        break;
      }

      // A mechanism answering the press — heavier, lower, slightly later. This
      // is what makes selecting a project bay feel like moving something rather
      // than toggling a value.
      case 'lock': {
        this.hit(ctx, { freq: 1150, q: 5, decay: 0.05, level: 0.1, bus: EV, send: 0.2 });
        this.blip(ctx, {
          type: 'triangle', freq: hz(0, -1), attack: 0.004, decay: 0.16,
          level: 0.085, bus: EV, send: 0.25,
        });
        break;
      }

      case 'navigate': {
        this.blip(ctx, {
          type: 'triangle', freq: hz(2, 0), attack: 0.006, decay: 0.2,
          level: 0.07, bus: EV, send: 0.4, pan: -0.15,
        });
        this.blip(ctx, {
          type: 'triangle', freq: hz(4, 0), start: 0.07, attack: 0.006, decay: 0.3,
          level: 0.055, bus: EV, send: 0.45, pan: 0.15,
        });
        break;
      }

      case 'open': {
        this.blip(ctx, {
          type: 'sine', freq: hz(0, 0), toFreq: hz(3, 0),
          attack: 0.008, decay: 0.22, level: 0.06, bus: UI, send: 0.3,
        });
        this.hit(ctx, { freq: 900, toFreq: 2600, q: 1.2, decay: 0.22, level: 0.03, bus: UI, send: 0.2 });
        break;
      }

      case 'close': {
        this.blip(ctx, {
          type: 'sine', freq: hz(3, 0), toFreq: hz(0, 0),
          attack: 0.006, decay: 0.18, level: 0.05, bus: UI, send: 0.2,
        });
        break;
      }

      /* ---- events ---- */

      // A packet leaving the machine: four notes up the scale, each one panned
      // further right, with a noise sweep travelling under them.
      case 'transmit': {
        [0, 1, 2, 4].forEach((d, i) => {
          this.blip(ctx, {
            type: 'sine', freq: hz(d, 0), start: i * 0.055,
            attack: 0.005, decay: 0.28, level: 0.075, bus: EV,
            send: 0.4, pan: -0.4 + i * 0.28,
          });
        });
        this.hit(ctx, { freq: 700, toFreq: 5200, q: 0.8, decay: 0.5, level: 0.045, bus: EV, send: 0.4 });
        break;
      }

      // Neural activation — an FM-flavoured bell, brighter than anything else
      // on the site because this is the one purely computational moment.
      case 'activate': {
        this.blip(ctx, {
          type: 'triangle', freq: hz(4, 1), attack: 0.004, decay: 0.55,
          level: 0.085, bus: EV, send: 0.55,
        });
        this.blip(ctx, {
          type: 'sine', freq: hz(4, 2), attack: 0.003, decay: 0.28,
          level: 0.03, bus: EV, send: 0.55,
        });
        break;
      }

      // Mechanical → computational. A long rise that opens all the way up: the
      // sound of the machine's own material changing state.
      case 'morph': {
        this.blip(ctx, {
          type: 'sawtooth', freq: hz(0, -2), toFreq: hz(0, 0),
          attack: 1.1, decay: 1.5, level: 0.1, bus: EV, send: 0.5,
          filter: { type: 'lowpass', freq: 240, toFreq: 5200, q: 6 },
        });
        this.hit(ctx, { freq: 500, toFreq: 6000, q: 0.7, decay: 2.4, level: 0.05, bus: EV, send: 0.55 });
        this.blip(ctx, {
          type: 'sine', freq: hz(0, 1), start: 2.0, attack: 0.01, decay: 1.2,
          level: 0.06, bus: EV, send: 0.6,
        });
        break;
      }

      /* ---- failure ---- */

      case 'glitch': {
        // Detuned squares a hair apart, beating hard against each other.
        [hz(0, -2), hz(0, -2) * cents(31)].forEach((f, i) => {
          this.blip(ctx, {
            type: 'square', freq: f, attack: 0.002, decay: 0.42,
            level: 0.06, bus: EV, pan: i ? 0.5 : -0.5,
            filter: { type: 'lowpass', freq: 1800, q: 2 },
          });
        });
        // Stuttered noise bursts, irregularly spaced — a signal breaking up.
        for (let i = 0; i < 6; i++) {
          this.hit(ctx, {
            freq: 600 + Math.random() * 3000, q: 4, decay: 0.03,
            level: 0.06, bus: EV, start: i * 0.055 + Math.random() * 0.02,
            pan: Math.random() * 2 - 1,
          });
        }
        break;
      }

      // The only dissonance on the site: a minor second, which is the interval
      // the ear reads as wrong. It is deliberately outside the scale — an error
      // should not sound like it belongs.
      case 'error': {
        this.blip(ctx, {
          type: 'triangle', freq: hz(0, -1), attack: 0.004, decay: 0.3,
          level: 0.07, bus: EV, send: 0.25,
        });
        this.blip(ctx, {
          type: 'triangle', freq: hz(0, -1) * Math.pow(2, 1 / 12),
          attack: 0.004, decay: 0.3, level: 0.07, bus: EV, send: 0.25,
        });
        break;
      }
    }
  }

  dispose() {
    this.stopPad();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.limiter = null;
    this.busAmbient = this.busUi = this.busEvent = null;
    this.reverb = null;
    this.reverbReturn = null;
    this.noise = null;
    this.active = 0;
    this.lastAt = {};
  }
}

export const audio = new AudioEngine();
