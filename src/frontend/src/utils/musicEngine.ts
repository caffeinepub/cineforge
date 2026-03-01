// ─── Cinematic Music Engine ───────────────────────────────────────────────────
// Web Audio API ambient music generator for cinematic scene playback

type MusicMood =
  | "epic-rise"
  | "luxury-ambient"
  | "tension-build"
  | "warm-resolve"
  | "dramatic-swell";

interface OscillatorConfig {
  frequency: number;
  type: OscillatorType;
  gainLevel: number;
  detune?: number;
}

interface MoodConfig {
  oscillators: OscillatorConfig[];
  lfoFrequency?: number;
  lfoDepth?: number;
  baseGain: number;
  filterFrequency?: number;
  filterType?: BiquadFilterType;
}

const MOOD_CONFIGS: Record<MusicMood, MoodConfig> = {
  "luxury-ambient": {
    oscillators: [
      { frequency: 220, type: "sine", gainLevel: 0.08 },
      { frequency: 330, type: "sine", gainLevel: 0.05, detune: 5 },
      { frequency: 110, type: "sine", gainLevel: 0.04 },
    ],
    lfoFrequency: 0.3,
    lfoDepth: 0.02,
    baseGain: 0.06,
    filterFrequency: 800,
    filterType: "lowpass",
  },
  "epic-rise": {
    oscillators: [
      { frequency: 55, type: "sawtooth", gainLevel: 0.04 },
      { frequency: 110, type: "sawtooth", gainLevel: 0.05 },
      { frequency: 165, type: "sine", gainLevel: 0.03 },
    ],
    lfoFrequency: 0.1,
    lfoDepth: 0.03,
    baseGain: 0.07,
    filterFrequency: 600,
    filterType: "lowpass",
  },
  "tension-build": {
    oscillators: [
      { frequency: 146.83, type: "triangle", gainLevel: 0.07 },
      { frequency: 155.56, type: "triangle", gainLevel: 0.05, detune: 8 },
      { frequency: 73.4, type: "sine", gainLevel: 0.04 },
    ],
    lfoFrequency: 2.5,
    lfoDepth: 0.025,
    baseGain: 0.06,
    filterFrequency: 1200,
    filterType: "bandpass",
  },
  "warm-resolve": {
    oscillators: [
      { frequency: 264, type: "sine", gainLevel: 0.07 },
      { frequency: 396, type: "sine", gainLevel: 0.05, detune: 3 },
      { frequency: 132, type: "sine", gainLevel: 0.04 },
    ],
    lfoFrequency: 0.4,
    lfoDepth: 0.015,
    baseGain: 0.06,
    filterFrequency: 2000,
    filterType: "lowpass",
  },
  "dramatic-swell": {
    oscillators: [
      { frequency: 82.4, type: "sawtooth", gainLevel: 0.05 },
      { frequency: 164.8, type: "sine", gainLevel: 0.06 },
      { frequency: 246, type: "sine", gainLevel: 0.04 },
    ],
    lfoFrequency: 0.15,
    lfoDepth: 0.04,
    baseGain: 0.07,
    filterFrequency: 700,
    filterType: "lowpass",
  },
};

export class CinematicMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private _isPlaying = false;
  private _volume = 0.5;
  private currentMood: MusicMood | null = null;
  private fadeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private ensureContext(): boolean {
    if (typeof window === "undefined") return false;
    if (
      !window.AudioContext &&
      !(window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    ) {
      return false;
    }
    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch {
        return false;
      }
    }
    return true;
  }

  private async resumeContext(): Promise<boolean> {
    if (!this.ensureContext()) return false;
    if (!this.ctx) return false;
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }
    return this.ctx.state === "running";
  }

  private stopOscillators(): void {
    for (const osc of this.oscillators) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    }
    this.oscillators = [];

    if (this.lfo) {
      try {
        this.lfo.stop();
      } catch {
        /* already stopped */
      }
      this.lfo = null;
    }
    this.lfoGain = null;
    this.filter = null;
    this.masterGain = null;
  }

  play(mood: MusicMood): void {
    if (!this.ensureContext() || !this.ctx) return;

    // Cancel any pending fade
    if (this.fadeTimeoutId) {
      clearTimeout(this.fadeTimeoutId);
      this.fadeTimeoutId = null;
    }

    // Stop existing if playing a different mood
    if (this._isPlaying) {
      if (this.currentMood === mood) return; // already playing same mood
      this.stopOscillators();
    }

    this.resumeContext().then((ready) => {
      if (!ready || !this.ctx) return;

      const config = MOOD_CONFIGS[mood];
      const now = this.ctx.currentTime;

      // Master gain with soft attack
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(
        config.baseGain * this._volume,
        now + 1.5,
      );
      this.masterGain.connect(this.ctx.destination);

      // Optional LPF/BPF
      if (config.filterFrequency && config.filterType) {
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = config.filterType;
        this.filter.frequency.setValueAtTime(config.filterFrequency, now);
        this.filter.Q.setValueAtTime(1.0, now);
        this.filter.connect(this.masterGain);
      }

      const outputNode = this.filter ?? this.masterGain;

      // LFO tremolo
      if (config.lfoFrequency && config.lfoDepth) {
        this.lfo = this.ctx.createOscillator();
        this.lfo.type = "sine";
        this.lfo.frequency.setValueAtTime(config.lfoFrequency, now);

        this.lfoGain = this.ctx.createGain();
        this.lfoGain.gain.setValueAtTime(config.lfoDepth, now);
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.masterGain.gain);
        this.lfo.start();
      }

      // Create oscillators
      for (const oscConfig of config.oscillators) {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = oscConfig.type;
        osc.frequency.setValueAtTime(oscConfig.frequency, now);
        if (oscConfig.detune) {
          osc.detune.setValueAtTime(oscConfig.detune, now);
        }

        oscGain.gain.setValueAtTime(oscConfig.gainLevel, now);

        osc.connect(oscGain);
        oscGain.connect(outputNode);
        osc.start(now);

        this.oscillators.push(osc);
      }

      // For epic-rise: slowly raise filter frequency over 8 seconds
      if (mood === "epic-rise" && this.filter) {
        this.filter.frequency.linearRampToValueAtTime(2000, now + 8);
      }

      // For dramatic-swell: crescendo
      if (mood === "dramatic-swell" && this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(
          config.baseGain * this._volume * 1.4,
          now + 6,
        );
      }

      this._isPlaying = true;
      this.currentMood = mood;
    });
  }

  stop(): void {
    if (!this._isPlaying) return;
    this.stopOscillators();
    this._isPlaying = false;
    this.currentMood = null;
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      const config = this.currentMood ? MOOD_CONFIGS[this.currentMood] : null;
      const baseGain = config ? config.baseGain : 0.06;
      this.masterGain.gain.setTargetAtTime(
        baseGain * this._volume,
        this.ctx.currentTime,
        0.1,
      );
    }
  }

  fadeOut(durationMs: number): void {
    if (!this._isPlaying || !this.masterGain || !this.ctx) return;

    const durationSec = durationMs / 1000;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(0, now, durationSec / 4);

    this.fadeTimeoutId = setTimeout(() => {
      this.stop();
      this.fadeTimeoutId = null;
    }, durationMs + 200);
  }

  isPlaying(): boolean {
    return this._isPlaying;
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        /* ignore */
      }
      this.ctx = null;
    }
  }
}
