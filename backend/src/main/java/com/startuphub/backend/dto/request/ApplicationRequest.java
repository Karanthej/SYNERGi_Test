package com.startuphub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApplicationRequest {
    @NotBlank(message = "Introduction is required")
    private String introduction;
    @NotBlank(message = "Why join is required")
    private String whyJoin;
    @NotBlank(message = "Why right fit is required")
    private String whyRightFit;

    @NotBlank(message = "Preferred role is required")
    private String preferredRole;
    private String yearsExperience;
    private String currentOccupation;
    @NotBlank(message = "Skills are required")
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
}
