package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CallLogResponse {
    private UUID uuid;
    private UUID callerId;
    private UUID receiverId;
    private String status;
    private Integer durationSeconds;
    private LocalDateTime startedAt;
    private com.startuphub.backend.dto.request.CallAnalyticsDto analytics;
    private boolean isDeletedForMe;
}

