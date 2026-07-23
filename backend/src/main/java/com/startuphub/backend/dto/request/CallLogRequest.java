package com.startuphub.backend.dto.request;

import lombok.Data;
import java.util.UUID;

@Data
public class CallLogRequest {
    private UUID uuid;
    private UUID callerId;
    private UUID receiverId;
    private String status; // ANSWERED, MISSED, REJECTED
    private Integer durationSeconds;
    private CallAnalyticsDto analytics;
}

