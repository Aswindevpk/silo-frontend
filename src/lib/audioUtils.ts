class SyntheticRingtone {
  private audioCtx: AudioContext | null = null;
  private oscillator1: OscillatorNode | null = null;
  private oscillator2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private type: 'incoming' | 'outgoing' = 'incoming';

  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(duration: number) {
    if (!this.audioCtx) return;
    
    // Telephone frequencies (US Standard: 440Hz + 480Hz)
    this.oscillator1 = this.audioCtx.createOscillator();
    this.oscillator2 = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    this.oscillator1.type = 'sine';
    this.oscillator1.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    
    this.oscillator2.type = 'sine';
    this.oscillator2.frequency.setValueAtTime(480, this.audioCtx.currentTime);

    const volume = this.type === 'incoming' ? 0.3 : 0.05; // Outgoing ringback is quieter

    this.gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    // Envelope to avoid clicks
    this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime + duration - 0.1, 0.05);

    this.oscillator1.connect(this.gainNode);
    this.oscillator2.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.oscillator1.start();
    this.oscillator2.start();

    setTimeout(() => {
      if (this.oscillator1) {
        this.oscillator1.stop();
        this.oscillator1.disconnect();
      }
      if (this.oscillator2) {
        this.oscillator2.stop();
        this.oscillator2.disconnect();
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
      }
    }, duration * 1000);
  }

  public start(type: 'incoming' | 'outgoing' = 'incoming') {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.type = type;
    this.initAudio();
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }

    const playCadence = () => {
      // Standard US cadence: 2s on, 4s off. UK cadence: 0.4s on, 0.2s off, 0.4s on, 2s off.
      // We'll use a simple 1.5s on, 2.5s off
      this.playTone(1.5);
    };

    playCadence();
    this.intervalId = setInterval(playCadence, 4000);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.oscillator1) {
      try { this.oscillator1.stop(); } catch (e) {}
    }
    if (this.oscillator2) {
      try { this.oscillator2.stop(); } catch (e) {}
    }
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend();
    }
  }
}

export const ringtoneManager = new SyntheticRingtone();
