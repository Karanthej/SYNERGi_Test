package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.AnnouncementRequest;
import com.startuphub.backend.dto.response.AnnouncementResponse;
import com.startuphub.backend.entity.Announcement;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.WorkspaceMember;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.entity.enums.WorkspaceRole;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.exception.UnauthorizedException;
import com.startuphub.backend.repository.AnnouncementRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements(String email, UUID startupUuid) {
        User user = getUserByEmail(email);
        Startup startup = getStartupByUuid(startupUuid);
        WorkspaceMember member = getActiveMember(startup, user);

        return announcementRepository.findByStartupOrderByIsPinnedDescCreatedAtDesc(startup)
                .stream()
                .map(announcement -> {
                    // For the response, get the author's role in the workspace
                    WorkspaceMember authorMember = workspaceMemberRepository.findByStartupAndUser(
                            startup, announcement.getAuthor()).orElse(null);
                    String authorRole = (authorMember != null && authorMember.getStatus() == WorkspaceMemberStatus.ACTIVE)
                            ? authorMember.getRole().name() : "MEMBER";
                    return AnnouncementResponse.fromEntity(announcement, authorRole);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(String email, UUID startupUuid, AnnouncementRequest request) {
        User user = getUserByEmail(email);
        Startup startup = getStartupByUuid(startupUuid);
        WorkspaceMember member = getActiveMember(startup, user);

        // Only OWNER can create announcements
        if (member.getRole() != WorkspaceRole.OWNER) {
            throw new UnauthorizedException("Only workspace owners can create announcements");
        }

        Announcement announcement = Announcement.builder()
                .startup(startup)
                .author(user)
                .title(request.getTitle())
                .content(request.getContent())
                .priority(request.getPriority())
                .isPinned(request.isPinned())
                .build();

        announcement = announcementRepository.save(announcement);
        return AnnouncementResponse.fromEntity(announcement, member.getRole().name());
    }

    @Transactional
    public void deleteAnnouncement(String email, UUID startupUuid, UUID announcementUuid) {
        User user = getUserByEmail(email);
        Startup startup = getStartupByUuid(startupUuid);
        WorkspaceMember member = getActiveMember(startup, user);

        if (member.getRole() != WorkspaceRole.OWNER) {
            throw new UnauthorizedException("Only workspace owners can delete announcements");
        }

        Announcement announcement = announcementRepository.findByUuid(announcementUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        if (!announcement.getStartup().getId().equals(startup.getId())) {
            throw new UnauthorizedException("Announcement does not belong to this workspace");
        }

        announcementRepository.delete(announcement);
    }

    @Transactional
    public AnnouncementResponse togglePin(String email, UUID startupUuid, UUID announcementUuid, boolean isPinned) {
        User user = getUserByEmail(email);
        Startup startup = getStartupByUuid(startupUuid);
        WorkspaceMember member = getActiveMember(startup, user);

        if (member.getRole() != WorkspaceRole.OWNER) {
            throw new UnauthorizedException("Only workspace owners can manage announcements");
        }

        Announcement announcement = announcementRepository.findByUuid(announcementUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        if (!announcement.getStartup().getId().equals(startup.getId())) {
            throw new UnauthorizedException("Announcement does not belong to this workspace");
        }

        announcement.setPinned(isPinned);
        announcement = announcementRepository.save(announcement);
        WorkspaceMember authorMember = workspaceMemberRepository.findByStartupAndUser(
                startup, announcement.getAuthor()).orElse(null);
        String authorRole = (authorMember != null && authorMember.getStatus() == WorkspaceMemberStatus.ACTIVE)
                ? authorMember.getRole().name() : "MEMBER";

        return AnnouncementResponse.fromEntity(announcement, authorRole);
    }

    // Helper methods
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Startup getStartupByUuid(UUID startupUuid) {
        Startup startup = startupRepository.findByUuid(startupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
        if (startup.isDeleted()) {
            throw new ResourceNotFoundException("Startup not found");
        }
        return startup;
    }

    private WorkspaceMember getActiveMember(Startup startup, User user) {
        WorkspaceMember member = workspaceMemberRepository.findByStartupAndUser(startup, user)
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this workspace"));
        if (member.getStatus() != WorkspaceMemberStatus.ACTIVE) {
            throw new UnauthorizedException("You are not an active member of this workspace");
        }
        return member;
    }
}
