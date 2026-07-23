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
public class ChatRoomResponse {
    private String uuid;
    private String type; // GENERAL, GROUP, PRIVATE
    private String name;
    private Integer memberCount;
    private LocalDateTime createdAt;
    private Long unreadCount;
    
    // For Private Chats
    private String otherMemberName;
    private String otherMemberUuid;
    private String otherMemberUsername;
    private String otherMemberAvatarUrl;
    private String otherMemberRole;

    // For Group Chats
    private String description;
    private String iconUrl;
    private String colorTheme;
    private String visibility;
    private Boolean isArchived;
}
