package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.TaskRequest;
import com.startuphub.backend.dto.response.TaskResponse;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.WorkspaceActivityLog;
import com.startuphub.backend.entity.WorkspaceTask;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceActivityLogRepository;
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
public class TaskService {

    private final WorkspaceTaskRepository taskRepository;
    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceActivityLogRepository activityLogRepository;

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(String email, UUID startupUuid) {
        Startup startup = getAuthorizedStartup(email, startupUuid);
        return taskRepository.findByStartupOrderByUpdatedAtDesc(startup)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse createTask(String email, UUID startupUuid, TaskRequest request) {
        User reporter = userRepository.findByEmail(email).orElseThrow();
        Startup startup = getAuthorizedStartup(email, startupUuid);

        User assignee = null;
        if (request.getAssigneeUuid() != null) {
            assignee = userRepository.findByUuid(request.getAssigneeUuid()).orElse(null);
        }

        WorkspaceTask task = WorkspaceTask.builder()
                .startup(startup)
                .title(request.getTitle())
                .description(request.getDescription())
                .reporter(reporter)
                .assignee(assignee)
                .priority(request.getPriority())
                .status(request.getStatus())
                .dueDate(request.getDueDate())
                .build();

        WorkspaceTask saved = taskRepository.save(task);

        logActivity(startup, reporter, "TASK_CREATED", "Created task: " + task.getTitle());

        return mapToResponse(saved);
    }

    @Transactional
    public TaskResponse updateTask(String email, UUID startupUuid, UUID taskUuid, TaskRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Startup startup = getAuthorizedStartup(email, startupUuid);
        WorkspaceTask task = taskRepository.findByUuid(taskUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getStartup().getId().equals(startup.getId())) {
            throw new BadRequestException("Task does not belong to this workspace");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        
        if (request.getStatus() != null && task.getStatus() != request.getStatus()) {
            task.setStatus(request.getStatus());
            logActivity(startup, user, "TASK_STATUS_CHANGED", "Moved task '" + task.getTitle() + "' to " + request.getStatus().name());
        }

        if (request.getAssigneeUuid() != null) {
            User assignee = userRepository.findByUuid(request.getAssigneeUuid()).orElse(null);
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }
        
        task.setDueDate(request.getDueDate());

        WorkspaceTask saved = taskRepository.save(task);
        return mapToResponse(saved);
    }
    
    @Transactional
    public void deleteTask(String email, UUID startupUuid, UUID taskUuid) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Startup startup = getAuthorizedStartup(email, startupUuid);
        WorkspaceTask task = taskRepository.findByUuid(taskUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
                
        if (!task.getStartup().getId().equals(startup.getId())) {
            throw new BadRequestException("Task does not belong to this workspace");
        }
        
        logActivity(startup, user, "TASK_DELETED", "Deleted task: " + task.getTitle());
        taskRepository.delete(task);
    }

    private Startup getAuthorizedStartup(String email, UUID startupUuid) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Startup startup = startupRepository.findByUuid(startupUuid).orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
        if (!workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, user, WorkspaceMemberStatus.ACTIVE)) {
            throw new BadRequestException("Unauthorized access to workspace");
        }
        return startup;
    }

    private void logActivity(Startup startup, User actor, String type, String description) {
        WorkspaceActivityLog log = WorkspaceActivityLog.builder()
                .startup(startup)
                .actor(actor)
                .actionType(type)
                .description(description)
                .build();
        activityLogRepository.save(log);
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
