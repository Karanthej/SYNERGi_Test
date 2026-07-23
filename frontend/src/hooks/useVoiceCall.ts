// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { callSignalEmitter } from '@/utils/callSignalEmitter';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import AudioManager from '@/services/AudioManager';
import { VoiceAnalyticsService } from '@/services/VoiceAnalyticsService';
import { apiClient } from '@/lib/apiClient';

export type CallState = 'IDLE' | 'INITIATED' | 'RINGING' | 'WAITING' | 'ACCEPTED' | 'CONNECTING' | 'NEGOTIATING' | 'ICE_GATHERING' | 'ICE_CONNECTED' | 'CONNECTED' | 'ON_HOLD' | 'MUTED' | 'RECONNECTING' | 'BUSY' | 'REJECTED' | 'CANCELLED' | 'FAILED' | 'TIMEOUT' | 'ENDED' | 'MISSED';

export interface CallPeer {
  uuid: string;
  name: string;
  username?: string;
  profileUrl?: string;
}

const getEnhancedAudioConstraints = (deviceId?: string | null): boolean | MediaTrackConstraints => {
  const supported = navigator.mediaDevices.getSupportedConstraints();
  const constraints: MediaTrackConstraints = {};

  if (deviceId) {
    constraints.deviceId = { exact: deviceId };
  }

  if (supported.echoCancellation) constraints.echoCancellation = true;
  if (supported.noiseSuppression) constraints.noiseSuppression = true;
  if (supported.autoGainControl) constraints.autoGainControl = true;

  return Object.keys(constraints).length > 0 ? constraints : true;
};

let STUN_SERVERS: RTCConfiguration = {
  iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:standard.relay.metered.ca:80",
        username: "8e6beb8233ee81bad36c909a",
        credential: "alhUb/goFjH3/nJ0",
      },
      {
        urls: "turn:standard.relay.metered.ca:80?transport=tcp",
        username: "8e6beb8233ee81bad36c909a",
        credential: "alhUb/goFjH3/nJ0",
      },
      {
        urls: "turn:standard.relay.metered.ca:443",
        username: "8e6beb8233ee81bad36c909a",
        credential: "alhUb/goFjH3/nJ0",
      },
      {
        urls: "turns:standard.relay.metered.ca:443?transport=tcp",
        username: "8e6beb8233ee81bad36c909a",
        credential: "alhUb/goFjH3/nJ0",
      },
  ]
};

fetch("https://synergi.metered.live/api/v1/turn/credentials?apiKey=7add7bfd4d27fe8f77b660f0c1a0fe16b736")
  .then(res => res.json())
  .then(iceServers => {
    if (iceServers && iceServers.length > 0) {
      STUN_SERVERS = { iceServers };
    }
  })
  .catch(err => {
    console.warn("Failed to fetch dynamic TURN credentials, using fallback config", err);
  });

export const CALL_TIMEOUT_MS = 30000;

export function useVoiceCall() {
  const { user } = useAuthStore();
  const { sendCallSignal } = useWebSocket();
  
  const [callState, _setCallState] = useState<CallState>('IDLE');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<CallPeer | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Mutable refs to avoid event listener remounting
  const callStateRef = useRef<CallState>('IDLE');
  const activeCallIdRef = useRef<string | null>(null);
  const isCallerRef = useRef<boolean>(false);
  const activePeerRef = useRef<CallPeer | null>(null);
  const activeWorkspaceIdRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBytesRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const analyticsRef = useRef<VoiceAnalyticsService>(new VoiceAnalyticsService());
  
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescSet = useRef<boolean>(false);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceCountersRef = useRef({ generated: 0, sent: 0, received: 0, queued: 0, applied: 0 });
  const incomingQueueRef = useRef<any[]>([]);
  const heldCallRef = useRef<any>(null);

  const debugLog = useCallback((event: string, nextState?: string, extra?: any) => {
      console.log(
        `%c[VOICE_DEBUG] %c${event}`, 
        'color: #00ff00; font-weight: bold;', 
        'color: #ffffff; font-weight: bold;'
      );
      console.log(`CallID: ${activeCallIdRef.current || 'N/A'}`);
      console.log(`WorkspaceID: ${activeWorkspaceIdRef.current || 'N/A'}`);
      console.log(`Role: ${isCallerRef.current ? 'CALLER' : 'RECEIVER'}`);
      console.log(`Receiver Peer: ${activePeerRef.current ? activePeerRef.current.uuid : 'N/A'}`);
      console.log(`Current State: ${callStateRef.current}`);
      if (nextState) console.log(`Next State: ${nextState}`);
      if (pcRef.current) {
          console.log(`Peer State: ${pcRef.current.connectionState}`);
          console.log(`ICE State: ${pcRef.current.iceConnectionState}`);
          console.log(`Signaling State: ${pcRef.current.signalingState}`);
      }
      console.log(`localStream exists? ${!!localStreamRef.current}`);
      if (localStreamRef.current) {
          const tracks = localStreamRef.current.getAudioTracks();
          console.log(`local audio track count: ${tracks.length}`);
          tracks.forEach((t, i) => console.log(`  Track ${i}: readyState=${t.readyState}, enabled=${t.enabled}, muted=${t.muted}`));
      }
      console.log(`remoteStream exists? ${!!remoteStreamRef.current}`);
      if (remoteStreamRef.current) {
          console.log(`remote audio track count: ${remoteStreamRef.current.getAudioTracks().length}`);
      }
      console.log(`ICE Candidates - Generated: ${iceCountersRef.current.generated}, Sent: ${iceCountersRef.current.sent}, Received: ${iceCountersRef.current.received}, Queued: ${iceCountersRef.current.queued}, Applied: ${iceCountersRef.current.applied}`);
      if (extra) console.log('Extra Details:', extra);
      console.log('--------------------------------------------------');
  }, []);

  const setCallState = useCallback((state: CallState) => {
    debugLog(`State Transition: ${callStateRef.current} -> ${state}`, state);
    callStateRef.current = state;
    _setCallState(state);
    
    // Handle Audio Integration
    if (state === 'RINGING') {
        if (!isCallerRef.current) AudioManager.playIncoming();
    } else if (state === 'INITIATED') {
        if (isCallerRef.current) AudioManager.playOutgoing();
    } else if (state === 'CONNECTED') {
        AudioManager.playConnected();
    } else if (['ENDED', 'CANCELLED'].includes(state)) {
        AudioManager.playEnded();
    } else if (state === 'REJECTED' || state === 'BUSY') {
        AudioManager.playBusy();
    } else if (state === 'MISSED') {
        AudioManager.playMissed();
    } else if (state === 'IDLE') {
        AudioManager.stop();
    }

    if (state === 'CONNECTING' || state === 'ACCEPTED') {
        AudioManager.stop();
    }
  }, [debugLog]);

  const cleanup = useCallback(() => {
    debugLog("Cleaning up resources");
    AudioManager.stop();
    analyticsRef.current.flush();
    
    if ('serviceWorker' in navigator && activeCallIdRef.current) {
        navigator.serviceWorker.controller?.postMessage({
            type: 'CLOSE_NOTIFICATION',
            callId: activeCallIdRef.current
        });
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    useCallStore.getState()._set({ callStartTime: null, isPoorConnection: false, networkStats: null });
    reconnectAttemptsRef.current = 0;
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setLocalStream(prev => {
      prev?.getTracks().forEach(track => track.stop());
      return null;
    });
    localStreamRef.current = null;

    setRemoteStream(prev => {
      prev?.getTracks().forEach(track => track.stop());
      return null;
    });
    remoteStreamRef.current = null;
    setIsMuted(false);
    setIsRemoteMuted(false);
    setIsOnHold(false);
    setIsSpeakerOn(true);
    iceCandidateQueue.current = [];
    isRemoteDescSet.current = false;
    
    // Safety cleanup of potential dangling waiting call events
    window.removeEventListener('accept-hold-waiting-call', () => {});
    window.removeEventListener('end-accept-waiting-call', () => {});
    window.removeEventListener('reject-waiting-call', () => {});
  }, [debugLog]);

  const processNextInQueue = useCallback(() => {
    if (heldCallRef.current) {
      // Restore held call
      const held = heldCallRef.current;
      pcRef.current = held.pc;
      setActivePeer(held.peer);
      activePeerRef.current = held.peer;
      setActiveWorkspaceId(held.workspaceId);
      activeWorkspaceIdRef.current = held.workspaceId;
      setActiveWorkspaceName(held.workspaceName);
      setActiveCallId(held.callId);
      activeCallIdRef.current = held.callId;
      setLocalStream(held.localStream);
      localStreamRef.current = held.localStream;
      setRemoteStream(held.remoteStream);
      remoteStreamRef.current = held.remoteStream;
      useCallStore.getState()._set({ callStartTime: held.startTime, hasHeldCall: false });
      setCallState('CONNECTED');
      // Tell backend that we are unmuted/unheld
      emitSignal('CALL_STATE_UPDATE', { isMuted: false, isOnHold: false }, held.callId);
      heldCallRef.current = null;
      return;
    }
    
    if (incomingQueueRef.current.length > 0) {
      const nextSignal = incomingQueueRef.current.shift();
      handleIncomingRequest(nextSignal);
    } else {
      setCallState('IDLE');
      setActiveCallId(null);
      activeCallIdRef.current = null;
      setActivePeer(null);
      activePeerRef.current = null;
      setActiveWorkspaceId(null);
      activeWorkspaceIdRef.current = null;
      setActiveWorkspaceName(null);
      useCallStore.getState()._set({ callStartTime: null });
    }
  }, [setCallState]);

  const clearCall = useCallback(() => {
    analyticsRef.current.flush();
    processNextInQueue();
  }, [processNextInQueue]);

  useEffect(() => {
    syncChannelRef.current = new BroadcastChannel('synergi-call-sync');
    const handleSync = (e: MessageEvent) => {
      const data = e.data;
      if (data.type === 'TAB_HANDLED_CALL') {
        if (['RINGING', 'INITIATED', 'WAITING'].includes(callStateRef.current)) {
          setCallState('ENDED');
          cleanup();
          clearCallTimeoutRef.current = setTimeout(clearCall, 2000);
        }
      }
    };
    syncChannelRef.current.addEventListener('message', handleSync);
    return () => {
      syncChannelRef.current?.removeEventListener('message', handleSync);
      syncChannelRef.current?.close();
    };
  }, [setCallState, cleanup, clearCall]);

  const emitSignal = useCallback((type: string, payload?: any, callId?: string) => {
    if (!user || !activePeerRef.current || !activeWorkspaceIdRef.current) return;
    const cid = callId || activeCallIdRef.current;
    if (!cid) return;
    debugLog(`WebSocket Signal Emitted: ${type}`, undefined, {
      type,
      callId: cid,
      callerId: user.uuid,
      receiverId: activePeerRef.current.uuid,
      workspaceId: activeWorkspaceIdRef.current,
      payloadSize: payload ? JSON.stringify(payload).length : 0
    });
    
    sendCallSignal({
      type,
      callId: cid,
      callerId: user.uuid,
      receiverId: activePeerRef.current.uuid,
      workspaceId: activeWorkspaceIdRef.current,
      payload: payload ? JSON.stringify(payload) : undefined
    });
  }, [user, sendCallSignal, debugLog]);

  const endCall = useCallback(() => {
    if (['IDLE', 'ENDED', 'REJECTED', 'CANCELLED', 'MISSED', 'FAILED', 'TIMEOUT', 'BUSY'].includes(callStateRef.current)) return;
    
    emitSignal('CALL_END');
    setCallState('ENDED');
    syncChannelRef.current?.postMessage({ type: 'TAB_HANDLED_CALL' });
    cleanup();
    clearCallTimeoutRef.current = setTimeout(clearCall, 2000);
  }, [emitSignal, cleanup, clearCall, setCallState]);

  const rejectCall = useCallback(() => {
    emitSignal('CALL_REJECT');
    setCallState('REJECTED');
    syncChannelRef.current?.postMessage({ type: 'TAB_HANDLED_CALL' });
    cleanup();
    clearCallTimeoutRef.current = setTimeout(clearCall, 2000);
  }, [emitSignal, cleanup, clearCall, setCallState]);

  const initPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    console.log('[WebRTC Trace] 5. createPeerConnection()');
    pcRef.current = pc;
    isRemoteDescSet.current = false;
    
    if (activeCallIdRef.current && activeWorkspaceIdRef.current) {
        analyticsRef.current.initialize(activeCallIdRef.current, activeWorkspaceIdRef.current);
    }

    pc.onsignalingstatechange = () => {
       console.log(`[WebRTC Trace] 23. signalingState changes: ${pc.signalingState}`);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceCountersRef.current.generated++;
        console.log('[WebRTC Trace] 17. ICE candidate generated');
        emitSignal('ICE_CANDIDATE', event.candidate);
        console.log('[WebRTC Trace] 18. ICE candidate sent');
        iceCountersRef.current.sent++;
      }
    };

    pc.onicecandidateerror = (event: any) => {
      if (event.errorCode === 401) {
         debugLog("CRITICAL: TURN Authentication failed (Error 401). Invalid credentials.");
      } else {
         debugLog(`ICE Candidate Error: ${event.errorCode} ${event.errorText}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Trace] 22. iceConnectionState changes: ${pc.iceConnectionState}`);
      debugLog(`ICE Connection State Changed: ${pc.iceConnectionState}`);
      analyticsRef.current.recordIceState(pc.iceConnectionState);
      if (pc.iceConnectionState === 'checking') setCallState('ICE_GATHERING');
      else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') setCallState('ICE_CONNECTED');
      else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setCallState('RECONNECTING');
        
        // Exponential backoff network recovery logic
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        
        const attempt = reconnectAttemptsRef.current;
        if (attempt >= 6) {
             debugLog("Max reconnect attempts reached. Terminating call.");
             endCall();
             return;
        }

        if (attempt >= 3) {
             useCallStore.getState()._set({ isPoorConnection: true });
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // 1s, 2s, 4s, 8s, 10s...
        debugLog(`Scheduling ICE restart attempt ${attempt + 1} in ${delay}ms`);
        
        reconnectTimeoutRef.current = setTimeout(async () => {
           if (pcRef.current && (pcRef.current.iceConnectionState === 'disconnected' || pcRef.current.iceConnectionState === 'failed')) {
               try {
                  reconnectAttemptsRef.current++;
                  const offer = await pcRef.current.createOffer({ iceRestart: true });
                  await pcRef.current.setLocalDescription(offer);
                  emitSignal('SDP_OFFER', offer);
               } catch (err) {
                  debugLog("ICE restart failed to execute", undefined, err);
               }
           }
        }, delay);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Trace] 21. connectionState changes: ${pc.connectionState}`);
      debugLog(`Peer Connection State Changed: ${pc.connectionState}`);
      if (pc.connectionState === 'connecting') {
          setCallState('CONNECTING');
          emitSignal('CALL_STATE_UPDATE', { state: 'CONNECTING' });
      }
      else if (pc.connectionState === 'connected') {
        // Do not set call state or start timer here! 
        // Just emit the signal and let the backend dictate the transition.
        emitSignal('CALL_CONNECTED');
        if (!useCallStore.getState().callStartTime && callStateRef.current === 'CONNECTED') {
           useCallStore.getState()._set({ callStartTime: Date.now() });
        }
        useCallStore.getState()._set({ isPoorConnection: false });
        reconnectAttemptsRef.current = 0;

        if (!statsIntervalRef.current) {
           statsIntervalRef.current = setInterval(async () => {
              if (pc.connectionState !== 'connected') return;
              try {
                const stats = await pc.getStats();
                let rtt = 0, jitter = 0, packetLoss = 0, bitrate = 0;
                let relayUsed = false;
                let bytesReceived = 0;
                let timestamp = 0;

                stats.forEach((report) => {
                  if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
                    const localCandidate = stats.get(report.localCandidateId);
                    if (localCandidate && localCandidate.candidateType === 'relay') {
                       relayUsed = true;
                    }
                    if (localCandidate && localCandidate.candidateType) {
                       analyticsRef.current.recordCandidateType(localCandidate.candidateType);
                    }
                  }
                  if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                    jitter = report.jitter ? report.jitter * 1000 : 0;
                    const packetsLost = report.packetsLost || 0;
                    const packetsReceived = report.packetsReceived || 0;
                    if (packetsReceived + packetsLost > 0) {
                      packetLoss = (packetsLost / (packetsReceived + packetsLost)) * 100;
                    }
                    bytesReceived = report.bytesReceived || 0;
                    timestamp = report.timestamp;
                  }
                });

                analyticsRef.current.recordStats(rtt, jitter, packetLoss, bitrate);

                if (lastBytesRef.current && lastTimestampRef.current && timestamp > lastTimestampRef.current) {
                   const bytesDiff = bytesReceived - lastBytesRef.current;
                   const timeDiff = timestamp - lastTimestampRef.current;
                   bitrate = Math.round((bytesDiff * 8) / timeDiff); // kbps
                }
                lastBytesRef.current = bytesReceived;
                lastTimestampRef.current = timestamp;

                let quality: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Excellent';
                if (rtt > 400 || jitter > 100 || packetLoss > 5) quality = 'Poor';
                else if (rtt > 200 || jitter > 50 || packetLoss > 3) quality = 'Fair';
                else if (rtt > 100 || jitter > 30 || packetLoss > 1) quality = 'Good';

                useCallStore.getState()._set({ networkStats: { quality, rtt, jitter, packetLoss, bitrate, relayUsed } });

                // ── Adaptive Audio Quality ──
                try {
                  const senders = pc.getSenders();
                  const audioSender = senders.find(s => s.track?.kind === 'audio');
                  if (audioSender) {
                     const params = audioSender.getParameters();
                     if (params.encodings && params.encodings.length > 0) {
                        const currentMaxBitrate = params.encodings[0].maxBitrate;
                        let targetBitrate = 64000;
                        switch (quality) {
                           case 'Poor': targetBitrate = 16000; break;
                           case 'Fair': targetBitrate = 24000; break;
                           case 'Good': targetBitrate = 48000; break;
                           case 'Excellent': targetBitrate = 64000; break;
                        }
                        if (currentMaxBitrate !== targetBitrate) {
                           params.encodings[0].maxBitrate = targetBitrate;
                           await audioSender.setParameters(params);
                           console.log(`[Adaptive Audio] Adjusted max bitrate to ${targetBitrate / 1000}kbps due to ${quality} network`);
                        }
                     }
                  }
                } catch (audioErr) {
                  console.warn('[Adaptive Audio] Bitrate adjustment unsupported or failed', audioErr);
                }

                const isDiagnosticsOpen = useCallStore.getState().isDiagnosticsOpen;
                if (isDiagnosticsOpen) {
                  let codec = 'Unknown';
                  let audioLevel = 0;
                  let selectedCandidatePair = 'Unknown';

                  stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                       const codecStats = stats.get(report.codecId);
                       if (codecStats) {
                          codec = `${codecStats.mimeType || 'Unknown'} (${codecStats.clockRate || ''}Hz)`;
                       }
                    }
                    if (report.type === 'track' && report.kind === 'audio') {
                       if (report.audioLevel !== undefined) {
                          audioLevel = report.audioLevel;
                       }
                    }
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                       const local = stats.get(report.localCandidateId);
                       const remote = stats.get(report.remoteCandidateId);
                       if (local && remote) {
                          selectedCandidatePair = `${local.ip || local.address}:${local.port} -> ${remote.ip || remote.address}:${remote.port} (${local.protocol})`;
                       }
                    }
                  });

                  useCallStore.getState()._set({ diagnostics: {
                     iceConnectionState: pc.iceConnectionState,
                     peerConnectionState: pc.connectionState,
                     selectedCandidatePair,
                     relayUsed,
                     rtt,
                     packetLoss,
                     jitter,
                     bitrate,
                     codec,
                     audioLevel
                  }});
                } else {
                  useCallStore.getState()._set({ diagnostics: null });
                }

              } catch (err) {
                console.error("Stats error", err);
              }
           }, 2000);
        }
      }
      else if (pc.connectionState === 'failed') {
        setCallState('FAILED');
        endCall();
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC Trace] 24. ontrack fired');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        remoteStreamRef.current = event.streams[0];
        console.log('[WebRTC Trace] 25. Remote audio attached');
      }
    };
    return pc;
  }, [emitSignal, setCallState, endCall, debugLog]);

  const initiateCall = useCallback(async (peer: CallPeer, workspaceId: string, workspaceName?: string) => {
    if (clearCallTimeoutRef.current) {
        clearTimeout(clearCallTimeoutRef.current);
        clearCallTimeoutRef.current = null;
    }

    if (!user) return;
    cleanup();
    
    // Generate unique UUID for the call session (if uuidv4 is not imported, use crypto.randomUUID())
    const generateUUID = () => {
      if (window.crypto?.randomUUID) return window.crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
    };
    const callId = generateUUID();
    setActiveCallId(callId);
    activeCallIdRef.current = callId;
    setActivePeer(peer);
    activePeerRef.current = peer;
    setActiveWorkspaceId(workspaceId);
    activeWorkspaceIdRef.current = workspaceId;
    setActiveWorkspaceName(workspaceName || null);
    
    isCallerRef.current = true;
    
    ringingTimeoutRef.current = setTimeout(() => {
        if (['INITIATED', 'RINGING', 'WAITING'].includes(callStateRef.current)) {
            emitSignal('CALL_END', undefined, callId);
            setCallState('MISSED');
            cleanup();
            clearCallTimeoutRef.current = setTimeout(clearCall, 2000);
        }
    }, CALL_TIMEOUT_MS);

    try {
      // Get microphone permission *before* ringing the other person
      const selectedMicId = useCallStore.getState().selectedMicrophoneId;
      const audioConstraints = getEnhancedAudioConstraints(selectedMicId);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      console.log('[WebRTC Trace] 6. getUserMedia() success');
      setLocalStream(stream);
      localStreamRef.current = stream;

      // IMPORTANT: We do NOT create the RTCPeerConnection or generate an SDP_OFFER yet!
      // If we create it now, the ICE gathering will timeout if the receiver takes more than 15 seconds to answer.
      // We wait until the backend confirms the receiver has ACCEPTED, and then we send the offer.
      sendCallSignal({
        type: 'CALL_REQUEST',
        callId: callId,
        callerId: user.uuid,
        receiverId: peer.uuid,
        workspaceId: workspaceId,
        payload: null, // No offer yet!
        callerName: user.fullName || (user as any).name,
        callerUsername: user.username,
        callerProfileUrl: user.profileImage,
        callerWorkspaceName: workspaceName
      });
      console.log('[WebRTC Trace] 1. CALL_REQUEST sent');
      setCallState('INITIATED');
      
    } catch (e) {
      console.log('[WebRTC Trace] 6. getUserMedia() failure', e);
      setCallState('IDLE');
      cleanup();
    }
  }, [user, sendCallSignal, cleanup, clearCall, emitSignal, setCallState]);

  const handleIncomingRequest = useCallback((signal: any) => {
    if (clearCallTimeoutRef.current) {
        clearTimeout(clearCallTimeoutRef.current);
        clearCallTimeoutRef.current = null;
    }

    isCallerRef.current = false;
    const incomingPeer = { 
      uuid: signal.callerId, 
      name: signal.callerName || 'Incoming Call...',
      username: signal.callerUsername,
      profileUrl: signal.callerProfileUrl
    };
    setActiveCallId(signal.callId);
    activeCallIdRef.current = signal.callId;
    setActivePeer(incomingPeer);
    activePeerRef.current = incomingPeer;
    setActiveWorkspaceId(signal.workspaceId);
    activeWorkspaceIdRef.current = signal.workspaceId;
    setActiveWorkspaceName(signal.callerWorkspaceName || null);
    
    if (document.visibilityState === 'hidden' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
       navigator.serviceWorker.ready.then(reg => {
           reg.showNotification(`Incoming Call from ${incomingPeer.name}`, {
               body: `Workspace: ${signal.callerWorkspaceName || 'SYNERGi'}`,
               icon: '/synergi-icon.png',
               tag: signal.callId,
               data: { callId: signal.callId },
               requireInteraction: true,
               actions: [
                  { action: 'accept', title: 'Accept' },
                  { action: 'reject', title: 'Reject' }
               ]
           });
       });
    }

    // We don't initialize the PC yet, just wait for answer
    setCallState('RINGING');
    
    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    ringingTimeoutRef.current = setTimeout(() => {
        if (['RINGING', 'WAITING'].includes(callStateRef.current)) {
            setCallState('MISSED');
            window.dispatchEvent(new CustomEvent('missed-call', { detail: {
              peer: incomingPeer,
              workspaceId: signal.workspaceId,
              workspaceName: signal.callerWorkspaceName
            }}));
            cleanup();
            clearCallTimeoutRef.current = setTimeout(clearCall, 2000);
        }
    }, CALL_TIMEOUT_MS + 2000);
  }, [cleanup, clearCall, setCallState]);

  const answerCall = useCallback(async () => {
    if (!user || !activePeerRef.current || !activeWorkspaceIdRef.current || !activeCallIdRef.current) return;
    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    
    syncChannelRef.current?.postMessage({ type: 'TAB_HANDLED_CALL' });
    
    try {
        setCallState('CONNECTING');
        const selectedMicId = useCallStore.getState().selectedMicrophoneId;
        const audioConstraints = getEnhancedAudioConstraints(selectedMicId);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        console.log('[WebRTC Trace] 6. getUserMedia() success');
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // Notify backend
        console.log('[WebRTC Trace] 3. CALL_ACCEPT sent');
        emitSignal('CALL_ACCEPT');
        // State machine updates on acknowledgment
    } catch(err) {
        console.log('[WebRTC Trace] 6. getUserMedia() failure', err);
        rejectCall();
    }
  }, [user, emitSignal, rejectCall, setCallState]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) analyticsRef.current.recordMute();
      if (activeCallIdRef.current) {
          emitSignal('CALL_STATE_UPDATE', { isMuted: next });
      }
      return next;
    });
  }, [emitSignal]);

  const toggleHold = useCallback(() => {
    setIsOnHold(prev => {
      const next = !prev;
      setIsMuted(next);
      if (activeCallIdRef.current) {
          emitSignal('CALL_STATE_UPDATE', { isMuted: next, isOnHold: next });
      }
      return next;
    });
  }, [emitSignal]);

  useEffect(() => {
    if (localStream) {
      const shouldDisable = isMuted || isOnHold;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !shouldDisable;
      });
    }
  }, [localStream, isMuted, isOnHold]);

  useEffect(() => {
    if (remoteStream) {
      remoteStream.getAudioTracks().forEach(track => {
        track.enabled = !isOnHold;
      });
    }
  }, [remoteStream, isOnHold]);

  const toggleSpeaker = useCallback(async () => {
    setIsSpeakerOn(prev => !prev);
  }, []);

  const switchMicrophone = useCallback(async (deviceId: string) => {
    try {
      analyticsRef.current.recordDeviceChange();
      const audioConstraints = getEnhancedAudioConstraints(deviceId);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      });
      const newTrack = stream.getAudioTracks()[0];
      
      // Replace in peer connection if active
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }

      // Stop old tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      setLocalStream(stream);
      localStreamRef.current = stream;

      // Update state
      localStorage.setItem('selectedMicrophoneId', deviceId);
      useCallStore.getState()._set({ selectedMicrophoneId: deviceId });
    } catch (err) {
      console.error("Failed to switch microphone", err);
    }
  }, []);

  useEffect(() => {
    useCallStore.getState()._set({ switchMicrophone });
  }, [switchMicrophone]);

  const initiateCallByUsername = useCallback(async (username: string, workspaceId: string) => {
    try {
        const res = await apiClient.get(`/users/search?username=${username}`);
        const data = res.data?.data ?? res.data;
        if (data && data.length > 0) {
            const target = data[0];
            const peer: CallPeer = { uuid: target.uuid, name: target.fullName, profileUrl: target.avatarUrl };
            initiateCall(peer, workspaceId);
            return true;
        }
        return false;
    } catch(err) {
        console.error("Failed to lookup username", err);
        return false;
    }
  }, [initiateCall]);

  const handleSignal = useCallback(async (e: any) => {
    const signal = e.detail;
    
    if (user && signal.callerId === user.uuid) {
        if (!['CALL_INITIATED', 'CALL_UNAVAILABLE', 'CALL_BUSY', 'CALL_ACCEPT', 'CALL_CONNECTED'].includes(signal.type)) {
            return;
        }
    }

    debugLog(`WebSocket Signal Received: ${signal.type}`, undefined, signal);
    
    // Toast logic would go here if imported
    
    if (signal.type === 'CALL_REQUEST') {
      console.log('[WebRTC Trace] 2. CALL_REQUEST received');
      if (signal.callerId === user?.uuid) return;
      
      if (callStateRef.current !== 'IDLE') {
         sendCallSignal({
             type: 'CALL_BUSY',
             callId: signal.callId,
             callerId: user?.uuid,
             receiverId: signal.callerId,
             workspaceId: signal.workspaceId
         });
         return;
      }

      handleIncomingRequest(signal);
      
      sendCallSignal({
          type: 'CALL_RINGING',
          callId: signal.callId,
          callerId: user?.uuid,
          receiverId: signal.callerId,
          workspaceId: signal.workspaceId
      });
    }
    
    if (signal.callId !== activeCallIdRef.current && signal.type !== 'CALL_REQUEST') return;

    if (signal.state && signal.state !== callStateRef.current) {
        const prevState = callStateRef.current;
        setCallState(signal.state as CallState);
        
        if (signal.state === 'ACCEPTED' && isCallerRef.current) {
           try {
              if (!localStreamRef.current) throw new Error("Pre-flight check failed: localStreamRef.current is null.");
              
              const pc = initPeerConnection();
              localStreamRef.current.getTracks().forEach(track => {
                  pc.addTrack(track, localStreamRef.current!);
              });
              
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              emitSignal('SDP_OFFER', offer);
           } catch (err) {
              endCall();
           }
        }
        else if (signal.state === 'CONNECTED') {
           if (!useCallStore.getState().callStartTime && pcRef.current?.connectionState === 'connected') {
               useCallStore.getState()._set({ callStartTime: Date.now() });
           }
        }
        else if (['ENDED', 'REJECTED', 'CANCELLED', 'FAILED', 'TIMEOUT', 'MISSED', 'BUSY'].includes(signal.state)) {
            if (signal.state === 'CANCELLED' && ['RINGING', 'WAITING'].includes(prevState)) {
                setCallState('MISSED');
                window.dispatchEvent(new CustomEvent('missed-call', { detail: {
                  peer: activePeerRef.current,
                  workspaceId: activeWorkspaceIdRef.current,
                  workspaceName: useCallStore.getState().activeWorkspaceName
                }}));
            }
            cleanup();
            clearCallTimeoutRef.current = setTimeout(clearCall, 2000);
        }
    }
    
    if (signal.type === 'SDP_ANSWER' && isCallerRef.current) {
        if (pcRef.current) {
           try {
               await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.payload)));
               isRemoteDescSet.current = true;
               iceCandidateQueue.current.forEach(candidate => {
                  pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
               });
               iceCandidateQueue.current = [];
           } catch(err) {}
        }
    }
    else if (signal.type === 'SDP_OFFER' && !isCallerRef.current) {
         try {
             let pc = pcRef.current;
             if (!pc) {
                 const stream = localStreamRef.current;
                 if (!stream) throw new Error("No local stream available.");
                 pc = initPeerConnection();
                 stream.getTracks().forEach(track => { pc?.addTrack(track, stream); });
             }
             
             await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.payload)));
             isRemoteDescSet.current = true;
             
             iceCandidateQueue.current.forEach(candidate => {
                pc!.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
                    iceCountersRef.current.applied++;
                }).catch(() => {});
             });
             iceCandidateQueue.current = [];
             
             const answer = await pc.createAnswer();
             await pc.setLocalDescription(answer);
             emitSignal('SDP_ANSWER', answer);
         } catch(err) {
             rejectCall();
         }
    }
    else if (signal.type === 'ICE_CANDIDATE') {
        try {
          iceCountersRef.current.received++;
          const candidate = JSON.parse(signal.payload);
          if (pcRef.current && isRemoteDescSet.current) {
              pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
                  iceCountersRef.current.applied++;
              }).catch(() => {});
          } else {
              iceCountersRef.current.queued++;
              iceCandidateQueue.current.push(candidate);
          }
        } catch (err) {}
    }
    else if (signal.type === 'CALL_STATE_UPDATE') {
        try {
            const stateUpdate = JSON.parse(signal.payload);
            if (stateUpdate.isMuted !== undefined) setIsRemoteMuted(stateUpdate.isMuted);
        } catch(err) {}
    }
  }, [user, handleIncomingRequest, cleanup, emitSignal, rejectCall, endCall, initPeerConnection, clearCall, setCallState, sendCallSignal, debugLog]);

  useEffect(() => {
    callSignalEmitter.addEventListener('receive-signal', handleSignal);
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CALL_ACTION') {
        const { action } = event.data;
        if (action === 'accept') {
           if (['RINGING', 'WAITING'].includes(callStateRef.current)) answerCall();
        } else if (action === 'reject') {
           if (['RINGING', 'WAITING'].includes(callStateRef.current)) rejectCall();
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    const handleUnload = () => {
      AudioManager.stop();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      callSignalEmitter.removeEventListener('receive-signal', handleSignal);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      window.removeEventListener('beforeunload', handleUnload);
      AudioManager.stop();
    };
  }, [handleSignal, answerCall, rejectCall]);

  useEffect(() => {
    const handleAcceptHoldWaiting = (e: any) => {
      const signal = e.detail;
      if (pcRef.current && activePeerRef.current && activeWorkspaceIdRef.current && activeCallIdRef.current) {
        heldCallRef.current = {
          callId: activeCallIdRef.current,
          pc: pcRef.current,
          peer: activePeerRef.current,
          workspaceId: activeWorkspaceIdRef.current,
          workspaceName: activeWorkspaceName,
          localStream,
          remoteStream,
          startTime: useCallStore.getState().callStartTime
        };
        useCallStore.getState()._set({ hasHeldCall: true });
        // Send hold signal to current peer
        emitSignal('CALL_STATE_UPDATE', { isMuted: true, isOnHold: true }, activeCallIdRef.current);
      }
      
      activeWorkspaceNameRef.current = null;
      useCallStore.getState()._set({ callStartTime: null, isPoorConnection: false, networkStats: null });
      reconnectAttemptsRef.current = 0;
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
      pcRef.current = null;
      iceCandidateQueue.current = [];
      isRemoteDescSet.current = false;

      handleIncomingRequest(signal);
      
      setTimeout(() => {
         answerCall();
      }, 300);
    };

    const handleEndAcceptWaiting = (e: any) => {
      const signal = e.detail;
      // End current call
      endCall();
      // Wait a beat for cleanup, then accept new
      setTimeout(() => {
         handleIncomingRequest(signal);
         setTimeout(() => answerCall(), 300);
      }, 1000);
    };

    const handleRejectWaiting = (e: any) => {
      const { signal, reason } = e.detail;
      // reason is either 'REJECT' or 'BUSY'
      emitSignal(reason === 'BUSY' ? 'CALL_BUSY' : 'CALL_REJECT', undefined, signal.callId);
    };
    
    window.addEventListener('accept-hold-waiting-call', handleAcceptHoldWaiting);
    window.addEventListener('end-accept-waiting-call', handleEndAcceptWaiting);
    window.addEventListener('reject-waiting-call', handleRejectWaiting);
    
    return () => {
       window.removeEventListener('accept-hold-waiting-call', handleAcceptHoldWaiting);
       window.removeEventListener('end-accept-waiting-call', handleEndAcceptWaiting);
       window.removeEventListener('reject-waiting-call', handleRejectWaiting);
    };
  }, [handleIncomingRequest, answerCall, localStream, remoteStream, activeWorkspaceName]);

  // ── Browser Refresh Recovery ──
  useEffect(() => {
    const state = useCallStore.getState();
    const isPostRefresh = !pcRef.current && state.callState !== 'IDLE' && state.callState !== 'ENDED' && state.callState !== 'MISSED' && state.callState !== 'REJECTED' && state.callState !== 'BUSY' && state.callState !== 'FAILED' && state.callState !== 'TIMEOUT' && state.callState !== 'CANCELLED';

    if (isPostRefresh) {
      console.log('[WebRTC Trace] 🚀 Detected post-refresh state, aggressively recovering call...');
      
      const recoverCall = async () => {
        try {
          // Restore basic refs from persisted state
          callStateRef.current = state.callState;
          activeCallIdRef.current = state.activeCallId;
          activePeerRef.current = state.activePeer;
          activeWorkspaceIdRef.current = state.activeWorkspaceId;
          isCallerRef.current = state.isCaller;

          // Re-acquire media immediately
          const selectedMicId = state.selectedMicrophoneId;
          const audioConstraints = getEnhancedAudioConstraints(selectedMicId);
          const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
          setLocalStream(stream);
          localStreamRef.current = stream;

          if (state.isCaller) {
             const pc = initPeerConnection();
             stream.getTracks().forEach(track => { pc.addTrack(track, stream); });
             const offer = await pc.createOffer({ iceRestart: true });
             await pc.setLocalDescription(offer);
             emitSignal('SDP_OFFER', offer);
          }
          // If receiver, we just wait. The stream is now ready for when the caller's ICE restart SDP arrives.
        } catch (err) {
          console.error('[WebRTC Trace] ❌ Recovery failed', err);
          endCall();
        }
      };

      recoverCall();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    callState,
    activeCallId,
    activePeer,
    activeWorkspaceId,
    activeWorkspaceName,
    localStream,
    remoteStream,
    isMuted,
    isRemoteMuted,
    isOnHold,
    isSpeakerOn,
    isCaller: isCallerRef.current,
    initiateCall,
    initiateCallByUsername,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleHold,
    toggleSpeaker,
  };
}
