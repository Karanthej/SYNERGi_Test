import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export interface Participant {
    uuid: string;
    name: string;
    stream: MediaStream | null;
    isMuted: boolean;
    isCameraOff: boolean;
    isScreenSharing: boolean;
}

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export const useWebRTC = (meetingUuid: string | undefined) => {
    const { user } = useAuthStore();
    const { sendGeneric, isConnected, subscribe } = useWebSocket();
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    
    // Store RTCPeerConnections
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const streamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);



    // Initialize local media
    const initMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            streamRef.current = stream;
        } catch {
            /* console.error removed */
            toast.error("Could not access camera or microphone");
        }
    };

    // Clean up connections
    const cleanup = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        peersRef.current.forEach(peer => peer.close());
        peersRef.current.clear();
        setParticipants(new Map());
        setLocalStream(null);
    }, []);

    // Create a new Peer Connection
    const createPeerConnection = useCallback((targetUuid: string, targetName: string, isInitiator: boolean) => {
        const peer = new RTCPeerConnection(configuration);
        peersRef.current.set(targetUuid, peer);

        // Add local tracks to peer
        const streamToSend = screenStreamRef.current || streamRef.current;
        if (streamToSend) {
            streamToSend.getTracks().forEach(track => {
                peer.addTrack(track, streamToSend);
            });
        }

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                sendGeneric(`/app/meeting.signal/${meetingUuid}`, {
                    type: 'candidate',
                    targetUserUuid: targetUuid,
                    payload: event.candidate
                });
            }
        };

        // Handle incoming stream
        peer.ontrack = (event) => {
            setParticipants(prev => {
                const newMap = new Map(prev);
                const participant = newMap.get(targetUuid) || {
                    uuid: targetUuid,
                    name: targetName,
                    stream: null,
                    isMuted: false,
                    isCameraOff: false,
                    isScreenSharing: false
                };
                participant.stream = event.streams[0];
                newMap.set(targetUuid, participant);
                return newMap;
            });
        };

        // Handle connection state changes
        peer.oniceconnectionstatechange = () => {
            if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'closed') {
                setParticipants(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(targetUuid);
                    return newMap;
                });
                peersRef.current.delete(targetUuid);
            }
        };

        if (isInitiator) {
            peer.createOffer()
                .then(offer => peer.setLocalDescription(offer))
                .then(() => {
                    sendGeneric(`/app/meeting.signal/${meetingUuid}`, {
                        type: 'offer',
                        targetUserUuid: targetUuid,
                        payload: peer.localDescription
                    });
                })
                .catch(() => { /* console.error removed */ });
        }

        return peer;
    }, [meetingUuid, sendGeneric]);

    // Signaling listener
    useEffect(() => {
        if (!isConnected || !meetingUuid || !user) return;

        const unsubscribe = subscribe(`/topic/meeting.${meetingUuid}`, (msg) => {
            const data = JSON.parse(msg.body);
            const { type, senderUserUuid, senderName, targetUserUuid, payload } = data;

            // Ignore our own messages
            if (senderUserUuid === user.uuid) return;

            // Handle joining
            if (type === 'join') {
                toast.success(`${senderName} joined the meeting`);
                // We create a peer connection and initiate the offer
                createPeerConnection(senderUserUuid, senderName, true);
                
                // Also broadcast our current state (mute/video)
                sendGeneric(`/app/meeting.signal/${meetingUuid}`, {
                    type: 'state',
                    payload: { isMuted, isCameraOff, isScreenSharing }
                });
            }

            // Target messages checks
            if (targetUserUuid && targetUserUuid !== user.uuid) return;

            if (type === 'offer') {
                const peer = createPeerConnection(senderUserUuid, senderName, false);
                peer.setRemoteDescription(new RTCSessionDescription(payload))
                    .then(() => peer.createAnswer())
                    .then(answer => peer.setLocalDescription(answer))
                    .then(() => {
                        sendGeneric(`/app/meeting.signal/${meetingUuid}`, {
                            type: 'answer',
                            targetUserUuid: senderUserUuid,
                            payload: peer.localDescription
                        });
                    })
                    .catch(() => { /* console.error removed */ });
            } else if (type === 'answer') {
                const peer = peersRef.current.get(senderUserUuid);
                if (peer) {
                    peer.setRemoteDescription(new RTCSessionDescription(payload)).catch(() => { /* console.error removed */ });
                }
            } else if (type === 'candidate') {
                const peer = peersRef.current.get(senderUserUuid);
                if (peer) {
                    peer.addIceCandidate(new RTCIceCandidate(payload)).catch(() => { /* console.error removed */ });
                }
            } else if (type === 'leave') {
                toast.info(`${senderName} left the meeting`);
                const peer = peersRef.current.get(senderUserUuid);
                if (peer) peer.close();
                peersRef.current.delete(senderUserUuid);
                setParticipants(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(senderUserUuid);
                    return newMap;
                });
            } else if (type === 'state') {
                setParticipants(prev => {
                    const newMap = new Map(prev);
                    const participant = newMap.get(senderUserUuid);
                    if (participant) {
                        newMap.set(senderUserUuid, { ...participant, ...payload });
                    }
                    return newMap;
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [isConnected, meetingUuid, user, isMuted, isCameraOff, isScreenSharing, sendGeneric, subscribe, createPeerConnection]);

    // Setup and teardown on mount
    useEffect(() => {
        initMedia().then(() => {
            if (isConnected && meetingUuid) {
                sendGeneric(`/app/meeting.signal/${meetingUuid}`, { type: 'join' });
            }
        });

        return () => {
            if (isConnected && meetingUuid) {
                sendGeneric(`/app/meeting.signal/${meetingUuid}`, { type: 'leave' });
            }
            cleanup();
        };
    }, [isConnected, meetingUuid, sendGeneric, cleanup]);

    // --- Controls ---

    const toggleAudio = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                sendGeneric(`/app/meeting.signal/${meetingUuid}`, { type: 'state', payload: { isMuted: !audioTrack.enabled, isCameraOff, isScreenSharing } });
            }
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
                sendGeneric(`/app/meeting.signal/${meetingUuid}`, { type: 'state', payload: { isMuted, isCameraOff: !videoTrack.enabled, isScreenSharing } });
            }
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                setIsScreenSharing(true);
                
                // Replace video track in all peers
                const screenTrack = screenStream.getVideoTracks()[0];
                peersRef.current.forEach(peer => {
                    const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });
                
                // Replace local video
                if (streamRef.current) {
                    setLocalStream(new MediaStream([screenTrack, streamRef.current.getAudioTracks()[0]]));
                }

                // Handle system stop sharing
                screenTrack.onended = () => {
                    stopScreenShare();
                };

                sendGeneric(`/app/meeting.signal/${meetingUuid}`, { type: 'state', payload: { isMuted, isCameraOff, isScreenSharing: true } });

            } catch {
                /* console.error removed */
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        
        // Restore camera track
        if (streamRef.current) {
            const cameraTrack = streamRef.current.getVideoTracks()[0];
            peersRef.current.forEach(peer => {
                const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
            });
            setLocalStream(streamRef.current);
        }
        
        sendGeneric(`/app/meeting.signal/${meetingUuid}`, { type: 'state', payload: { isMuted, isCameraOff, isScreenSharing: false } });
    };

    return {
        localStream,
        participants: Array.from(participants.values()),
        isMuted,
        isCameraOff,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        toggleScreenShare
    };
};
