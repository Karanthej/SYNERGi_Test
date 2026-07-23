package com.startuphub.backend.controller;

import com.startuphub.backend.dto.request.CallSignalDto;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.model.CallSession;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.service.CallSessionService;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import com.startuphub.backend.dto.request.CallLogRequest;
import com.startuphub.backend.service.CallLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Optional;

@Slf4j
@Controller
@RequiredArgsConstructor
public class CallWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final CallSessionService callSessionService;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final StartupRepository startupRepository;
    private final CallLogService callLogService;
    private final com.startuphub.backend.listener.UserPresenceListener userPresenceListener;

    @MessageMapping("/call/signal")
    public void handleCallSignal(@Payload CallSignalDto signal, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("==================================================");
        System.out.println("[VOICE_DEBUG] Received WebSocket Signal: " + signal.getType());
        System.out.println("CallID: " + signal.getCallId());
        System.out.println("Caller: " + signal.getCallerId());
        System.out.println("Receiver: " + signal.getReceiverId());
        
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            log.warn("Unauthorized attempt to send a call signal");
            return;
        }

        User caller = userRepository.findByUuid(signal.getCallerId()).orElse(null);
        User receiver = userRepository.findByUuid(signal.getReceiverId()).orElse(null);

        if (caller == null || receiver == null) {
            log.warn("Caller or receiver not found for call signal");
            return;
        }

        // Validate Workspace membership
        if (signal.getWorkspaceId() != null) {
            Startup workspace = startupRepository.findByUuid(signal.getWorkspaceId()).orElse(null);
            if (workspace != null) {
                boolean callerValid = workspaceMemberRepository.existsByStartupAndUserAndStatus(workspace, caller, WorkspaceMemberStatus.ACTIVE);
                boolean receiverValid = workspaceMemberRepository.existsByStartupAndUserAndStatus(workspace, receiver, WorkspaceMemberStatus.ACTIVE);
                
                if (!callerValid || !receiverValid) {
                    log.warn("Call blocked: One or both users are not active members of workspace {}", workspace.getUuid());
                    return;
                }
            }
        }

        String receiverClerkId = receiver.getClerkId();
        String sessionId = headerAccessor.getSessionId();
        
        // Let the State Machine process the signal and enforce transition
        CallSession session = callSessionService.processSignal(signal, sessionId);
        
        System.out.println("Current Backend State: " + (session != null ? session.getState() : "N/A"));
        System.out.println("==================================================");

        if (session == null && !"CALL_END".equals(signal.getType()) && !"CALL_REJECT".equals(signal.getType())) {
            // Signal rejected by state machine (invalid or unknown call)
            return;
        }

        // Validation: If it's a CALL_REQUEST, check if receiver is online or busy
        if ("CALL_REQUEST".equals(signal.getType())) {
            if (!userPresenceListener.isOnline(receiverClerkId)) {
                log.info("Call blocked: Receiver {} is offline", receiverClerkId);
                signal.setType("CALL_UNAVAILABLE");
                signal.setState("MISSED");
                callSessionService.processSignal(signal, sessionId);
                messagingTemplate.convertAndSendToUser(caller.getClerkId(), "/queue/call", signal);
                return;
            }
            
            // Check if receiver is already in a call (busy) - except we might want Call Waiting
            // For now, we allow Call Waiting, so we DO NOT block here. The frontend will 
            // handle the CALL_REQUEST and present "Call Waiting", then send CALL_BUSY if rejected.
        }

        log.info("Routing call signal {} (CallId: {}, State: {}) from {} to {}", 
            signal.getType(), signal.getCallId(), signal.getState(), caller.getClerkId(), receiverClerkId);

        // Send to receiver
        messagingTemplate.convertAndSendToUser(receiverClerkId, "/queue/call", signal);
        
        // Also send state confirmation back to the sender, BUT do not echo CALL_REQUEST verbatim.
        if ("CALL_REQUEST".equals(signal.getType())) {
            CallSignalDto callerAck = new CallSignalDto();
            callerAck.setType("CALL_INITIATED");
            callerAck.setCallId(signal.getCallId());
            callerAck.setCallerId(signal.getCallerId());
            callerAck.setReceiverId(signal.getReceiverId());
            callerAck.setWorkspaceId(signal.getWorkspaceId());
            callerAck.setState(session != null ? session.getState().name() : "INITIATED");
            messagingTemplate.convertAndSendToUser(caller.getClerkId(), "/queue/call", callerAck);
        } else {
            messagingTemplate.convertAndSendToUser(caller.getClerkId(), "/queue/call", signal);
        }

        // Log call history if it's a terminal state
        if (session != null && callSessionService.isTerminalState(session.getState())) {
            try {
                if (signal.getWorkspaceId() != null) {
                    CallLogRequest logReq = new CallLogRequest();
                    logReq.setUuid(session.getCallId());
                    logReq.setCallerId(caller.getUuid());
                    logReq.setReceiverId(receiver.getUuid());
                    
                    long duration = 0;
                    if (session.getAcceptedAt() != null && session.getEndedAt() != null) {
                        duration = session.getEndedAt().getEpochSecond() - session.getAcceptedAt().getEpochSecond();
                    }
                    logReq.setDurationSeconds((int) duration);
                    logReq.setStatus(session.getState().name());
                    callLogService.logCall(signal.getWorkspaceId(), logReq);
                }
            } catch (Exception e) {
                log.error("Failed to log call", e);
            }
        }
    }
}
