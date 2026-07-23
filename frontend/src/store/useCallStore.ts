import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CallState, CallPeer } from '@/hooks/useVoiceCall';

export interface NetworkStats {
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  rtt: number;
  jitter: number;
  packetLoss: number;
  bitrate: number;
  relayUsed: boolean;
}

export interface WebRTCDiagnostics {
  iceConnectionState: string;
  peerConnectionState: string;
  selectedCandidatePair: string;
  relayUsed: boolean;
  rtt: number;
  packetLoss: number;
  jitter: number;
  bitrate: number;
  codec: string;
  audioLevel: number;
}

interface CallStore {
  callState: CallState;
  activeCallId: string | null;
  activePeer: CallPeer | null;
  activeWorkspaceId: string | null;
  activeWorkspaceName: string | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isRemoteMuted: boolean;
  isOnHold: boolean;
  isSpeakerOn: boolean;
  callStartTime: number | null;
  isCaller: boolean;
  isPoorConnection: boolean;
  networkStats: NetworkStats | null;
  selectedMicrophoneId: string | null;
  selectedSpeakerId: string | null;

  // UI State
  uiMode: 'docked' | 'center_popup' | 'mini_floating' | 'hidden';
  isChatSidebarAvailable: boolean;
  isManuallyMinimized: boolean;
  waitingCallSignal: any | null;
  hasHeldCall: boolean;
  miniFloatingPosition: { x: number, y: number } | null;
  
  isDiagnosticsOpen: boolean;
  diagnostics: WebRTCDiagnostics | null;

  // Actions (set by GlobalCallProvider)
  initiateCall: ((peer: CallPeer, workspaceId: string, workspaceName?: string) => void) | null;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  initiateCallByUsername: ((username: string, workspaceId: string) => Promise<boolean>) | null;
  toggleMute: (() => void) | null;
  toggleHold: (() => void) | null;
  toggleSpeaker: (() => void) | null;

  setUIMode: (mode: 'docked' | 'center_popup' | 'mini_floating' | 'hidden') => void;
  setChatSidebarAvailable: (available: boolean) => void;
  setManuallyMinimized: (minimized: boolean) => void;
  setWaitingCallSignal: (signal: any | null) => void;
  setMiniFloatingPosition: (pos: { x: number, y: number } | null) => void;
  setDiagnosticsOpen: (open: boolean) => void;

  switchMicrophone: ((deviceId: string) => Promise<void>) | null;
  switchSpeaker: (deviceId: string) => void;

  _set: (patch: Partial<Omit<CallStore, '_set'>>) => void;
}

export const useCallStore = create<CallStore>()(
  persist(
    (set) => ({
      callState: 'IDLE',
      activeCallId: null,
      activePeer: null,
  activeWorkspaceId: null,
  activeWorkspaceName: null,
  remoteStream: null,
  isMuted: false,
  isRemoteMuted: false,
  isOnHold: false,
  isSpeakerOn: true,
  callStartTime: null,
  isCaller: false,
  isPoorConnection: false,
  networkStats: null,
  selectedMicrophoneId: localStorage.getItem('selectedMicrophoneId'),
  selectedSpeakerId: localStorage.getItem('selectedSpeakerId'),

  uiMode: 'hidden',
  isChatSidebarAvailable: false,
  isManuallyMinimized: false,
  waitingCallSignal: null,
  hasHeldCall: false,
  miniFloatingPosition: null,
  isDiagnosticsOpen: false,
  diagnostics: null,

  initiateCall: null,
  answerCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  initiateCallByUsername: null,
  toggleMute: null,
  toggleHold: null,
  toggleSpeaker: null,

  setUIMode: (mode) => set({ uiMode: mode }),
  setChatSidebarAvailable: (available) => set({ isChatSidebarAvailable: available }),
  setManuallyMinimized: (minimized) => set({ isManuallyMinimized: minimized }),
  setWaitingCallSignal: (signal) => set({ waitingCallSignal: signal }),
  setMiniFloatingPosition: (pos) => set({ miniFloatingPosition: pos }),
  setDiagnosticsOpen: (open) => set({ isDiagnosticsOpen: open }),

  switchMicrophone: null,
  switchSpeaker: (deviceId: string) => {
    localStorage.setItem('selectedSpeakerId', deviceId);
    set({ selectedSpeakerId: deviceId });
  },

  _set: (patch) => set((s) => ({ ...s, ...patch })),
    }),
    {
      name: 'call-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        callState: state.callState,
        activeCallId: state.activeCallId,
        activePeer: state.activePeer,
        activeWorkspaceId: state.activeWorkspaceId,
        activeWorkspaceName: state.activeWorkspaceName,
        callStartTime: state.callStartTime,
        isCaller: state.isCaller,
        uiMode: state.uiMode,
        isManuallyMinimized: state.isManuallyMinimized,
        miniFloatingPosition: state.miniFloatingPosition
      }),
    }
  )
);
