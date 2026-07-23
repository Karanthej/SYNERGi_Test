package com.startuphub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile extends BaseEntity {

    @Column(columnDefinition = "TEXT")
    private String overview;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 20)
    private String phoneNumber;

    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String country;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String city;

    @Column(length = 150)
    private String companyName;

    @Column(length = 150)
    private String startupName;

    private String website;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;

    private String resumeUrl;
    
    private String coverImageUrl;

    @ElementCollection
    @CollectionTable(name = "user_projects", joinColumns = @JoinColumn(name = "user_profile_id"))
    @Column(name = "project", columnDefinition = "TEXT")
    @Builder.Default
    private java.util.List<String> projects = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_profile_id"))
    @Column(name = "skill")
    @Builder.Default
    private java.util.List<String> skills = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_education", joinColumns = @JoinColumn(name = "user_profile_id"))
    @Column(name = "education_entry")
    @Builder.Default
    private java.util.List<String> education = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_experience", joinColumns = @JoinColumn(name = "user_profile_id"))
    @Column(name = "experience_entry")
    @Builder.Default
    private java.util.List<String> experience = new java.util.ArrayList<>();
}


