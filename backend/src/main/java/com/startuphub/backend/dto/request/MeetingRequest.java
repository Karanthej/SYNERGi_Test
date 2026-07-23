package com.startuphub.backend.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class MeetingRequest {
    private String title;
    private String description;
    private String type; // INSTANT, SCHEDULED
    private LocalDateTime scheduledStartTime;
    private LocalDateTime scheduledEndTime;
    private List<UUID> participantUuids;
}
