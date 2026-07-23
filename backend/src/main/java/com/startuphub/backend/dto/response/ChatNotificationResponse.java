package com.startuphub.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatNotificationResponse {
    private String messageUuid;
    private String roomUuid;
    private String startupUuid;
    private String startupName;
    private String senderName;
    private String senderAvatar;
    private String content;
    private LocalDateTime createdAt;
    private String notificationType;
    private String roleBadge;
    private String conversationName;
    private String startupLogo;
    private String actionData;
    private boolean isRead;
}
