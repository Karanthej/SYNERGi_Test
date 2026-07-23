package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.DashboardOverviewResponse;
import com.startuphub.backend.dto.response.TaskResponse;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.WorkspaceTask;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import com.startuphub.backend.repository.WorkspaceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceTaskRepository taskRepository;

    @Transactional(readOnly = true)
    public DashboardOverviewResponse getOverview(String clerkId, UUID startupUuid) {
        User user = userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Startup startup = startupRepository.findByUuid(startupUuid).orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
        
        if (!workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, user, WorkspaceMemberStatus.ACTIVE)) {
            throw new BadRequestException("Unauthorized access to workspace");
        }

        int activeTasks = taskRepository.countByStartup(startup);
        int teamSize = (int) workspaceMemberRepository.countByStartupAndStatus(startup, WorkspaceMemberStatus.ACTIVE);

        List<TaskResponse> recentTasks = taskRepository.findTop5ByStartupOrderByUpdatedAtDesc(startup)
                .stream().map(this::mapToResponse).collect(Collectors.toList());

        return DashboardOverviewResponse.builder()
                .startupName(startup.getName())
                .tagline(startup.getTagline())
                .stage(startup.getStage() != null ? startup.getStage().name() : null)
                .logoUrl(startup.getLogoUrl())
                .activeTaskCount(activeTasks)
                .teamMemberCount(teamSize)
                .upcomingMeetings(0) // placeholder — connect MeetingRepository for live count
                .recentTasks(recentTasks)
                .build();
    }

    private TaskResponse mapToResponse(WorkspaceTask task) {
        return TaskResponse.builder()
                .uuid(task.getUuid().toString())
                .startupUuid(task.getStartup().getUuid().toString())
                .title(task.getTitle())
                .description(task.getDescription())
                .assigneeUuid(task.getAssignee() != null ? task.getAssignee().getUuid().toString() : null)
                .assigneeName(task.getAssignee() != null ? task.getAssignee().getFullName() : null)
                .reporterUuid(task.getReporter().getUuid().toString())
                .reporterName(task.getReporter().getFullName())
                .priority(task.getPriority())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .build();
    }
}
