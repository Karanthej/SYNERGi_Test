package com.startuphub.backend.dto.request;

import com.startuphub.backend.entity.enums.CommitmentType;
import com.startuphub.backend.entity.enums.StartupStage;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.entity.enums.WorkType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class StartupRequest {

    @NotBlank(message = "Startup name is required")
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
    private StartupStage stage;
    private String teamSize;
    private String expectedTeamSize;
    private Integer maxMembers;
    private String timeline;
    private String launchGoal;

    private CommitmentType commitmentType;
    private WorkType workType;
    private String city;
    private String equityAvailable;
    private String equityPercentage;

    private StartupStatus status;

    private List<String> roles;
    private List<String> skills;
    private List<AttachmentDto> attachments;

    @Data
    public static class AttachmentDto {
        private String type; // PITCH_DECK, PROTOTYPE, etc. mapped to enum in service
        private String url;
        private String fileName;
    }
}
