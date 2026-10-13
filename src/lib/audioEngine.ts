/**
 * AudioEngine — Web Audio API beat generator + SFX + master clock.
 *
 * The game's rhythm engine reads its time from `getSongTime()` so that the
 * visual prompts stay locked to the audio clock. If the AudioContext cannot
 * be created, it transparently falls back to a performance.now clock so the
 * game remains fully playable (silent).
 */

export type SfxName =
  | 'ui-click'
  | 'ui-confirm'
  | 'key-press'
  | 'pop-hit'
  | 'miss'
  | 'combo'
  | 'crowd'
  | 'round-start'
  | 'victory'
  | 'defeat'
  | 'countdown';

const STEPS_PER_BAR = 16;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private schedulerId: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private bpm = 100;
  private songStart = 0;
  private leadIn = 0.12;
  private running = false;

  private fallbackStart = 0;
  private fallbackPaused = 0;
  private usingFallback = false;

  musicVolume = 0.6;
  sfxVolume = 0.85;
  muted = false;

  get available(): boolean {
    return !this.usingFallback;
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error('no audio context');
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.master);

      this.noiseBuffer = this.makeNoise();
      if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {});
      this.usingFallback = false;
    } catch {
      this.usingFallback = true;
      this.ctx = null;
    }
  }

  private makeNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    const len = Math.floor(this.ctx.sampleRate * 1.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.02);
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.02);
    }
  }

  // ---------------- transport ----------------

  startSong(bpm: number) {
    this.bpm = bpm;
    this.step = 0;
    this.running = true;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
      this.songStart = this.ctx.currentTime + this.leadIn;
      this.nextStepTime = this.songStart;
      if (this.schedulerId == null) {
        this.schedulerId = window.setInterval(() => this.scheduler(), 25);
      }
    } else {
      this.fallbackStart = performance.now() + this.leadIn * 1000;
      this.usingFallback = true;
    }
  }

  stopSong() {
    this.running = false;
    if (this.schedulerId != null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  /** Freezes the audio clock without losing position (ctx.currentTime stops). */
  suspend() {
    if (this.ctx) {
      void this.ctx.suspend().catch(() => {});
    } else {
      this.fallbackPaused = performance.now() - this.fallbackStart;
    }
  }

  resumeClock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
    } else {
      this.fallbackStart = performance.now() - this.fallbackPaused;
    }
  }

  getSongTime(): number {
    if (this.ctx) return (this.ctx.currentTime - this.songStart) * 1000;
    return performance.now() - this.fallbackStart;
  }

  get isPlaying(): boolean {
    return this.running;
  }

  get stepDuration(): number {
    return 60 / this.bpm / 4; // one 16th note
  }

  get beatDuration(): number {
    return 60000 / this.bpm;
  }

  // ---------------- sequencer ----------------

  private scheduler() {
    if (!this.ctx || !this.running) return;
    const horizon = this.ctx.currentTime + 0.12;
    while (this.nextStepTime < horizon) {
      this.scheduleStep(this.step % STEPS_PER_BAR, this.nextStepTime);
      this.nextStepTime += this.stepDuration;
      this.step += 1;
    }
  }

  private scheduleStep(s: number, time: number) {
    // Four-on-the-floor with a ghost kick for groove.
    if (s % 4 === 0) this.kick(time, s === 0 ? 150 : 140);
    if (s === 14) this.kick(time, 110, 0.5);

    if (s === 4 || s === 12) this.snare(time);
    if (s === 7 || s === 15) this.clap(time, 0.25);

    // Hats on every 8th with an offbeat accent.
    if (s % 2 === 0) this.hat(time, s % 4 === 0 ? 0.5 : 0.3);

    // Funky electro bassline (semitone offsets from A1).
    const bassPattern = [0, 0, 3, 0, 5, 0, 3, 10, 0, 0, 3, 0, 7, 0, 5, 3];
    if (s % 2 === 0) {
      const semis = bassPattern[s];
      const freq = 55 * Math.pow(2, semis / 12);
      this.bass(time, freq, s % 8 === 0 ? 0.24 : 0.16);
    }
  }

  // ---------------- instruments ----------------

  private kick(time: number, startFreq: number, gain = 1) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.9 * gain, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  private snare(time: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.2);
  }

  private clap(time: number, gain = 0.3) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.14);
  }

  private hat(time: number, gain: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.06);
  }

  private bass(time: number, freq: number, gain: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700, time);
    lp.frequency.exponentialRampToValueAtTime(220, time + 0.18);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.19);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  // ---------------- sfx ----------------

  playSfx(name: SfxName) {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'ui-click':
        this.blip(t, 520, 0.05, 'square', 0.16);
        break;
      case 'ui-confirm':
        this.blip(t, 520, 0.06, 'square', 0.18);
        this.blip(t + 0.07, 780, 0.08, 'square', 0.18);
        break;
      case 'key-press':
        this.blip(t, 240, 0.04, 'triangle', 0.12);
        break;
      case 'pop-hit':
        this.impact(t, 160, 0.12, 0.5);
        this.blip(t, 900, 0.03, 'square', 0.14);
        break;
      case 'miss':
        this.blip(t, 180, 0.18, 'sawtooth', 0.16, 90);
        break;
      case 'combo':
        this.blip(t, 660, 0.06, 'square', 0.16);
        this.blip(t + 0.06, 990, 0.08, 'square', 0.16);
        break;
      case 'crowd':
        this.crowd(t);
        break;
      case 'countdown':
        this.blip(t, 660, 0.12, 'sine', 0.22);
        break;
      case 'round-start':
        [330, 440, 554, 660].forEach((f, i) => this.blip(t + i * 0.09, f, 0.14, 'square', 0.2));
        break;
      case 'victory':
        [523, 659, 784, 1046].forEach((f, i) => this.blip(t + i * 0.12, f, 0.3, 'triangle', 0.24));
        this.crowd(t + 0.1);
        break;
      case 'defeat':
        [392, 330, 262, 196].forEach((f, i) => this.blip(t + i * 0.16, f, 0.32, 'sawtooth', 0.2));
        break;
    }
  }

  private blip(
    time: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    glideTo?: number,
  ) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, time + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private impact(time: number, startFreq: number, dur: number, gain: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private crowd(time: number) {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.24, time + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxGain);
    src.start(time);
    src.stop(time + 1.7);
  }

  dispose() {
    this.stopSong();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const audioEngine = new AudioEngine();
