export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Sound Engine Node Handles
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  private radioInterval: number | null = null;
  private radioPlaying: boolean = false;

  private lastFootstepTime: number = 0;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public resumeContext(): void {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public playClick(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playCoin(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    
    // Play double bell chime
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.3, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  public playFootstep(speed: number): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = performance.now();
    const interval = speed > 6 ? 280 : 420;
    if (now - this.lastFootstepTime < interval) return;
    this.lastFootstepTime = now;

    const audioNow = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400 + Math.random() * 200, audioNow);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, audioNow);
    gain.gain.exponentialRampToValueAtTime(0.001, audioNow + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(audioNow);
  }

  public playHorn(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    [370, 440].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  /**
   * Authentic Kenyan Matatu quick rhythmic double-honk ("beep-beep!")
   */
  public playMatatuDoubleHorn(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const baseNow = this.ctx.currentTime;
    const pulses = [0, 0.16]; // Two quick staccato pulses

    pulses.forEach((offset) => {
      [420, 520].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, baseNow + offset);

        gain.gain.setValueAtTime(0.22, baseNow + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, baseNow + offset + 0.11);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(baseNow + offset);
        osc.stop(baseNow + offset + 0.11);
      });
    });
  }

  /**
   * Sound effect for matatu pneumatic or sliding passenger door.
   */
  public playMatatuDoorChime(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Conductor / Tout calling sound notification.
   */
  public playToutCallout(_phrase?: string): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    [659.25, 523.25].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.12);
    });
  }

  /**
   * Conductor / Makanga metal panel or roof slap ("kpa! kpa!") signaling driver.
   */
  public playConductorPanelSlap(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    // Double percussive slap
    [0.0, 0.12].forEach((offset) => {
      const slapNow = now + offset;
      const bufferSize = Math.floor(this.ctx!.sampleRate * 0.05);
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, slapNow);
      filter.Q.setValueAtTime(3.0, slapNow);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.4, slapNow);
      gain.gain.exponentialRampToValueAtTime(0.001, slapNow + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      noise.start(slapNow);
    });
  }

  /**
   * Commuter gasp / screech when vehicle encounters sudden collision or curb mount.
   */
  public playPassengerGasp(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.25);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Sacco specific horn style (double tap, musical 3-tone melody, or standard blast).
   */
  public playSaccoHorn(style: 'double_tap' | 'musical' | 'standard' = 'double_tap'): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    if (style === 'musical') {
      // Ngong 126 Manyanga melodic triple chime
      const tones = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      tones.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.14);
      });
    } else if (style === 'double_tap') {
      this.playMatatuDoubleHorn();
    } else {
      // Standard heavy city bus horn
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  }

  public startEngine(): void {
    if (this.engineOsc || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, now);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(250, now);

      this.engineGain.gain.setValueAtTime(0.15, now);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain!);

      this.engineOsc.start(now);
    } catch (e) {
      console.warn('Engine audio error:', e);
    }
  }

  public updateEngineRPM(speedKph: number, accelerating: boolean): void {
    if (!this.engineOsc || !this.engineFilter || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetFreq = 45 + Math.min(speedKph, 140) * 1.5 + (accelerating ? 30 : 0);
    const targetCutoff = 250 + Math.min(speedKph, 140) * 4 + (accelerating ? 200 : 0);

    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.1);
  }

  public stopEngine(): void {
    if (this.engineOsc && this.ctx) {
      try {
        this.engineOsc.stop(this.ctx.currentTime);
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
      this.engineGain = null;
      this.engineFilter = null;
    }
  }

  public setMatatuRadio(enabled: boolean): void {
    if (enabled === this.radioPlaying) return;
    this.radioPlaying = enabled;

    if (enabled) {
      if (!this.ctx) return;
      let step = 0;
      const notes = [110, 130.81, 146.83, 164.81, 110, 146.83, 130.81, 98];
      this.radioInterval = window.setInterval(() => {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const freq = notes[step % notes.length];
        step++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 0.18);
      }, 200);
    } else {
      if (this.radioInterval !== null) {
        clearInterval(this.radioInterval);
        this.radioInterval = null;
      }
    }
  }
}
