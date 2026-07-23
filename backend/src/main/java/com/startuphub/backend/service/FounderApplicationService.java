package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.ApplicationResponse;
import com.startuphub.backend.entity.*;
import com.startuphub.backend.entity.enums.ApplicationStatus;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.entity.chat.ChatMember;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.enums.ChatRoomType;
import com.startuphub.backend.entity.enums.ChatRole;
import com.startuphub.backend.repository.*;
import com.startuphub.backend.entity.enums.WorkspaceRole;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FounderApplicationService {

    private final StartupApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final JobOfferRepository jobOfferRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatNotificationService chatNotificationService;

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> getStartupApplications(String clerkId, UUID startupUuid, Pageable pageable) {
        User founder = getUserByClerkId(clerkId);
        Startup startup = startupRepository.findByUuid(startupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));

        if (!startup.getFounder().getId().equals(founder.getId())) {
            throw new BadRequestException("You don't have access to this startup's applications");
        }

        return applicationRepository.findByStartupOrderByCreatedAtDesc(startup, pageable)
                .map(TalentApplicationService::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ApplicationResponse getApplicationDetails(String clerkId, UUID appUuid) {
        User founder = getUserByClerkId(clerkId);
        StartupApplication app = applicationRepository.findByUuid(appUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!app.getStartup().getFounder().getId().equals(founder.getId())) {
            throw new BadRequestException("You don't have access to this application");
        }

        return TalentApplicationService.mapToResponse(app);
    }

    @Transactional
    public void updateApplicationStatus(String clerkId, UUID appUuid, ApplicationStatus newStatus) {
        User founder = getUserByClerkId(clerkId);
        StartupApplication app = applicationRepository.findByUuid(appUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!app.getStartup().getFounder().getId().equals(founder.getId())) {
            throw new BadRequestException("You don't have access to this application");
        }
        
        if (app.getStatus() == newStatus) {
            throw new BadRequestException("Application is already in the requested status");
        }
        
        if (app.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("Cannot update a withdrawn application");
        }

        if (newStatus == ApplicationStatus.ACCEPTED) {
            int approvedMembers = workspaceMemberRepository.findByStartupAndStatus(app.getStartup(), WorkspaceMemberStatus.ACTIVE).size();
            int maxMem = app.getStartup().getMaxMembers() != null ? app.getStartup().getMaxMembers() : 10;
            if (approvedMembers >= maxMem) {
                throw new BadRequestException("Cannot accept application. This workspace has reached its maximum member capacity.");
            }
        }

        app.setStatus(newStatus);
        applicationRepository.save(app);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(app).status(newStatus).changedBy(founder).build();
        historyRepository.save(history);
        
        if (newStatus == ApplicationStatus.ACCEPTED) {
            java.util.Optional<WorkspaceMember> existingOpt = workspaceMemberRepository.findByStartupAndUser(app.getStartup(), app.getTalent());
            
            if (existingOpt.isPresent()) {
                WorkspaceMember existingMember = existingOpt.get();
                if (existingMember.getStatus() != WorkspaceMemberStatus.ACTIVE) {
                    existingMember.setStatus(WorkspaceMemberStatus.ACTIVE);
                    existingMember.setRole(WorkspaceRole.TEAM_MEMBER);
                    workspaceMemberRepository.save(existingMember);
                    log.info("Restored user {} as TEAM_MEMBER to startup {}", app.getTalent().getEmail(), app.getStartup().getName());
                }
            } else {
                WorkspaceMember member = WorkspaceMember.builder()
                        .startup(app.getStartup())
                        .user(app.getTalent())
                        .role(WorkspaceRole.TEAM_MEMBER)
                        .status(WorkspaceMemberStatus.ACTIVE)
                        .build();
                workspaceMemberRepository.save(member);
                log.info("Added user {} as TEAM_MEMBER to startup {}", app.getTalent().getEmail(), app.getStartup().getName());
            }
            
            chatRoomRepository.findByStartupAndType(app.getStartup(), ChatRoomType.GENERAL).ifPresent(room -> {
                boolean chatMemberExists = chatMemberRepository.findByRoomAndUser(room, app.getTalent()).isPresent();
                if (!chatMemberExists) {
                    ChatMember chatMember = ChatMember.builder()
                            .room(room)
                            .user(app.getTalent())
                            .role(ChatRole.MEMBER)
                            .build();
                    chatMemberRepository.save(chatMember);
                    log.info("Added user {} to General chat room", app.getTalent().getEmail());
                    
                    String memberAddedPayload = String.format("{\"type\":\"MEMBER_ADDED\",\"startupUuid\":\"%s\",\"userUuid\":\"%s\",\"name\":\"%s\"}", app.getStartup().getUuid().toString(), app.getTalent().getUuid().toString(), app.getTalent().getFullName());
                    messagingTemplate.convertAndSend("/topic/room." + room.getUuid().toString(), memberAddedPayload);
                }
            });
        } else if (newStatus == ApplicationStatus.REJECTED) {
            workspaceMemberRepository.findByStartupAndUser(app.getStartup(), app.getTalent())
                    .ifPresent(m -> {
                        if (m.getStatus() == WorkspaceMemberStatus.ACTIVE || m.getStatus() == WorkspaceMemberStatus.INVITED) {
                            workspaceMemberRepository.delete(m);
                        }
                    });
            
            chatRoomRepository.findByStartup(app.getStartup()).forEach(room -> {
                chatMemberRepository.findByRoomAndUser(room, app.getTalent())
                        .ifPresent(chatMemberRepository::delete);
            });
            log.info("Removed user {} from startup {} and chat rooms due to application REJECTED", app.getTalent().getEmail(), app.getStartup().getName());
        }
        
        // Sync Job Offer status
        if (newStatus == ApplicationStatus.ACCEPTED || newStatus == ApplicationStatus.REJECTED) {
            jobOfferRepository.findByStartupAndTalentAndStatus(app.getStartup(), app.getTalent(), com.startuphub.backend.entity.enums.JobOfferStatus.APPLIED)
                    .forEach(offer -> {
                        offer.setStatus(newStatus == ApplicationStatus.ACCEPTED 
                            ? com.startuphub.backend.entity.enums.JobOfferStatus.ACCEPTED 
                            : com.startuphub.backend.entity.enums.JobOfferStatus.APPLICATION_REJECTED);
                        jobOfferRepository.save(offer);
                    });
        }
        
        log.info("Application {} status updated to {} by {}", appUuid, newStatus, clerkId);
        
        if (newStatus == ApplicationStatus.ACCEPTED || newStatus == ApplicationStatus.REJECTED) {
            ChatNotificationType notifType = newStatus == ApplicationStatus.ACCEPTED ? ChatNotificationType.APPLICATION_ACCEPTED : ChatNotificationType.APPLICATION_REJECTED;
            String message = newStatus == ApplicationStatus.ACCEPTED 
                ? String.format("Congratulations! Your application to %s has been accepted.", app.getStartup().getName())
                : String.format("Your application to %s was not selected.", app.getStartup().getName());

            chatNotificationService.createSystemNotification(
                app.getTalent(),
                founder,
                app.getStartup(),
                notifType,
                message,
                "/talent/applications"
            );
        }
    }

    private User getUserByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
