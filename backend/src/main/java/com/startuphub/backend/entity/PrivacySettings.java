package com.startuphub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "privacy_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacySettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String profileVisibility = "PUBLIC"; // PUBLIC, CONNECTIONS, PRIVATE
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String contactVisibility = "CONNECTIONS"; // PUBLIC, CONNECTIONS, PRIVATE
    @Column(name = "show_startup_profile")
    @Builder.Default
    private boolean showStartupProfile = true;
}

