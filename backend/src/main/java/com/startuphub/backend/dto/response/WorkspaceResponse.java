package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class WorkspaceResponse {
    private String startupUuid;
    private String startupName;
    private String startupLogoUrl;
    private String tagline;
    private String stage;
    private String status;
    private String ownerName;
    private int teamMemberCount;
    private LocalDateTime lastActivity;
    private String userRole; // Role of the requesting user
}
