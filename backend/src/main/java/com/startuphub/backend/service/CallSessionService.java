package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.CallSignalDto;
import com.startuphub.backend.entity.enums.CallState;
import com.startuphub.backend.model.CallSession;
import com.startuphub.backend.listener.UserPresenceListener;
import com.startuphub.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class CallSessionService {
    
    private final ConcurrentHashMap<UUID, CallSession> activeCalls = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UUID> sessionToCallMap = new ConcurrentHashMap<>();

    @Autowired
    @Lazy
    private UserPresenceListener userPresenceListener;
    
    @Autowired
    private UserRepository userRepository;

    private void updatePresence(String userUuidStr) {
        if (userPresenceListener != null && userRepository != null && userUuidStr != null) {
            try {
                userRepository.findByUuid(UUID.fromString(userUuidStr)).ifPresent(user -> {
                    userPresenceListener.broadcastPresence(user, userPresenceListener.isOnline(user.getClerkId()));
                });
            } catch (Exception e) {
                log.error("Failed to update presence for call state", e);
            }
        }
    }

    public CallSession processSignal(CallSignalDto signal, String sessionId) {
        UUID callId = signal.getCallId();
        
        if ("CALL_REQUEST".equals(signal.getType())) {
            if (callId == null) {
                callId = UUID.randomUUID();
                signal.setCallId(callId);
            }
            CallSession session = new CallSession(callId, signal.getCallerId(), signal.getReceiverId(), signal.getWorkspaceId());
            session.setState(CallState.INITIATED);
            activeCalls.put(callId, session);
            if (sessionId != null) {
                sessionToCallMap.put(sessionId, callId);
            }
            updatePresence(signal.getCallerId().toString());
            updatePresence(signal.getReceiverId().toString());
            
            signal.setState(CallState.INITIATED.name());
            return session;
        }

        if (callId == null) {
            log.warn("Received signal {} without callId", signal.getType());
            return null;
        }

        CallSession session = activeCalls.get(callId);
        if (session == null) {
            log.warn("Received signal {} for unknown or inactive call {}", signal.getType(), callId);
            return null;
        }

        switch (signal.getType()) {
            case "CALL_RINGING":
                session.setState(CallState.RINGING);
                break;
            case "CALL_ACCEPT":
                session.setState(CallState.ACCEPTED);
                session.setAcceptedAt(Instant.now());
                if (sessionId != null) {
                    sessionToCallMap.put(sessionId, callId);
                }
                break;
            case "CALL_REJECT":
                session.setState(CallState.REJECTED);
                session.setEndedAt(Instant.now());
                break;
            case "CALL_END":
                session.setState(CallState.ENDED);
                session.setEndedAt(Instant.now());
                break;
            case "CALL_BUSY":
                session.setState(CallState.BUSY);
                session.setEndedAt(Instant.now());
                break;
            case "CALL_UNAVAILABLE":
                session.setState(CallState.MISSED);
                session.setEndedAt(Instant.now());
                break;
            case "CALL_CONNECTED":
                session.setState(CallState.CONNECTED);
                break;
            case "CALL_STATE_UPDATE":
                if (signal.getState() != null) {
                    try {
                        CallState requestedState = CallState.valueOf(signal.getState());
                        session.setState(requestedState);
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid state update requested: {}", signal.getState());
                    }
                }
                break;
            // SDP / ICE passes through, state can be updated to NEGOTIATING or ICE_GATHERING if requested
        }
        
        signal.setState(session.getState().name());
        
        if (isTerminalState(session.getState())) {
            activeCalls.remove(callId);
            updatePresence(session.getCallerId().toString());
            updatePresence(session.getReceiverId().toString());
        }
        
        return session;
    }

    public boolean isTerminalState(CallState state) {
        return state == CallState.ENDED || state == CallState.REJECTED || 
               state == CallState.CANCELLED || state == CallState.FAILED || 
               state == CallState.TIMEOUT || state == CallState.MISSED ||
               state == CallState.BUSY;
    }

    public void unregisterCall(String sessionId) {
        UUID callId = sessionToCallMap.remove(sessionId);
        if (callId != null) {
            CallSession session = activeCalls.get(callId);
            if (session != null) {
                // Not terminating immediately in case of brief disconnects, but logging it
                log.info("Participant disconnected from active call {}", callId);
            }
        }
    }
    
    public void unregisterCallByParticipant(String userUuid) {
        // Not implemented strictly to terminate, rely on explicit END or timeout
    }

    public boolean isUserInCall(String userUuid) {
        UUID uuid;
        try {
            uuid = UUID.fromString(userUuid);
        } catch (IllegalArgumentException e) {
            return false;
        }
        return activeCalls.values().stream()
                .anyMatch(c -> c.getCallerId().equals(uuid) || c.getReceiverId().equals(uuid)) ||
               activeMeetings.values().stream().anyMatch(m -> m.userUuid.equals(userUuid));
    }

    public CallSession getCallSession(UUID callId) {
        return activeCalls.get(callId);
    }

    // Meeting legacy methods
    public static class MeetingSessionInfo {
        public String meetingUuid;
        public String userUuid;
        public MeetingSessionInfo(String meetingUuid, String userUuid) {
            this.meetingUuid = meetingUuid;
            this.userUuid = userUuid;
        }
    }
    private final ConcurrentHashMap<String, MeetingSessionInfo> activeMeetings = new ConcurrentHashMap<>();
    
    public void registerMeeting(String sessionId, String meetingUuid, String userUuid) {
        activeMeetings.put(sessionId, new MeetingSessionInfo(meetingUuid, userUuid));
        updatePresence(userUuid);
    }
    public void unregisterMeeting(String sessionId) {
        MeetingSessionInfo info = activeMeetings.remove(sessionId);
        if (info != null) {
            updatePresence(info.userUuid);
        }
    }
    public MeetingSessionInfo getMeetingSession(String sessionId) {
        return activeMeetings.get(sessionId);
    }
}
