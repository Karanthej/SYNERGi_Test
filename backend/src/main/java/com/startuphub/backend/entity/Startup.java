package com.startuphub.backend.entity;

import com.startuphub.backend.entity.enums.CommitmentType;
import com.startuphub.backend.entity.enums.StartupStage;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.entity.enums.WorkType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "startups", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"name", "founder_id"})
}, indexes = {
    @Index(name = "idx_startup_uuid", columnList = "uuid", unique = true),
    @Index(name = "idx_startup_founder", columnList = "founder_id"),
    @Index(name = "idx_startup_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("is_deleted = false")
public class Startup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, updatable = false, nullable = false)
    @Builder.Default
    private UUID uuid = UUID.randomUUID();

    // Basic Information
    @Column(nullable = false)
    private String name;

    private String logoUrl;
    private String coverUrl;
    @Column(columnDefinition = "TEXT")
    private String tagline;
    @Column(columnDefinition = "TEXT")
    private String pitch;

    // Description
    @Column(columnDefinition = "TEXT")
    private String problemStatement;
    @Column(columnDefinition = "TEXT")
    private String solution;
    @Column(columnDefinition = "TEXT")
    private String vision;
    @Column(columnDefinition = "TEXT")
    private String mission;
    @Column(columnDefinition = "TEXT")
    private String detailedDescription;
    @Column(columnDefinition = "TEXT")
    private String targetAudience;
    @Column(columnDefinition = "TEXT")
    private String businessModel;
    @Column(columnDefinition = "TEXT")
    private String revenueModel;
    @Column(columnDefinition = "TEXT")
    private String currentProgress;
    @Column(columnDefinition = "TEXT")
    private String roadmap;
    @Column(columnDefinition = "TEXT")
    private String futureGoals;

    // Startup Information
    private String industry;
    
    @Enumerated(EnumType.STRING)
    private StartupStage stage;
    
    private String teamSize;
    private String expectedTeamSize;
    
    @Builder.Default
    private Integer maxMembers = 10;
    
    private String timeline;
    private String launchGoal;

    // Work Details
    @Enumerated(EnumType.STRING)
    private CommitmentType commitmentType;
    
    @Enumerated(EnumType.STRING)
    private WorkType workType;
    
    private String city;
    
    private String equityAvailable;
    private String equityPercentage;

    // Audit and State
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StartupStatus status = StartupStatus.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "founder_id", nullable = false)
    private User founder;

    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<StartupRole> roles = new HashSet<>();

    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<StartupSkill> skills = new HashSet<>();

    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<StartupAttachment> attachments = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

