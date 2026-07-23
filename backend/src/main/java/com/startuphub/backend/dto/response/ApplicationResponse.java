package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponse {
    private String uuid;
    private String startupUuid;
    private String startupName;
    private String startupLogoUrl;
    private String founderName;

    // Talent details
    private String talentUuid;
    private String talentName;
    private String talentEmail;
    private String talentAvatarUrl;

    private String status;
    private String introduction;
    private String whyJoin;
    private String whyRightFit;

    private String preferredRole;
    private String yearsExperience;
    private String currentOccupation;
    private String skills;
    private String technologiesKnown;

    private String resumeUrl;
    private String portfolioUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String personalWebsiteUrl;

    private String hoursAvailable;
    private String preferredWorkingStyle;
    private String availableStartDate;

    private String previousStartupExperience;
    private String openSourceContributions;
    private String achievements;
    private String additionalNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
