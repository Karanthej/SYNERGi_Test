package com.startuphub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "startup_skills")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StartupSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String skillName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;
}
