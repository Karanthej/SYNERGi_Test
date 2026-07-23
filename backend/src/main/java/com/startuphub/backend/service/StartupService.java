package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.response.StartupResponse;
import com.startuphub.backend.entity.*;
import com.startuphub.backend.entity.chat.ChatMember;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.chat.ChatSettings;
import com.startuphub.backend.entity.enums.AttachmentType;
import com.startuphub.backend.entity.enums.ChatRoomType;
import com.startuphub.backend.entity.enums.ChatRole;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.ChatMemberRepository;
import com.startuphub.backend.repository.ChatRoomRepository;
import com.startuphub.backend.repository.ChatSettingsRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import com.startuphub.backend.entity.enums.WorkspaceRole;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StartupService {

    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatSettingsRepository chatSettingsRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public StartupResponse createStartup(String clerkId, StartupRequest request) {
        User founder = getUserByClerkId(clerkId);

        if (startupRepository.existsByNameAndFounderId(request.getName(), founder.getId())) {
            throw new BadRequestException("You already have a startup with this name.");
        }

        Startup startup = Startup.builder()
                .founder(founder)
                .name(request.getName())
                .logoUrl(request.getLogoUrl())
                .coverUrl(request.getCoverUrl())
                .tagline(request.getTagline())
                .pitch(request.getPitch())
                .problemStatement(request.getProblemStatement())
                .solution(request.getSolution())
                .vision(request.getVision())
                .mission(request.getMission())
                .detailedDescription(request.getDetailedDescription())
                .targetAudience(request.getTargetAudience())
                .businessModel(request.getBusinessModel())
                .revenueModel(request.getRevenueModel())
                .currentProgress(request.getCurrentProgress())
                .roadmap(request.getRoadmap())
                .futureGoals(request.getFutureGoals())
                .industry(request.getIndustry())
                .stage(request.getStage())
                .teamSize(request.getTeamSize())
                .expectedTeamSize(request.getExpectedTeamSize())
                .timeline(request.getTimeline())
                .launchGoal(request.getLaunchGoal())
                .commitmentType(request.getCommitmentType())
                .workType(request.getWorkType())
                .city(request.getCity())
                .equityAvailable(request.getEquityAvailable())
                .equityPercentage(request.getEquityPercentage())
                .status(request.getStatus() != null ? request.getStatus() : StartupStatus.DRAFT)
                .build();

        updateCollections(startup, request);
        
        Startup savedStartup = startupRepository.save(startup);
        
        WorkspaceMember owner = WorkspaceMember.builder()
                .startup(savedStartup)
                .user(founder)
                .role(WorkspaceRole.OWNER)
                .status(WorkspaceMemberStatus.ACTIVE)
                .build();
        workspaceMemberRepository.save(owner);
        
        ChatRoom generalRoom = ChatRoom.builder()
                .startup(savedStartup)
                .type(ChatRoomType.GENERAL)
                .name("General")
                .build();
        chatRoomRepository.save(generalRoom);
        
        ChatSettings settings = ChatSettings.builder()
                .room(generalRoom)
                .build();
        chatSettingsRepository.save(settings);
        
        ChatMember founderMember = ChatMember.builder()
                .room(generalRoom)
                .user(founder)
                .role(ChatRole.OWNER)
                .build();
        chatMemberRepository.save(founderMember);
        
        log.info("Startup created: {}", savedStartup.getName());
        
        String createPayload = String.format("{\"type\":\"WORKSPACE_CREATED\",\"startupUuid\":\"%s\",\"name\":\"%s\"}", savedStartup.getUuid().toString(), savedStartup.getName());
        messagingTemplate.convertAndSendToUser(founder.getClerkId(), "/queue/workspace-updates", createPayload);
        
        return mapToResponse(savedStartup);
    }

    @Transactional(readOnly = true)
    public List<StartupResponse> getMyStartups(String clerkId) {
        User founder = getUserByClerkId(clerkId);
        List<Startup> startups = startupRepository.findByFounderOrderByUpdatedAtDesc(founder);
        return startups.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StartupResponse getStartupByUuid(String clerkId, UUID uuid) {
        Startup startup = getStartup(uuid);
        verifyOwnership(clerkId, startup);
        return mapToResponse(startup);
    }

    @Transactional
    public StartupResponse updateStartup(String clerkId, UUID uuid, StartupRequest request) {
        Startup startup = getStartup(uuid);
        verifyOwnership(clerkId, startup);

        if (!startup.getName().equals(request.getName()) && 
            startupRepository.existsByNameAndFounderId(request.getName(), startup.getFounder().getId())) {
            throw new BadRequestException("You already have a startup with this name.");
        }

        int currentApprovedMembers = (int) workspaceMemberRepository.countByStartupAndStatus(startup, WorkspaceMemberStatus.ACTIVE);
        if (request.getMaxMembers() != null && request.getMaxMembers() < currentApprovedMembers) {
            throw new BadRequestException("Maximum Members cannot be less than the current number of approved members.");
        }

        startup.setName(request.getName());
        startup.setLogoUrl(request.getLogoUrl());
        startup.setCoverUrl(request.getCoverUrl());
        startup.setTagline(request.getTagline());
        startup.setPitch(request.getPitch());
        startup.setProblemStatement(request.getProblemStatement());
        startup.setSolution(request.getSolution());
        startup.setVision(request.getVision());
        startup.setMission(request.getMission());
        startup.setDetailedDescription(request.getDetailedDescription());
        startup.setTargetAudience(request.getTargetAudience());
        startup.setBusinessModel(request.getBusinessModel());
        startup.setRevenueModel(request.getRevenueModel());
        startup.setCurrentProgress(request.getCurrentProgress());
        startup.setRoadmap(request.getRoadmap());
        startup.setFutureGoals(request.getFutureGoals());
        startup.setIndustry(request.getIndustry());
        startup.setStage(request.getStage());
        startup.setTeamSize(request.getTeamSize());
        startup.setExpectedTeamSize(request.getExpectedTeamSize());
        startup.setMaxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 10);
        startup.setTimeline(request.getTimeline());
        startup.setLaunchGoal(request.getLaunchGoal());
        startup.setCommitmentType(request.getCommitmentType());
        startup.setWorkType(request.getWorkType());
        startup.setCity(request.getCity());
        startup.setEquityAvailable(request.getEquityAvailable());
        startup.setEquityPercentage(request.getEquityPercentage());
        
        if (request.getStatus() != null) {
            startup.setStatus(request.getStatus());
        }

        updateCollections(startup, request);

        Startup savedStartup = startupRepository.save(startup);
        log.info("Startup updated: {}", savedStartup.getName());
        
        String updatePayload = String.format("{\"type\":\"WORKSPACE_UPDATED\",\"startupUuid\":\"%s\",\"name\":\"%s\"}", savedStartup.getUuid().toString(), savedStartup.getName());
        chatRoomRepository.findByStartupAndType(savedStartup, ChatRoomType.GENERAL).ifPresent(room -> {
            messagingTemplate.convertAndSend("/topic/room." + room.getUuid().toString(), updatePayload);
        });
        
        return mapToResponse(savedStartup);
    }

    @Transactional
    public void deleteStartup(String clerkId, UUID uuid) {
        Startup startup = getStartup(uuid);
        verifyOwnership(clerkId, startup);
        
        startup.setDeleted(true);
        startupRepository.save(startup);
        log.info("Startup soft-deleted: {}", uuid);
    }

    @Transactional
    public void updateStatus(String clerkId, UUID uuid, StartupStatus status) {
        Startup startup = getStartup(uuid);
        verifyOwnership(clerkId, startup);
        
        startup.setStatus(status);
        startupRepository.save(startup);
        log.info("Startup status updated to {}: {}", status, uuid);
    }

    private void updateCollections(Startup startup, StartupRequest request) {
        if (startup.getRoles() == null) startup.setRoles(new java.util.HashSet<>());
        if (startup.getSkills() == null) startup.setSkills(new java.util.HashSet<>());
        if (startup.getAttachments() == null) startup.setAttachments(new java.util.HashSet<>());

        startup.getRoles().clear();
        if (request.getRoles() != null) {
            request.getRoles().forEach(r -> 
                startup.getRoles().add(StartupRole.builder().roleName(r).startup(startup).build())
            );
        }

        startup.getSkills().clear();
        if (request.getSkills() != null) {
            request.getSkills().forEach(s -> 
                startup.getSkills().add(StartupSkill.builder().skillName(s).startup(startup).build())
            );
        }

        startup.getAttachments().clear();
        if (request.getAttachments() != null) {
            request.getAttachments().forEach(a -> {
                AttachmentType type = AttachmentType.valueOf(a.getType());
                startup.getAttachments().add(StartupAttachment.builder()
                        .type(type).url(a.getUrl()).fileName(a.getFileName()).startup(startup).build());
            });
        }
    }

    public StartupResponse mapToResponse(Startup startup) {
        int approvedMembers = (int) workspaceMemberRepository.countByStartupAndStatus(startup, WorkspaceMemberStatus.ACTIVE);
        int maxMem = startup.getMaxMembers() != null ? startup.getMaxMembers() : 10;
        int availableSlots = Math.max(0, maxMem - approvedMembers);
        boolean applicationsOpen = availableSlots > 0;

        return StartupResponse.builder()
                .uuid(startup.getUuid().toString())
                .name(startup.getName())
                .logoUrl(startup.getLogoUrl())
                .coverUrl(startup.getCoverUrl())
                .tagline(startup.getTagline())
                .pitch(startup.getPitch())
                .problemStatement(startup.getProblemStatement())
                .solution(startup.getSolution())
                .vision(startup.getVision())
                .mission(startup.getMission())
                .detailedDescription(startup.getDetailedDescription())
                .targetAudience(startup.getTargetAudience())
                .businessModel(startup.getBusinessModel())
                .revenueModel(startup.getRevenueModel())
                .currentProgress(startup.getCurrentProgress())
                .roadmap(startup.getRoadmap())
                .futureGoals(startup.getFutureGoals())
                .industry(startup.getIndustry())
                .stage(startup.getStage() != null ? startup.getStage().name() : null)
                .teamSize(startup.getTeamSize())
                .expectedTeamSize(startup.getExpectedTeamSize())
                .timeline(startup.getTimeline())
                .launchGoal(startup.getLaunchGoal())
                .commitmentType(startup.getCommitmentType() != null ? startup.getCommitmentType().name() : null)
                .workType(startup.getWorkType() != null ? startup.getWorkType().name() : null)
                .city(startup.getCity())
                .equityAvailable(startup.getEquityAvailable())
                .equityPercentage(startup.getEquityPercentage())
                .status(startup.getStatus().name())
                .createdAt(startup.getCreatedAt())
                .updatedAt(startup.getUpdatedAt())
                .roles(startup.getRoles() != null ? startup.getRoles().stream().map(StartupRole::getRoleName).collect(Collectors.toList()) : new ArrayList<>())
                .skills(startup.getSkills() != null ? startup.getSkills().stream().map(StartupSkill::getSkillName).collect(Collectors.toList()) : new ArrayList<>())
                .attachments(startup.getAttachments() != null ? startup.getAttachments().stream().map(a -> 
                        StartupResponse.AttachmentResponse.builder()
                                .type(a.getType() != null ? a.getType().name() : null)
                                .url(a.getUrl())
                                .fileName(a.getFileName())
                                .build()
                ).collect(Collectors.toList()) : new ArrayList<>())
                .views((int)(Math.random() * 500)) // placeholder
                .applicationsCount((int)(Math.random() * 50)) // placeholder
                .teamMembersCount(approvedMembers) 
                .maxMembers(maxMem)
                .approvedMembers(approvedMembers)
                .availableSlots(availableSlots)
                .applicationsOpen(applicationsOpen)
                .build();
    }

    private User getUserByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Startup getStartup(UUID uuid) {
        return startupRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
    }

    private void verifyOwnership(String clerkId, Startup startup) {
        if (!startup.getFounder().getClerkId().equals(clerkId)) {
            throw new BadRequestException("You do not have permission to access this startup.");
        }
    }
}
