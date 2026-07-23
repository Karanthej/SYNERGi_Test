package com.startuphub.backend.entity;

import com.startuphub.backend.entity.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "startup_applications", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "startup_id"})
}, indexes = {
    @Index(name = "idx_application_startup", columnList = "startup_id"),
    @Index(name = "idx_application_status", columnList = "status"),
    @Index(name = "idx_application_uuid", columnList = "uuid", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StartupApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User talent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    // Personal Introduction
    @Column(length = 1000)
    private String introduction;
    @Column(length = 2000)
    private String whyJoin;
    @Column(length = 2000)
    private String whyRightFit;

    // Professional Info
    private String preferredRole;
    private String yearsExperience;
    private String currentOccupation;
    private String skills;
    private String technologiesKnown;

    // Portfolio
    private String resumeUrl;
    private String portfolioUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String personalWebsiteUrl;

    // Availability
    private String hoursAvailable;
    private String preferredWorkingStyle;
    private String availableStartDate;

    // Additional Info
    private String previousStartupExperience;
    private String openSourceContributions;
    private String achievements;
    @Column(length = 2000)
    private String additionalNotes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = ApplicationStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
