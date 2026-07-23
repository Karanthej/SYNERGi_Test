package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ProfileResponse {
    
    private UserData user;
    private ProfileData profile;

    @Data
    @Builder
    public static class UserData {
        private String uuid;
        private String fullName;
        private String email;
        private String username;
        private String role;
        private String accountStatus;
        private boolean emailVerified;
        private String profileImage;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class ProfileData {
        private String bio;
        private String phoneNumber;
        private LocalDate dateOfBirth;
        private String gender;
        private String country;
        private String state;
        private String city;
        private String companyName;
        private String startupName;
        private String website;
        private String linkedinUrl;
        private String githubUrl;
        private String portfolioUrl;
        private String resumeUrl;
        private String coverImageUrl;
        private int profileCompletion;

        private List<String> skills;
        private List<String> education;
        private List<String> experience;
        private List<String> projects;
    }
}
