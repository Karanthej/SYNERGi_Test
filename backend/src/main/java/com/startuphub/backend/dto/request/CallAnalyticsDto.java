package com.startuphub.backend.dto.request;

import lombok.Data;

@Data
public class CallAnalyticsDto {
    private Double averageRtt;
    private Double maxRtt;
    private Double averageJitter;
    private Double maxJitter;
    private Double averagePacketLoss;
    private Double maxPacketLoss;
    private Double averageBitrate;
    private Double minBitrate;
    private Double maxBitrate;
    private Integer iceRestarts;
    private Integer reconnections;
    private Boolean turnUsed;
    private Boolean stunUsed;
    private String selectedCandidateType;
    private Integer muteCount;
    private Integer deviceChanges;
    private Boolean audioConstraintSupported;
    private Integer micPermissionFailures;
    private String browser;
    private String os;
    private Double cpuUsage;
    private Double memoryUsage;
}
