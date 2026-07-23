package com.startuphub.backend.dto.response;

import com.startuphub.backend.entity.enums.TaskPriority;
import com.startuphub.backend.entity.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {
    private String uuid;
    private String startupUuid;
    private String title;
    private String description;
    private String assigneeUuid;
    private String assigneeName;
    private String reporterUuid;
    private String reporterName;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
}
