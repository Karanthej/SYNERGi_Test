package com.startuphub.backend.dto.request;

import com.startuphub.backend.entity.enums.TaskPriority;
import com.startuphub.backend.entity.enums.TaskStatus;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TaskRequest {
    private String title;
    private String description;
    private UUID assigneeUuid;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDateTime dueDate;
}
