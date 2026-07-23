import { useNotificationStore } from '@/store/useNotificationStore';

class AudioEngineClass {
  private context: AudioContext | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;

  private init() {
    try {
      if (!this.context) {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.context.state === 'suspended') {
        this.context.resume().catch(e => console.warn("Audio resume failed", e));
      }
    } catch (e) {
      console.warn("AudioContext init failed", e);
    }
    
    // Clear any pending suspend timer
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
  }

  private scheduleSuspend() {
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
    }
    this.suspendTimer = setTimeout(() => {
      if (this.context && this.context.state === 'running') {
        this.context.suspend();
      }
    }, 2000); // Suspend after 2 seconds of inactivity
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number) {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    
    gain.gain.setValueAtTime(vol, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  public playMessageSound() {
    if (useNotificationStore.getState().dndMode) return;
    this.init();
    this.playTone(600, 'sine', 0.1, 0.1);
    this.scheduleSuspend();
  }

  public playMentionSound() {
    if (useNotificationStore.getState().dndMode) return;
    this.init();
    this.playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(1000, 'sine', 0.15, 0.1), 100);
    this.scheduleSuspend();
  }

  public playCallRing() {
    if (useNotificationStore.getState().dndMode) return;
    this.init();
    // A simple trill
    const playRing = () => {
        this.playTone(440, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(480, 'sine', 0.1, 0.1), 100);
    };
    playRing();
    setTimeout(playRing, 400);
    this.scheduleSuspend();
  }
}

export const AudioEngine = new AudioEngineClass();
