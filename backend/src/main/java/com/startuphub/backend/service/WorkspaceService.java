package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.WorkspaceMemberResponse;
import com.startuphub.backend.dto.response.WorkspaceResponse;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.WorkspaceMember;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.enums.ChatRoomType;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.entity.enums.WorkspaceRole;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.listener.UserPresenceListener;
import com.startuphub.backend.repository.ChatMemberRepository;
import com.startuphub.backend.repository.ChatRoomRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.UserProfileRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import com.startuphub.backend.repository.StartupApplicationRepository;
import com.startuphub.backend.repository.ApplicationStatusHistoryRepository;
import com.startuphub.backend.entity.ApplicationStatusHistory;
import com.startuphub.backend.entity.enums.ApplicationStatus;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final StartupRepository startupRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserProfileRepository userProfileRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserPresenceListener userPresenceListener;
    private final StartupApplicationRepository startupApplicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final ChatNotificationService chatNotificationService;

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getMyWorkspaces(String clerkId) {
        User user = userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserAndStatus(user, WorkspaceMemberStatus.ACTIVE);
        
        return memberships.stream()
                .map(m -> {
                    Startup startup = m.getStartup();
                    return WorkspaceResponse.builder()
                            .startupUuid(startup.getUuid().toString())
                            .startupName(startup.getName())
                            .startupLogoUrl(startup.getLogoUrl())
                            .tagline(startup.getTagline())
                            .stage(startup.getStage() != null ? startup.getStage().name() : null)
                            .status(startup.getStatus().name())
                            .ownerName(startup.getFounder().getFullName())
                            .teamMemberCount(workspaceMemberRepository.findByStartupAndStatus(startup, WorkspaceMemberStatus.ACTIVE).size())
                            .lastActivity(startup.getUpdatedAt())
                            .userRole(m.getRole().name())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getWorkspaceMembers(String clerkId, UUID startupUuid) {
        User user = userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Startup startup = startupRepository.findByUuid(startupUuid).orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
        
        boolean hasAccess = workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, user, WorkspaceMemberStatus.ACTIVE);
        if (!hasAccess) {
            throw new BadRequestException("You do not have access to this workspace.");
        }

        List<WorkspaceMember> members = workspaceMemberRepository.findByStartupAndStatus(startup, WorkspaceMemberStatus.ACTIVE);
        return members.stream().map(m -> {
            com.startuphub.backend.entity.UserProfile profile = userProfileRepository.findByUser(m.getUser()).orElse(null);
            boolean isOnline = userPresenceListener.isOnline(m.getUser().getClerkId());
            return WorkspaceMemberResponse.builder()
                .userUuid(m.getUser().getUuid().toString())
                .fullName(m.getUser().getFullName())
                .username(m.getUser().getUsername())
                .email(m.getUser().getEmail())
                .avatarUrl(m.getUser().getProfileImage())
                .role(m.getRole().name())
                .assignedRole(m.getRole() == WorkspaceRole.OWNER ? "Founder" : "Team Member")
                .skills(profile != null && profile.getSkills() != null ? String.join(", ", profile.getSkills()) : "")
                .bio(profile != null ? profile.getBio() : "")
                .status(m.getStatus().name())
                .joinedAt(m.getJoinedAt())
                .isOnline(isOnline)
                .lastSeen(m.getUser().getLastSeen())
                .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void removeMember(String clerkId, UUID startupUuid, UUID memberUuid) {
        User founder = userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Startup startup = startupRepository.findByUuid(startupUuid).orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
        
        if (!startup.getFounder().getId().equals(founder.getId())) {
            throw new BadRequestException("Only the founder can remove members.");
        }

        User memberUser = userRepository.findByUuid(memberUuid).orElseThrow(() -> new ResourceNotFoundException("Member user not found"));
        
        if (founder.getId().equals(memberUser.getId())) {
            throw new BadRequestException("Founder cannot be removed from the workspace.");
        }

        WorkspaceMember member = workspaceMemberRepository.findByStartupAndUser(startup, memberUser)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in workspace"));

        member.setStatus(WorkspaceMemberStatus.REMOVED);
        workspaceMemberRepository.save(member);
        
        // Update the startup application status instead of deleting it to preserve history
        startupApplicationRepository.findByTalentAndStartup(memberUser, startup).ifPresent(app -> {
            app.setStatus(ApplicationStatus.REVOKED);
            startupApplicationRepository.save(app);
            
            ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                    .application(app).status(ApplicationStatus.REVOKED).changedBy(founder).build();
            historyRepository.save(history);
        });
        
        // Deep cleanup: Remove from ALL chats in this workspace (General, Group, Private)
        List<com.startuphub.backend.entity.chat.ChatMember> allMemberships = chatMemberRepository.findByRoomStartupAndUser(startup, memberUser);
        chatMemberRepository.deleteAll(allMemberships);
        
        chatNotificationService.createSystemNotification(
            memberUser, 
            founder, 
            startup, 
            ChatNotificationType.WORKSPACE_LEFT, 
            String.format("You have been removed from the %s workspace.", startup.getName()), 
            "/talent/applications"
        );
        
        // Notify the workspace that the member was removed
        chatRoomRepository.findByStartupAndType(startup, ChatRoomType.GENERAL).ifPresent(room -> {
            String memberRemovedPayload = String.format("{\"type\":\"MEMBER_REMOVED\",\"startupUuid\":\"%s\",\"userUuid\":\"%s\",\"name\":\"%s\"}", startupUuid.toString(), memberUser.getUuid().toString(), memberUser.getFullName());
            messagingTemplate.convertAndSend("/topic/room." + room.getUuid().toString(), memberRemovedPayload);
        });
        
        log.info("Removed user {} from startup {}", memberUser.getClerkId(), startup.getName());
    }
}
