package com.startuphub.backend.entity;

import com.startuphub.backend.entity.enums.JobOfferStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_offers", indexes = {
    @Index(name = "idx_job_offer_startup", columnList = "startup_id"),
    @Index(name = "idx_job_offer_founder", columnList = "founder_id"),
    @Index(name = "idx_job_offer_talent", columnList = "talent_id"),
    @Index(name = "idx_job_offer_status", columnList = "status"),
    @Index(name = "idx_job_offer_uuid", columnList = "uuid", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "founder_id", nullable = false)
    private User founder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "talent_id", nullable = false)
    private User talent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobOfferStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = JobOfferStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
