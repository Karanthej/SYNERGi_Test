package com.startuphub.backend.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    private String fullName;
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

    // Talent fields
    private String resumeUrl;
    private java.util.List<String> skills;
    private java.util.List<String> education;
    private java.util.List<String> experience;
    private java.util.List<String> projects;
    
    // Role update
    private String role;
}
