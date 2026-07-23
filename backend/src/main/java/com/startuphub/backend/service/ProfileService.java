package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.*;
import com.startuphub.backend.dto.response.ProfileResponse;
import com.startuphub.backend.entity.*;
import com.startuphub.backend.entity.enums.AccountStatus;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final com.startuphub.backend.service.storage.FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public ProfileResponse getFullProfile(String clerkId) {
        User user = getUser(clerkId);
        UserProfile profile = userProfileRepository.findByUser(user).orElseGet(UserProfile::new);
        int completionScore = calculateProfileCompletion(user, profile);

        return ProfileResponse.builder()
                .user(ProfileResponse.UserData.builder()
                        .uuid(user.getUuid().toString())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .role(user.getRole().name())
                        .accountStatus(user.getAccountStatus().name())
                        .emailVerified(user.isEmailVerified())
                        .profileImage(user.getProfileImage())
                        .lastLogin(user.getLastLogin())
                        .createdAt(user.getCreatedAt())
                        .build())
                .profile(ProfileResponse.ProfileData.builder()
                        .bio(profile.getBio())
                        .phoneNumber(profile.getPhoneNumber())
                        .dateOfBirth(profile.getDateOfBirth())
                        .gender(profile.getGender())
                        .country(profile.getCountry())
                        .state(profile.getState())
                        .city(profile.getCity())
                        .companyName(profile.getCompanyName())
                        .startupName(profile.getStartupName())
                        .website(profile.getWebsite())
                        .linkedinUrl(profile.getLinkedinUrl())
                        .githubUrl(profile.getGithubUrl())
                        .portfolioUrl(profile.getPortfolioUrl())
                        .resumeUrl(profile.getResumeUrl())
                        .coverImageUrl(profile.getCoverImageUrl())
                        .profileCompletion(completionScore)
                        .skills(profile.getSkills())
                        .education(profile.getEducation())
                        .experience(profile.getExperience())
                        .projects(profile.getProjects())
                        .build())
                .build();
    }

    @Transactional
    public void updateProfile(String clerkId, ProfileUpdateRequest request) {
        User user = getUser(clerkId);
        
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getRole() != null) {
            try {
                user.setRole(com.startuphub.backend.entity.enums.Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role received in profile update: {}", request.getRole());
            }
        }
        userRepository.save(user);

        UserProfile profile = userProfileRepository.findByUser(user).orElseGet(() -> {
            UserProfile newProfile = new UserProfile();
            newProfile.setUser(user);
            return newProfile;
        });

        profile.setBio(request.getBio());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setCountry(request.getCountry());
        profile.setState(request.getState());
        profile.setCity(request.getCity());
        profile.setCompanyName(request.getCompanyName());
        profile.setStartupName(request.getStartupName());
        profile.setWebsite(request.getWebsite());
        profile.setLinkedinUrl(request.getLinkedinUrl());
        profile.setGithubUrl(request.getGithubUrl());
        profile.setPortfolioUrl(request.getPortfolioUrl());
        
        if (request.getResumeUrl() != null) profile.setResumeUrl(request.getResumeUrl());
        if (request.getSkills() != null) profile.setSkills(request.getSkills());
        if (request.getEducation() != null) profile.setEducation(request.getEducation());
        if (request.getExperience() != null) profile.setExperience(request.getExperience());
        if (request.getProjects() != null) profile.setProjects(request.getProjects());

        userProfileRepository.save(profile);
        log.info("User profile updated for: {}", clerkId);
    }

    // Removed changePassword, requestEmailChange, and verifyEmailChange as they are handled by Clerk

    @Transactional
    public void deactivateAccount(String clerkId) {
        User user = getUser(clerkId);
        user.setAccountStatus(AccountStatus.SUSPENDED);
        userRepository.save(user);
        log.info("Account deactivated for user: {}", clerkId);
    }

    // getActiveSessions and revokeSession removed as they are managed by Clerk

    @Transactional
    public String uploadProfileImage(String clerkId, org.springframework.web.multipart.MultipartFile file) {
        User user = getUser(clerkId);
        if (user.getProfileImage() != null) {
            fileStorageService.deleteFile(user.getProfileImage());
        }
        String imageUrl = fileStorageService.storeImage(file, "profiles/" + user.getId());
        user.setProfileImage(imageUrl);
        userRepository.save(user);
        return imageUrl;
    }

    @Transactional
    public void deleteProfileImage(String clerkId) {
        User user = getUser(clerkId);
        if (user.getProfileImage() != null) {
            fileStorageService.deleteFile(user.getProfileImage());
            user.setProfileImage(null);
            userRepository.save(user);
        }
    }

    @Transactional
    public String uploadCoverImage(String clerkId, org.springframework.web.multipart.MultipartFile file) {
        User user = getUser(clerkId);
        UserProfile profile = userProfileRepository.findByUser(user).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUser(user);
            return p;
        });
        
        if (profile.getCoverImageUrl() != null) {
            fileStorageService.deleteFile(profile.getCoverImageUrl());
        }
        String imageUrl = fileStorageService.storeImage(file, "covers/" + user.getId());
        profile.setCoverImageUrl(imageUrl);
        userProfileRepository.save(profile);
        return imageUrl;
    }

    @Transactional
    public void deleteCoverImage(String clerkId) {
        User user = getUser(clerkId);
        userProfileRepository.findByUser(user).ifPresent(profile -> {
            if (profile.getCoverImageUrl() != null) {
                fileStorageService.deleteFile(profile.getCoverImageUrl());
                profile.setCoverImageUrl(null);
                userProfileRepository.save(profile);
            }
        });
    }

    private User getUser(String clerkId) {
        return userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getPublicProfile(String identifier) {
        User user = null;
        try {
            user = userRepository.findByUuid(java.util.UUID.fromString(identifier)).orElse(null);
        } catch (IllegalArgumentException e) {
            // Not a UUID, try username
        }
        
        if (user == null) {
            user = userRepository.findByUsernameIgnoreCase(identifier)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        
        return getProfileByUser(user);
    }

    public ProfileResponse getProfileByUser(User user) {
        UserProfile profile = userProfileRepository.findByUser(user).orElseGet(UserProfile::new);
        
        return ProfileResponse.builder()
                .user(ProfileResponse.UserData.builder()
                        .uuid(user.getUuid().toString())
                        .fullName(user.getFullName())
                        .username(user.getUsername())
                        .role(user.getRole().name())
                        .profileImage(user.getProfileImage())
                        .build())
                .profile(ProfileResponse.ProfileData.builder()
                        .bio(profile.getBio())
                        .country(profile.getCountry())
                        .state(profile.getState())
                        .city(profile.getCity())
                        .companyName(profile.getCompanyName())
                        .startupName(profile.getStartupName())
                        .website(profile.getWebsite())
                        .linkedinUrl(profile.getLinkedinUrl())
                        .githubUrl(profile.getGithubUrl())
                        .portfolioUrl(profile.getPortfolioUrl())
                        .coverImageUrl(profile.getCoverImageUrl())
                        .skills(profile.getSkills())
                        .education(profile.getEducation())
                        .experience(profile.getExperience())
                        .projects(profile.getProjects())
                        .build())
                .build();
    }


    private int calculateProfileCompletion(User user, UserProfile profile) {
        int fields = 0;
        int maxFields = 15;
        
        if (user.getFullName() != null && !user.getFullName().isEmpty()) fields++;
        if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) fields++;
        
        if (profile.getBio() != null && !profile.getBio().isEmpty()) fields++;
        if (profile.getPhoneNumber() != null && !profile.getPhoneNumber().isEmpty()) fields++;
        if (profile.getDateOfBirth() != null) fields++;
        if (profile.getCountry() != null && !profile.getCountry().isEmpty()) fields++;
        if (profile.getCity() != null && !profile.getCity().isEmpty()) fields++;
        if (profile.getCoverImageUrl() != null && !profile.getCoverImageUrl().isEmpty()) fields++;
        if (profile.getLinkedinUrl() != null && !profile.getLinkedinUrl().isEmpty()) fields++;
        
        if (profile.getSkills() != null && !profile.getSkills().isEmpty()) fields++;
        if (profile.getEducation() != null && !profile.getEducation().isEmpty()) fields++;
        if (profile.getExperience() != null && !profile.getExperience().isEmpty()) fields++;
        if (profile.getProjects() != null && !profile.getProjects().isEmpty()) fields++;
        
        if (user.getRole() == com.startuphub.backend.entity.enums.Role.USER) {
            if (profile.getResumeUrl() != null && !profile.getResumeUrl().isEmpty()) fields++;
            if (profile.getPortfolioUrl() != null && !profile.getPortfolioUrl().isEmpty()) fields++;
        } else {
            if (profile.getCompanyName() != null && !profile.getCompanyName().isEmpty()) fields++;
            if (profile.getStartupName() != null && !profile.getStartupName().isEmpty()) fields++;
        }
        
        return (int) (((double) fields / maxFields) * 100);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.startuphub.backend.dto.response.ExploreUserResponse> exploreUsers(String search, String role, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<User> users;
        String roleParam = (role != null && !role.trim().isEmpty()) ? role.trim().toUpperCase() : null;
        
        if (search != null && !search.trim().isEmpty()) {
            String cleanSearch = search.trim();
            if (cleanSearch.startsWith("@")) {
                cleanSearch = cleanSearch.substring(1);
            }
            users = userRepository.searchUsers(cleanSearch, roleParam, pageable);
        } else {
            users = userRepository.searchUsers("", roleParam, pageable);
        }

        return users.map(user -> {
            UserProfile profile = userProfileRepository.findByUser(user).orElse(new UserProfile());
            return com.startuphub.backend.dto.response.ExploreUserResponse.builder()
                    .uuid(user.getUuid().toString())
                    .fullName(user.getFullName())
                    .username(user.getUsername())
                    .role(user.getRole().name())
                    .profileImage(user.getProfileImage())
                    .bio(profile.getBio())
                    .city(profile.getCity())
                    .country(profile.getCountry())
                    .skills(profile.getSkills())
                    .build();
        });
    }
}
