package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.response.ApplicationResponse;
import com.startuphub.backend.entity.*;
import com.startuphub.backend.entity.enums.ApplicationStatus;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.UUID;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TalentApplicationService {

    private final StartupApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final JobOfferRepository jobOfferRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatNotificationService chatNotificationService;

    @Transactional
    public ApplicationResponse apply(String clerkId, UUID startupUuid, ApplicationRequest request) {
        User talent = getUserByClerkId(clerkId);
        Startup startup = startupRepository.findByUuid(startupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));

        if (startup.getStatus() != StartupStatus.PUBLISHED || startup.isDeleted()) {
            throw new BadRequestException("Cannot apply to an unpublished startup");
        }
        if (startup.getFounder().getId().equals(talent.getId())) {
            throw new BadRequestException("Founders cannot apply to their own startups");
        }
        if (applicationRepository.existsByTalentAndStartupAndStatusIn(talent, startup, List.of(ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED, ApplicationStatus.SHORTLISTED))) {
            throw new BadRequestException("You have already applied to this startup and your application is currently active.");
        }

        int approvedMembers = workspaceMemberRepository.findByStartupAndStatus(startup, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE).size();
        int maxMem = startup.getMaxMembers() != null ? startup.getMaxMembers() : 10;
        if (approvedMembers >= maxMem) {
            throw new BadRequestException("Applications are closed. This workspace has reached its maximum member capacity.");
        }

        Optional<StartupApplication> existingOpt = applicationRepository.findByTalentAndStartup(talent, startup);
        StartupApplication app;
        if (existingOpt.isPresent()) {
            app = existingOpt.get();
            app.setStatus(ApplicationStatus.PENDING);
            app.setIntroduction(request.getIntroduction());
            app.setWhyJoin(request.getWhyJoin());
            app.setWhyRightFit(request.getWhyRightFit());
            app.setPreferredRole(request.getPreferredRole());
            app.setYearsExperience(request.getYearsExperience());
            app.setCurrentOccupation(request.getCurrentOccupation());
            app.setSkills(request.getSkills());
            app.setTechnologiesKnown(request.getTechnologiesKnown());
            app.setResumeUrl(request.getResumeUrl());
            app.setPortfolioUrl(request.getPortfolioUrl());
            app.setGithubUrl(request.getGithubUrl());
            app.setLinkedinUrl(request.getLinkedinUrl());
            app.setPersonalWebsiteUrl(request.getPersonalWebsiteUrl());
            app.setHoursAvailable(request.getHoursAvailable());
            app.setPreferredWorkingStyle(request.getPreferredWorkingStyle());
            app.setAvailableStartDate(request.getAvailableStartDate());
            app.setPreviousStartupExperience(request.getPreviousStartupExperience());
            app.setOpenSourceContributions(request.getOpenSourceContributions());
            app.setAchievements(request.getAchievements());
            app.setAdditionalNotes(request.getAdditionalNotes());
        } else {
            app = StartupApplication.builder()
                    .talent(talent)
                    .startup(startup)
                    .introduction(request.getIntroduction())
                    .whyJoin(request.getWhyJoin())
                    .whyRightFit(request.getWhyRightFit())
                    .preferredRole(request.getPreferredRole())
                    .yearsExperience(request.getYearsExperience())
                    .currentOccupation(request.getCurrentOccupation())
                    .skills(request.getSkills())
                    .technologiesKnown(request.getTechnologiesKnown())
                    .resumeUrl(request.getResumeUrl())
                    .portfolioUrl(request.getPortfolioUrl())
                    .githubUrl(request.getGithubUrl())
                    .linkedinUrl(request.getLinkedinUrl())
                    .personalWebsiteUrl(request.getPersonalWebsiteUrl())
                    .hoursAvailable(request.getHoursAvailable())
                    .preferredWorkingStyle(request.getPreferredWorkingStyle())
                    .availableStartDate(request.getAvailableStartDate())
                    .previousStartupExperience(request.getPreviousStartupExperience())
                    .openSourceContributions(request.getOpenSourceContributions())
                    .achievements(request.getAchievements())
                    .additionalNotes(request.getAdditionalNotes())
                    .build();
        }

        app = applicationRepository.save(app);
        
        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(app).status(ApplicationStatus.PENDING).changedBy(talent).build();
        historyRepository.save(history);
        
        // Auto-resolve any pending Job Offers for this startup and talent
        jobOfferRepository.findByStartupAndTalentAndStatus(startup, talent, com.startuphub.backend.entity.enums.JobOfferStatus.PENDING)
                .forEach(offer -> {
                    offer.setStatus(com.startuphub.backend.entity.enums.JobOfferStatus.APPLIED);
                    jobOfferRepository.save(offer);
                });
        
        String payload = String.format("{\"type\":\"APPLICATION_RECEIVED\",\"startupUuid\":\"%s\",\"talentName\":\"%s\"}", startupUuid.toString(), talent.getFullName());
        messagingTemplate.convertAndSendToUser(startup.getFounder().getClerkId(), "/queue/workspace-updates", payload);
        
        return mapToResponse(app);
    }

    @Transactional
    public void withdraw(String clerkId, UUID appUuid) {
        User talent = getUserByClerkId(clerkId);
        StartupApplication app = applicationRepository.findByUuid(appUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!app.getTalent().getId().equals(talent.getId())) {
            throw new BadRequestException("Not authorized to withdraw this application");
        }
        if (app.getStatus() != ApplicationStatus.PENDING) {
            throw new BadRequestException("Only PENDING applications can be withdrawn");
        }

        app.setStatus(ApplicationStatus.WITHDRAWN);
        applicationRepository.save(app);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(app).status(ApplicationStatus.WITHDRAWN).changedBy(talent).build();
        historyRepository.save(history);
        
        // Sync back to Job Offer if this application was started from an offer
        jobOfferRepository.findByStartupAndTalentAndStatus(app.getStartup(), talent, com.startuphub.backend.entity.enums.JobOfferStatus.APPLIED)
                .forEach(offer -> {
                    offer.setStatus(com.startuphub.backend.entity.enums.JobOfferStatus.APPLICATION_WITHDRAWN);
                    jobOfferRepository.save(offer);
                });

        // Notify Founder
        chatNotificationService.createSystemNotification(
            app.getStartup().getFounder(), 
            talent, 
            app.getStartup(), 
            ChatNotificationType.APPLICATION_WITHDRAWN, 
            String.format("%s withdrew their application.", talent.getFullName()), 
            "/founder/applications"
        );
    }

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> getMyApplications(String clerkId, Pageable pageable) {
        User talent = getUserByClerkId(clerkId);
        return applicationRepository.findByTalentOrderByCreatedAtDesc(talent, pageable)
                .map(TalentApplicationService::mapToResponse);
    }
    
    @Transactional(readOnly = true)
    public ApplicationResponse getApplicationForStartup(String clerkId, UUID startupUuid) {
        User talent = getUserByClerkId(clerkId);
        Startup startup = startupRepository.findByUuid(startupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
                
        return applicationRepository.findByTalentAndStartup(talent, startup)
                .map(TalentApplicationService::mapToResponse)
                .orElse(null);
    }

    private User getUserByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public static ApplicationResponse mapToResponse(StartupApplication app) {
        return ApplicationResponse.builder()
                .uuid(app.getUuid().toString())
                .startupUuid(app.getStartup().getUuid().toString())
                .startupName(app.getStartup().getName())
                .startupLogoUrl(app.getStartup().getLogoUrl())
                .founderName(app.getStartup().getFounder().getFullName())
                .talentUuid(app.getTalent().getUuid().toString())
                .talentName(app.getTalent().getFullName())
                .talentEmail(app.getTalent().getEmail())
                .talentAvatarUrl(null)
                .status(app.getStatus().name())
                .introduction(app.getIntroduction())
                .whyJoin(app.getWhyJoin())
                .whyRightFit(app.getWhyRightFit())
                .preferredRole(app.getPreferredRole())
                .yearsExperience(app.getYearsExperience())
                .currentOccupation(app.getCurrentOccupation())
                .skills(app.getSkills())
                .technologiesKnown(app.getTechnologiesKnown())
                .resumeUrl(app.getResumeUrl())
                .portfolioUrl(app.getPortfolioUrl())
                .githubUrl(app.getGithubUrl())
                .linkedinUrl(app.getLinkedinUrl())
                .personalWebsiteUrl(app.getPersonalWebsiteUrl())
                .hoursAvailable(app.getHoursAvailable())
                .preferredWorkingStyle(app.getPreferredWorkingStyle())
                .availableStartDate(app.getAvailableStartDate())
                .previousStartupExperience(app.getPreviousStartupExperience())
                .openSourceContributions(app.getOpenSourceContributions())
                .achievements(app.getAchievements())
                .additionalNotes(app.getAdditionalNotes())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }
}
