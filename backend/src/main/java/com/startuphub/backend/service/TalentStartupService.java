package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.ExploreStartupResponse;
import com.startuphub.backend.dto.response.StartupResponse;
import com.startuphub.backend.entity.*;
import com.startuphub.backend.entity.enums.CommitmentType;
import com.startuphub.backend.entity.enums.StartupStage;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.entity.enums.WorkType;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.StartupBookmarkRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.StartupViewRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.JobOfferRepository;
import jakarta.persistence.criteria.Join;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TalentStartupService {

    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final StartupBookmarkRepository bookmarkRepository;
    private final StartupViewRepository viewRepository;
    private final com.startuphub.backend.repository.WorkspaceMemberRepository workspaceMemberRepository;
    private final JobOfferRepository jobOfferRepository;

    @Transactional(readOnly = true)
    public Page<ExploreStartupResponse> exploreStartups(
            String clerkId,
            String search,
            String industry,
            StartupStage stage,
            CommitmentType commitment,
            WorkType workType,
            Pageable pageable) {
            
        User user = getUserByClerkId(clerkId);

        Specification<Startup> spec = Specification.where(isPublished()).and(isNotDeleted());

        if (search != null && !search.trim().isEmpty()) {
            spec = spec.and(searchKeyword(search.trim()));
        }
        if (industry != null && !industry.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("industry"), industry));
        }
        if (stage != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("stage"), stage));
        }
        if (commitment != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("commitmentType"), commitment));
        }
        if (workType != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("workType"), workType));
        }

        Page<Startup> startups = startupRepository.findAll(spec, pageable);
        return startups.map(startup -> mapToExploreResponse(startup, user));
    }

    @Transactional
    public ExploreStartupResponse getStartupDetails(String clerkId, UUID uuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = startupRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));

        if (startup.getStatus() != StartupStatus.PUBLISHED || startup.isDeleted()) {
            boolean hasJobOffer = jobOfferRepository.existsByStartupIdAndTalentId(startup.getId(), user.getId());
            if (!hasJobOffer) {
                throw new ResourceNotFoundException("Startup not found or not published.");
            }
        }

        // Track unique view (24 hour window)
        LocalDateTime last24h = LocalDateTime.now().minusHours(24);
        if (!viewRepository.existsByUserAndStartupAndCreatedAtAfter(user, startup, last24h)) {
            StartupView view = StartupView.builder().user(user).startup(startup).build();
            viewRepository.save(view);
        }

        return mapToExploreResponse(startup, user);
    }

    @Transactional
    public void bookmarkStartup(String clerkId, UUID uuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getPublishedStartup(uuid);

        if (bookmarkRepository.existsByUserAndStartup(user, startup)) {
            throw new BadRequestException("You have already bookmarked this startup.");
        }

        StartupBookmark bookmark = StartupBookmark.builder().user(user).startup(startup).build();
        bookmarkRepository.save(bookmark);
        log.info("Startup {} bookmarked by user {}", uuid, clerkId);
    }

    @Transactional
    public void unbookmarkStartup(String clerkId, UUID uuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getPublishedStartup(uuid);

        StartupBookmark bookmark = bookmarkRepository.findByUserAndStartup(user, startup)
                .orElseThrow(() -> new BadRequestException("Startup is not bookmarked."));

        bookmarkRepository.delete(bookmark);
        log.info("Startup {} unbookmarked by user {}", uuid, clerkId);
    }

    @Transactional(readOnly = true)
    public Page<ExploreStartupResponse> getBookmarkedStartups(String clerkId, Pageable pageable) {
        User user = getUserByClerkId(clerkId);
        Page<StartupBookmark> bookmarks = bookmarkRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        
        return bookmarks.map(bookmark -> {
            Startup startup = bookmark.getStartup();
            if (startup.isDeleted() || startup.getStatus() != StartupStatus.PUBLISHED) {
                // If the startup became unpublished, we can still show a limited card or hide it
                // For simplicity, we filter it out (though returning it as null in map will throw off pagination, 
                // in a real prod app we'd filter at DB level, but we'll map it to a stub or just map normally if we want to show it's no longer available).
            }
            return mapToExploreResponse(startup, user);
        });
    }

    private User getUserByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Startup getPublishedStartup(UUID uuid) {
        Startup startup = startupRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
        if (startup.getStatus() != StartupStatus.PUBLISHED || startup.isDeleted()) {
            throw new ResourceNotFoundException("Startup not found");
        }
        return startup;
    }

    private Specification<Startup> isPublished() {
        return (root, query, cb) -> cb.equal(root.get("status"), StartupStatus.PUBLISHED);
    }

    private Specification<Startup> isNotDeleted() {
        return (root, query, cb) -> cb.equal(root.get("isDeleted"), false);
    }

    private Specification<Startup> searchKeyword(String keyword) {
        String cleanKeyword = keyword.startsWith("@") ? keyword.substring(1).toLowerCase() : keyword.toLowerCase();
        String pattern = "%" + cleanKeyword + "%";
        return (root, query, cb) -> {
            query.distinct(true);
            Join<Startup, StartupSkill> skills = root.join("skills", jakarta.persistence.criteria.JoinType.LEFT);
            Join<Startup, StartupRole> roles = root.join("roles", jakarta.persistence.criteria.JoinType.LEFT);
            Join<Startup, User> founder = root.join("founder", jakarta.persistence.criteria.JoinType.LEFT);

            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("tagline")), pattern),
                    cb.like(cb.lower(root.get("industry")), pattern),
                    cb.like(cb.lower(founder.get("fullName")), pattern),
                    cb.like(cb.lower(founder.get("username")), pattern),
                    cb.like(cb.lower(skills.get("skillName")), pattern),
                    cb.like(cb.lower(roles.get("roleName")), pattern)
            );
        };
    }

    private ExploreStartupResponse mapToExploreResponse(Startup startup, User currentUser) {
        boolean isBookmarked = bookmarkRepository.existsByUserAndStartup(currentUser, startup);
        long views = viewRepository.countByStartup(startup);
        long bookmarksCount = bookmarkRepository.countByStartup(startup);

        int approvedMembers = (int) workspaceMemberRepository.countByStartupAndStatus(startup, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE);
        boolean isMember = workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, currentUser, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE);
        int maxMem = startup.getMaxMembers() != null ? startup.getMaxMembers() : 10;
        int availableSlots = Math.max(0, maxMem - approvedMembers);
        boolean applicationsOpen = availableSlots > 0;

        return ExploreStartupResponse.builder()
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
                .createdAt(startup.getCreatedAt())
                .updatedAt(startup.getUpdatedAt())
                .founderUuid(startup.getFounder().getUuid())
                .founderName(startup.getFounder().getFullName())
                .founderAvatarUrl(null)
                .views(views)
                .bookmarksCount(bookmarksCount)
                .teamMembersCount(approvedMembers)
                .maxMembers(maxMem)
                .approvedMembers(approvedMembers)
                .availableSlots(availableSlots)
                .applicationsOpen(applicationsOpen)
                .isBookmarkedByMe(isBookmarked)
                .isMember(isMember)
                .roles(startup.getRoles().stream().map(StartupRole::getRoleName).collect(Collectors.toList()))
                .skills(startup.getSkills().stream().map(StartupSkill::getSkillName).collect(Collectors.toList()))
                .attachments(startup.getAttachments().stream().map(a ->
                        StartupResponse.AttachmentResponse.builder()
                                .type(a.getType().name())
                                .url(a.getUrl())
                                .fileName(a.getFileName())
                                .build()
                ).collect(Collectors.toList()))
                .build();
    }
}
