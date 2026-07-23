/**
 * GlobalCallProvider
 * Mounts useVoiceCall ONCE at the app root and syncs all state into useCallStore.
 * Every component (TeamChat, IncomingCallBanner, etc.) reads from useCallStore
 * so there is a single source of truth for the call system.
 */
import { useEffect, useRef } from 'react';
import { useVoiceCall } from '@/hooks/useVoiceCall';
import { useCallStore } from '@/store/useCallStore';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import WebRTCDiagnosticsPanel from './WebRTCDiagnosticsPanel';

export function GlobalCallProvider({ children }: { children: React.ReactNode }) {
  const voice = useVoiceCall();
  const _set = useCallStore((s) => s._set);
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();
  const selectedSpeakerId = useCallStore(s => s.selectedSpeakerId);
  const isChatSidebarAvailable = useCallStore(s => s.isChatSidebarAvailable);
  const isOnThisWorkspaceChat = Boolean(
    voice.activeWorkspaceId &&
    location.pathname.includes(`/workspace/${voice.activeWorkspaceId}`) &&
    isChatSidebarAvailable
  );

  useEffect(() => {
    if (audioRef.current && voice.remoteStream) {
      audioRef.current.srcObject = voice.remoteStream;
      audioRef.current.play().catch((e) => console.warn('Audio play failed:', e));
    }
  }, [voice.remoteStream, voice.callState]);

  useEffect(() => {
    if (audioRef.current) {
      if (voice.isSpeakerOn) {
         audioRef.current.volume = 1;
         // Note: setSinkId requires permissions and HTTPS in most browsers
         if ('setSinkId' in HTMLAudioElement.prototype) {
             (audioRef.current as any).setSinkId('default').catch((e: any) => console.log('Sink ID not supported or permitted', e));
         }
      } else {
         audioRef.current.volume = 0;
      }
    }
  }, [voice.isSpeakerOn]);

  useEffect(() => {
    _set({
      callState: voice.callState,
      activeCallId: voice.activeCallId as any, // Type cast in case of mismatch
      activePeer: voice.activePeer,
      activeWorkspaceId: voice.activeWorkspaceId,
      activeWorkspaceName: voice.activeWorkspaceName,
      remoteStream: voice.remoteStream,
      isMuted: voice.isMuted,
      isRemoteMuted: voice.isRemoteMuted,
      isOnHold: voice.isOnHold,
      isSpeakerOn: voice.isSpeakerOn,
      isCaller: voice.isCaller,
      initiateCall: voice.initiateCall,
      initiateCallByUsername: voice.initiateCallByUsername,
      answerCall: () => {
        voice.answerCall?.();
      },
      rejectCall: voice.rejectCall,
      endCall: voice.endCall,
      toggleMute: voice.toggleMute,
      toggleHold: voice.toggleHold,
      toggleSpeaker: voice.toggleSpeaker,
    });
  }, [
    voice.callState,
    voice.activeCallId,
    voice.activePeer,
    voice.activeWorkspaceId,
    voice.activeWorkspaceName,
    voice.remoteStream,
    voice.isMuted,
    voice.isRemoteMuted,
    voice.isOnHold,
    voice.isSpeakerOn,
    voice.isCaller,
    voice.initiateCall,
    voice.initiateCallByUsername,
    voice.answerCall,
    voice.rejectCall,
    voice.endCall,
    voice.toggleMute,
    voice.toggleHold,
    voice.toggleSpeaker,
    _set,
    isOnThisWorkspaceChat
  ]);

  // Keyboard Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voice.callState === 'RINGING') {
        if (e.key === 'Enter') {
          voice.answerCall?.();
        } else if (e.key === 'Escape') {
          voice.rejectCall?.();
        }
      } else if (voice.callState === 'CONNECTED' && e.key === 'Escape') {
        useCallStore.getState().setManuallyMinimized(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voice.callState, voice.answerCall, voice.rejectCall]);

  // Handle waiting calls & missed calls
  useEffect(() => {
    const handleWaiting = (e: any) => {
      const signal = e.detail;
      useCallStore.getState().setWaitingCallSignal(signal);
    };
    window.addEventListener('call-waiting', handleWaiting);

    const handleMissed = (e: any) => {
      const { peer, workspaceId, workspaceName } = e.detail;
      toast.error(`Missed Call: ${peer.name || 'Unknown'}`, {
        description: 'Tap to call them back.',
        duration: Infinity,
        action: {
          label: 'Call Back',
          onClick: () => {
             if (voice.initiateCall) {
                voice.initiateCall(peer, workspaceId, workspaceName);
             }
          }
        },
        cancel: {
          label: 'Dismiss',
          onClick: () => {}
        }
      });
    };
    window.addEventListener('missed-call', handleMissed);

    return () => {
       window.removeEventListener('call-waiting', handleWaiting);
       window.removeEventListener('missed-call', handleMissed);
    };
  }, [voice]);

  // ── SET SINK ID (SPEAKER SELECTION) ──
  useEffect(() => {
    if (audioRef.current && selectedSpeakerId) {
      if ('setSinkId' in HTMLMediaElement.prototype) {
        (audioRef.current as any).setSinkId(selectedSpeakerId).catch((err: any) => {
           console.error("Failed to set speaker", err);
        });
      }
    }
  }, [selectedSpeakerId, voice.remoteStream]);

  // ── UI BRAIN: Automatic Call Presentation Transitions ──
  const uiMode = useCallStore(s => s.uiMode);
  const isManuallyMinimized = useCallStore(s => s.isManuallyMinimized);
  const setUIMode = useCallStore(s => s.setUIMode);
  


  useEffect(() => {
    // Hidden states
    if (voice.callState === 'IDLE') {
        window.dispatchEvent(new Event('expand-workspace-sidebar'));
        if (uiMode !== 'hidden') setUIMode('hidden');
        return;
    }

    if (isManuallyMinimized) {
        window.dispatchEvent(new Event('expand-workspace-sidebar'));
        if (uiMode !== 'mini_floating') setUIMode('mini_floating');
        return;
    }

    // Connected or ringing states
    const isActiveCall = ['CONNECTED', 'ICE_CONNECTED', 'NEGOTIATING', 'ICE_GATHERING', 'CONNECTING', 'ON_HOLD', 'MUTED'].includes(voice.callState);
    const isRinging = ['RINGING', 'WAITING', 'INITIATED', 'BUSY'].includes(voice.callState);

    if (isOnThisWorkspaceChat) {
        // Same workspace and in Team Chat -> Always Docked
        window.dispatchEvent(new Event('minimize-workspace-sidebar'));
        if (uiMode !== 'docked') setUIMode('docked');
    } else {
        window.dispatchEvent(new Event('expand-workspace-sidebar'));
        if (isActiveCall) {
            // User navigated away during an active call
            if (uiMode !== 'mini_floating') setUIMode('mini_floating');
        } else if (isRinging) {
            if (voice.isCaller) {
                if (uiMode !== 'mini_floating') setUIMode('mini_floating');
            } else {
                if (uiMode !== 'center_popup') setUIMode('center_popup');
            }
        }
    }
  }, [voice.callState, isOnThisWorkspaceChat, isManuallyMinimized, uiMode, setUIMode]);

  return (
    <>
      {/* Audio element for remote stream */}
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      {children}
      <WebRTCDiagnosticsPanel />
    </>
  );
}
