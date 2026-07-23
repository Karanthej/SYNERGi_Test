package com.startuphub.backend.entity;

import com.startuphub.backend.entity.enums.AccountStatus;
import com.startuphub.backend.entity.enums.PresenceStatus;
import com.startuphub.backend.entity.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true),
    @Index(name = "idx_user_uuid", columnList = "uuid", unique = true),
    @Index(name = "idx_user_username", columnList = "username", unique = true),
    @Index(name = "idx_user_clerk_id", columnList = "clerkId", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, updatable = false)
    @Builder.Default
    private UUID uuid = UUID.randomUUID();

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(unique = true, length = 100)
    private String clerkId;

    @Column(unique = true, length = 20)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountStatus accountStatus;

    @Column(nullable = false)
    private boolean emailVerified;

    private String profileImage;

    @Column(nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    private LocalDateTime accountLockedUntil;
    
    private LocalDateTime lastLogin;
    
    private LocalDateTime lastSeen;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private PresenceStatus presenceStatus = PresenceStatus.ONLINE;
}



