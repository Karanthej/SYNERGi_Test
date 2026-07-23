class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private currentLoop: HTMLAudioElement | null = null;
  private isMuted: boolean = false; // Add ability to completely mute if needed

  private constructor() {
    // Preload all audio assets
    this.preload('incoming', '/sounds/incoming.wav');
    this.preload('outgoing', '/sounds/outgoing.wav');
    this.preload('connected', '/sounds/connected.wav');
    this.preload('ended', '/sounds/ended.wav');
    this.preload('busy', '/sounds/busy.wav');
    this.preload('missed', '/sounds/missed.wav');
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private preload(name: string, src: string) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    this.sounds.set(name, audio);
  }

  public playIncoming() {
    this.playLoop('incoming');
  }

  public playOutgoing() {
    this.playLoop('outgoing');
  }

  public playConnected() {
    this.playOnce('connected');
  }

  public playEnded() {
    this.playOnce('ended');
  }

  public playBusy() {
    this.playOnce('busy');
  }

  public playMissed() {
    this.playOnce('missed');
  }

  private playLoop(name: string) {
    if (this.isMuted) return;
    this.stop(); // Stop any currently playing audio

    const audio = this.sounds.get(name);
    if (audio) {
      audio.loop = true;
      audio.currentTime = 0;
      // Catch DOMException to avoid unhandled promise rejections due to Autoplay policies
      audio.play().catch(e => console.warn(`[AudioManager] Blocked by autoplay policy for ${name}:`, e));
      this.currentLoop = audio;
    }
  }

  private playOnce(name: string) {
    if (this.isMuted) return;
    this.stop(); // Cleanly stop looping tones before playing a one-shot tone

    const audio = this.sounds.get(name);
    if (audio) {
      audio.loop = false;
      audio.currentTime = 0;
      audio.play().catch(e => console.warn(`[AudioManager] Blocked by autoplay policy for ${name}:`, e));
    }
  }

  public stop() {
    if (this.currentLoop) {
      this.currentLoop.pause();
      this.currentLoop.currentTime = 0;
      this.currentLoop = null;
    }
    // As a fail-safe, pause all managed sounds
    this.sounds.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }
}

export default AudioManager.getInstance();
