package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Data
@Builder
public class ExploreStartupResponse {
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

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Founder Public Info
    private UUID founderUuid;
    private String founderName;
    private String founderAvatarUrl;
    
    // Stats & State
    private long views;
    private long bookmarksCount;
    private int teamMembersCount;
    private Integer maxMembers;
    private Integer approvedMembers;
    private Integer availableSlots;
    private Boolean applicationsOpen;
    private boolean isBookmarkedByMe;
    private boolean isMember;

    private List<String> roles;
    private List<String> skills;
    private List<StartupResponse.AttachmentResponse> attachments;
}
