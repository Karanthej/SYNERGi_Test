package com.startuphub.backend.controller;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.service.CallSessionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class MeetingWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final CallSessionService callSessionService;

    @Data
    public static class SignalMessage {
        private String type; // offer, answer, candidate, join, leave, mute, remove
        private String targetUserUuid;
        private String senderUserUuid;
        private String senderName;
        private Object payload; // The actual SDP or ICE candidate object
    }

    @MessageMapping("/meeting.signal/{meetingUuid}")
    public void signal(@DestinationVariable UUID meetingUuid, @Payload SignalMessage message, Authentication authentication, SimpMessageHeaderAccessor headerAccessor) {
        if (authentication == null || !authentication.isAuthenticated()) return;
        
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) return;

        // Force sender identity for security
        message.setSenderUserUuid(user.getUuid().toString());
        message.setSenderName(user.getFullName());

        String sessionId = headerAccessor.getSessionId();
        if ("join".equals(message.getType())) {
            callSessionService.registerMeeting(sessionId, meetingUuid.toString(), user.getUuid().toString());
        } else if ("leave".equals(message.getType())) {
            callSessionService.unregisterMeeting(sessionId);
        }

        // Broadcast to the meeting topic
        messagingTemplate.convertAndSend("/topic/meeting." + meetingUuid.toString(), message);
    }
}
