package com.startuphub.backend.listener;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.WorkspaceMember;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import com.startuphub.backend.service.CallSessionService;
import com.startuphub.backend.dto.request.CallSignalDto;
import com.startuphub.backend.controller.MeetingWebSocketController.SignalMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.messaging.simp.user.SimpUserRegistry;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserPresenceListener {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CallSessionService callSessionService;
    
    // Internal cache of active sessions to track presence: sessionId -> email
    private final Map<String, String> activeSessions = new java.util.concurrent.ConcurrentHashMap<>();

    public boolean isOnline(String clerkId) {
        if (clerkId == null) return false;
        return activeSessions.values().stream().anyMatch(e -> e.equalsIgnoreCase(clerkId));
    }

    @Transactional
    public void onConnect(String clerkId, String sessionId) {
        if (clerkId != null && sessionId != null) {
            boolean wasOffline = !isOnline(clerkId);
            activeSessions.put(sessionId, clerkId);
            
            if (wasOffline) { // Newly online
                userRepository.findByClerkId(clerkId).ifPresent(user -> {
                    broadcastPresence(user, true);
                });
            }
        }
    }

    @EventListener
    @Transactional
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        if (sessionId != null) {
            // Handle Ghost Call Sessions by delegating to the service
            callSessionService.unregisterCall(sessionId);

            // Handle Ghost Meeting Sessions
            CallSessionService.MeetingSessionInfo meetingInfo = callSessionService.getMeetingSession(sessionId);
            if (meetingInfo != null) {
                SignalMessage leaveMsg = new SignalMessage();
                leaveMsg.setType("leave");
                leaveMsg.setSenderUserUuid(meetingInfo.userUuid);
                messagingTemplate.convertAndSend("/topic/meeting." + meetingInfo.meetingUuid, leaveMsg);
                callSessionService.unregisterMeeting(sessionId);
            }

            String clerkId = activeSessions.remove(sessionId);
            
            if (clerkId != null && !isOnline(clerkId)) {
                userRepository.findByClerkId(clerkId).ifPresent(user -> {
                    user.setLastSeen(LocalDateTime.now());
                    userRepository.save(user);
                    broadcastPresence(user, false);
                });
            }
        }
    }

    public void broadcastPresence(User user, boolean isOnline) {
        boolean inVoiceCall = callSessionService.isUserInCall(user.getUuid().toString());
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserAndStatus(user, WorkspaceMemberStatus.ACTIVE);
        
        Map<String, Object> presenceEvent = Map.of(
            "userUuid", user.getUuid().toString(),
            "isOnline", isOnline,
            "status", user.getPresenceStatus() != null ? user.getPresenceStatus().name() : "ONLINE",
            "inVoiceCall", inVoiceCall,
            "lastSeen", user.getLastSeen() != null ? user.getLastSeen().toString() : LocalDateTime.now().toString()
        );

        for (WorkspaceMember member : memberships) {
            String destination = "/topic/workspace." + member.getStartup().getUuid() + ".presence";
            messagingTemplate.convertAndSend(destination, presenceEvent);
        }
    }
}
