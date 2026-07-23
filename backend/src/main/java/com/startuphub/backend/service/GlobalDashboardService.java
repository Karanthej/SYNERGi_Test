package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.FounderDashboardAnalyticsResponse;
import com.startuphub.backend.dto.response.TalentDashboardAnalyticsResponse;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.entity.enums.ApplicationStatus;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.StartupApplicationRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import com.startuphub.backend.repository.WorkspaceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GlobalDashboardService {

    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final StartupApplicationRepository startupApplicationRepository;
    private final WorkspaceTaskRepository workspaceTaskRepository;

    @Transactional(readOnly = true)
    public FounderDashboardAnalyticsResponse getFounderAnalytics(String clerkId) {
        User founder = userRepository.findByClerkId(clerkId).orElseThrow();
        
        List<Startup> founderStartups = startupRepository.findByFounderOrderByCreatedAtDesc(founder);
        long totalStartups = founderStartups.size();
        long publishedStartups = founderStartups.stream()
            .filter(s -> s.getStatus() == StartupStatus.PUBLISHED).count();
            
        long activeTeamMembers = 0;
        long pendingApplications = 0;
        long acceptedApplications = 0;
        
        if (!founderStartups.isEmpty()) {
            activeTeamMembers = workspaceMemberRepository.countByStartupInAndStatus(founderStartups, WorkspaceMemberStatus.ACTIVE);
            pendingApplications = startupApplicationRepository.countByStartupInAndStatus(founderStartups, ApplicationStatus.PENDING);
            acceptedApplications = startupApplicationRepository.countByStartupInAndStatus(founderStartups, ApplicationStatus.ACCEPTED);
        }
            
        return FounderDashboardAnalyticsResponse.builder()
                .totalStartups((int) totalStartups)
                .publishedStartups((int) publishedStartups)
                .activeTeamMembers((int) activeTeamMembers)
                .pendingApplications((int) pendingApplications)
                .acceptedApplications((int) acceptedApplications)
                .recentTasks(Collections.emptyList())
                .build();
    }

    @Transactional(readOnly = true)
    public TalentDashboardAnalyticsResponse getTalentAnalytics(String clerkId) {
        User talent = userRepository.findByClerkId(clerkId).orElseThrow();
        
        long applicationsSubmitted = startupApplicationRepository.countByTalent(talent);
        long acceptedStartups = startupApplicationRepository.countByTalentAndStatus(talent, ApplicationStatus.ACCEPTED);
        long assignedTasks = workspaceTaskRepository.countByAssignee(talent);
        
        return TalentDashboardAnalyticsResponse.builder()
                .applicationsSubmitted((int) applicationsSubmitted)
                .acceptedStartups((int) acceptedStartups)
                .assignedTasks((int) assignedTasks)
                .upcomingMeetings(0)
                .recentTasks(Collections.emptyList())
                .build();
    }
}
