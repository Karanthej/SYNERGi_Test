package com.startuphub.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class WorkspaceMemberResponse {
    private String userUuid;
    private String fullName;
    private String username;
    private String email;
    private String avatarUrl;
    private String role; // OWNER or TEAM_MEMBER
    private String assignedRole; // Frontend Dev etc (from application or startup)
    private String skills;
    private String bio;
    private String status;
    private LocalDateTime joinedAt;
    @lombok.Builder.Default
    @JsonProperty("isOnline")
    private boolean isOnline = false;
    private LocalDateTime lastSeen;
}
