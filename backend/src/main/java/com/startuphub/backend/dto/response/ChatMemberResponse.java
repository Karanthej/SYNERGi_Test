package com.startuphub.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMemberResponse {
    private String userUuid;
    private String fullName;
    private String username;
    private String profileImage;
    private String role;
    private LocalDateTime joinedAt;
    @Builder.Default
    @JsonProperty("isOnline")
    private boolean isOnline = false;
    private LocalDateTime lastSeen;
}
