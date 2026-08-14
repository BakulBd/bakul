'use client';

/**
 * PROCEDURAL AUDIO — no files, no downloads.
 *
 * Every sound is synthesised from oscillators and filtered noise, so the whole
 * audio system costs zero network bytes. Muted by default; nothing is created
 * until the visitor explicitly enables sound (which also satisfies browser
 * autoplay policy, since enabling is a user gesture).
 */

type Voice = 'power' | 'relay' | 'transmit' | 'activate' | 'glitch';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  private enabled = false;
  private noiseBuffer: AudioBuffer | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      // Deliberately quiet. This should sit under the experience, not on it.
      this.master.gain.value = 0.0;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** One second of white noise, reused by every noise-based voice. */
  private getNoise(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    return this.noiseBuffer;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    const ctx = on ? this.ensure() : this.ctx;
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(on ? 0.5 : 0.0, now, 0.25);

    if (on) this.startAmbience();
    else this.stopAmbience();
  }

  /** Low machine-room hum. Single oscillator through a lowpass — very cheap. */
  private startAmbience() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.ambience) return;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 42;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    osc.connect(filter).connect(gain).connect(this.master);
    osc.start();
    this.ambience = { osc, gain, filter };
  }

  private stopAmbience() {
    if (!this.ambience || !this.ctx) return;
    const { osc, gain } = this.ambience;
    const now = this.ctx.currentTime;
    gain.gain.setTargetAtTime(0, now, 0.2);
    try {
      osc.stop(now + 1.2);
    } catch {
      /* already stopped */
    }
    this.ambience = null;
  }

  /**
   * Machine load drives the ambience filter — the hum opens up as the visitor
   * scrolls faster. This is the audio equivalent of the motion principle:
   * the sound reports a state change rather than looping decoratively.
   */
  setLoad(load: number) {
    if (!this.enabled || !this.ambience || !this.ctx) return;
    const target = 150 + Math.min(1, Math.max(0, load)) * 520;
    this.ambience.filter.frequency.setTargetAtTime(target, this.ctx.currentTime, 0.3);
  }

  play(voice: Voice) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;

    switch (voice) {
      // Rising capacitor whine — the sound of something coming up to voltage.
      case 'power': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(38, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 2.4);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(2600, now + 2.4);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 1.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(filter).connect(gain).connect(this.master);
        osc.start(now);
        osc.stop(now + 3.3);
        break;
      }

      // Short filtered noise burst — a contactor closing.
      case 'relay': {
        const src = ctx.createBufferSource();
        src.buffer = this.getNoise(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2400;
        filter.Q.value = 9;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        src.connect(filter).connect(gain).connect(this.master);
        src.start(now);
        src.stop(now + 0.08);
        break;
      }

      // Ascending blip — a packet leaving the machine.
      case 'transmit': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1750, now + 0.42);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain).connect(this.master);
        osc.start(now);
        osc.stop(now + 0.62);
        break;
      }

      // Two-tone chirp for neural activation.
      case 'activate': {
        [880, 1320].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = f;
          const start = now + i * 0.06;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
          osc.connect(gain).connect(this.master!);
          osc.start(start);
          osc.stop(start + 0.32);
        });
        break;
      }

      // Harsh detuned square pair — kernel panic.
      case 'glitch': {
        [110, 113].forEach((f) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
          osc.connect(gain).connect(this.master!);
          osc.start(now);
          osc.stop(now + 0.46);
        });
        break;
      }
    }
  }

  dispose() {
    this.stopAmbience();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
  }
}

export const audio = new AudioEngine();
