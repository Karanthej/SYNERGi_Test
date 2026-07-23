package com.startuphub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "call_analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_log_id", nullable = false)
    @JsonIgnore
    private CallLog callLog;

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
