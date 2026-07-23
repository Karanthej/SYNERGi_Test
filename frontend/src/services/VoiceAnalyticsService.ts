import { apiClient } from '../lib/apiClient';

export interface CallAnalytics {
  averageRtt: number;
  maxRtt: number;
  averageJitter: number;
  maxJitter: number;
  averagePacketLoss: number;
  maxPacketLoss: number;
  averageBitrate: number;
  minBitrate: number;
  maxBitrate: number;
  iceRestarts: number;
  reconnections: number;
  turnUsed: boolean;
  stunUsed: boolean;
  selectedCandidateType: string;
  muteCount: number;
  deviceChanges: number;
  audioConstraintSupported: boolean;
  micPermissionFailures: number;
  browser: string;
  os: string;
  cpuUsage: number;
  memoryUsage: number;
}

export class VoiceAnalyticsService {
  private callId: string | null = null;
  private workspaceId: string | null = null;
  private hasFlushed: boolean = false;
  
  private metrics = {
    rtts: [] as number[],
    jitters: [] as number[],
    packetLosses: [] as number[],
    bitrates: [] as number[],
    iceRestarts: 0,
    reconnections: 0,
    turnUsed: false,
    stunUsed: false,
    selectedCandidateType: '',
    muteCount: 0,
    deviceChanges: 0,
    audioConstraintSupported: false,
    micPermissionFailures: 0,
    browser: '',
    os: '',
  };

  private prevIceState: string = 'new';

  constructor() {
    this.metrics.audioConstraintSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints().echoCancellation);
    this.metrics.browser = this.getBrowser();
    this.metrics.os = this.getOS();
  }

  public initialize(callId: string, workspaceId: string) {
    this.callId = callId;
    this.workspaceId = workspaceId;
  }

  public recordStats(rtt: number, jitter: number, packetLoss: number, bitrate: number) {
    if (rtt > 0) this.metrics.rtts.push(rtt);
    if (jitter > 0) this.metrics.jitters.push(jitter);
    if (packetLoss > 0) this.metrics.packetLosses.push(packetLoss);
    if (bitrate > 0) this.metrics.bitrates.push(bitrate);
  }

  public recordIceState(state: string) {
    if (this.prevIceState === 'connected' && (state === 'disconnected' || state === 'failed')) {
      this.metrics.iceRestarts++;
    }
    if ((this.prevIceState === 'disconnected' || this.prevIceState === 'failed') && state === 'connected') {
      this.metrics.reconnections++;
    }
    this.prevIceState = state;
  }

  public recordCandidateType(type: string) {
    this.metrics.selectedCandidateType = type;
    if (type === 'relay') this.metrics.turnUsed = true;
    if (type === 'srflx' || type === 'prflx') this.metrics.stunUsed = true;
  }

  public recordMute() {
    this.metrics.muteCount++;
  }

  public recordDeviceChange() {
    this.metrics.deviceChanges++;
  }

  public recordMicPermissionFailure() {
    this.metrics.micPermissionFailures++;
  }

  private calculateAverage(arr: number[]): number {
    return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private calculateMax(arr: number[]): number {
    return arr.length === 0 ? 0 : Math.max(...arr);
  }

  private calculateMin(arr: number[]): number {
    return arr.length === 0 ? 0 : Math.min(...arr);
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('like Mac')) return 'iOS';
    return 'Unknown';
  }

  public async flush() {
    if (!this.callId || !this.workspaceId || this.hasFlushed) return;
    this.hasFlushed = true;

    const memory = (performance as any).memory;
    
    const payload: CallAnalytics = {
      averageRtt: this.calculateAverage(this.metrics.rtts),
      maxRtt: this.calculateMax(this.metrics.rtts),
      averageJitter: this.calculateAverage(this.metrics.jitters),
      maxJitter: this.calculateMax(this.metrics.jitters),
      averagePacketLoss: this.calculateAverage(this.metrics.packetLosses),
      maxPacketLoss: this.calculateMax(this.metrics.packetLosses),
      averageBitrate: this.calculateAverage(this.metrics.bitrates),
      minBitrate: this.calculateMin(this.metrics.bitrates),
      maxBitrate: this.calculateMax(this.metrics.bitrates),
      iceRestarts: this.metrics.iceRestarts,
      reconnections: this.metrics.reconnections,
      turnUsed: this.metrics.turnUsed,
      stunUsed: this.metrics.stunUsed,
      selectedCandidateType: this.metrics.selectedCandidateType,
      muteCount: this.metrics.muteCount,
      deviceChanges: this.metrics.deviceChanges,
      audioConstraintSupported: this.metrics.audioConstraintSupported,
      micPermissionFailures: this.metrics.micPermissionFailures,
      browser: this.metrics.browser,
      os: this.metrics.os,
      cpuUsage: 0, // Not available in standard web APIs
      memoryUsage: memory ? memory.usedJSHeapSize / (1024 * 1024) : 0,
    };

    try {
      // Fire and forget, but delay slightly to let backend websocket save the CallLog first
      setTimeout(async () => {
        try {
          await apiClient.post(`/workspaces/${this.workspaceId}/calls/${this.callId}/analytics`, payload);
        } catch (e) {
          console.warn('Failed to save call analytics', e);
        }
      }, 2000);
    } catch (e) {
      console.warn('Failed to save call analytics', e);
    }
  }
}
