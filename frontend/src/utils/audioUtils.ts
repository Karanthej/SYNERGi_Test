export const playNotificationSound = (type: string, suppressSound: boolean) => {
    if (suppressSound) return;

    // Use Web Audio API to synthesize sounds since we don't have static files
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        
        const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, vol = 0.1) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
            
            gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + startTime);
            osc.stop(ctx.currentTime + startTime + duration);
        };

        // Distinct patterns based on notification type
        switch(type) {
            case 'CHAT':
            case 'GROUP_CHAT':
            case 'REPLY':
                // Short double pop (modern messaging app style)
                playTone(600, 'sine', 0.1, 0, 0.15);
                playTone(800, 'sine', 0.15, 0.1, 0.15);
                break;
            case 'MENTION':
                // Higher pitched triplet for attention
                playTone(800, 'sine', 0.1, 0, 0.1);
                playTone(1000, 'sine', 0.1, 0.1, 0.1);
                playTone(1200, 'sine', 0.2, 0.2, 0.1);
                break;
            case 'MEETING':
                // Elegant chime (bell-like)
                playTone(500, 'triangle', 0.4, 0, 0.2);
                playTone(750, 'triangle', 0.6, 0.1, 0.15);
                break;
            case 'TASK':
                // Crisp click-clack
                playTone(900, 'square', 0.05, 0, 0.05);
                playTone(600, 'square', 0.1, 0.05, 0.05);
                break;
            default:
                // Generic single soft ping
                playTone(700, 'sine', 0.3, 0, 0.1);
                break;
        }
        
    } catch (e) {
        // Audio might be blocked by browser policy without user interaction
        console.warn('Audio playback failed or blocked:', e);
    }
};
