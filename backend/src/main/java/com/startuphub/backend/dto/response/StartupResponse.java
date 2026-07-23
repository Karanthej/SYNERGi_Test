package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StartupResponse {

    private String uuid;
    private String name;
    private String logoUrl;
    private String coverUrl;
    private String tagline;
    private String pitch;

    private String problemStatement;
    private String solution;
    private String vision;
    private String mission;
    private String detailedDescription;
    private String targetAudience;
    private String businessModel;
    private String revenueModel;
    private String currentProgress;
    private String roadmap;
    private String futureGoals;

    private String industry;
    private String stage;
    private String teamSize;
    private String expectedTeamSize;
    private String timeline;
    private String launchGoal;

    private String commitmentType;
    private String workType;
    private String city;
    private String equityAvailable;
    private String equityPercentage;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Placeholder stats
    private int views;
    private int applicationsCount;
    private int teamMembersCount;
    
    // Member capacity
    private Integer maxMembers;
    private Integer approvedMembers;
    private Integer availableSlots;
    private Boolean applicationsOpen;

    private List<String> roles;
    private List<String> skills;
    private List<AttachmentResponse> attachments;

    @Data
    @Builder
    public static class AttachmentResponse {
        private String type;
        private String url;
        private String fileName;
    }
}
