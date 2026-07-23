package com.startuphub.backend.dto.request;

import com.startuphub.backend.entity.enums.AnnouncementPriority;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class AnnouncementRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Priority is required")
    private AnnouncementPriority priority;

    private boolean isPinned;
}
