package com.startuphub.backend.service.auth;

import com.startuphub.backend.dto.response.AuthResponse;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.AccountStatus;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public AuthResponse.UserDetailsDto getCurrentUser(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        return AuthResponse.UserDetailsDto.builder()
                .uuid(user.getUuid().toString())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .accountStatus(user.getAccountStatus().name())
                .isProfileComplete(userProfileRepository.existsByUserEmail(user.getEmail()))
                .profileImage(user.getProfileImage())
                .build();
    }

    @Transactional
    public AuthResponse.UserDetailsDto syncUser(String clerkId, com.startuphub.backend.dto.request.SyncUserRequest request) {
        User user = userRepository.findByClerkId(clerkId).orElse(null);
        if (user == null) {
            user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user != null) {
                user.setClerkId(clerkId);
                if (request.getProfileImage() != null && user.getProfileImage() == null) {
                    user.setProfileImage(request.getProfileImage());
                }
            } else {
                String baseUsername = request.getEmail().split("@")[0];
                if (baseUsername.length() > 10) baseUsername = baseUsername.substring(0, 10);
                
                Role userRole = Role.USER;
                try {
                    if (request.getRole() != null) {
                        userRole = Role.valueOf(request.getRole().toUpperCase());
                    }
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid role received in sync: {}", request.getRole());
                }

                user = User.builder()
                        .clerkId(clerkId)
                        .email(request.getEmail())
                        .fullName(request.getFullName())
                        .profileImage(request.getProfileImage())
                        .username(baseUsername + "_" + UUID.randomUUID().toString().substring(0, 8))
                        .passwordHash("{noop}clerk_managed_" + UUID.randomUUID().toString())
                        .role(userRole)
                        .accountStatus(AccountStatus.ACTIVE)
                        .emailVerified(true)
                        .build();
            }
            userRepository.save(user);
        }

        return AuthResponse.UserDetailsDto.builder()
                .uuid(user.getUuid().toString())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .accountStatus(user.getAccountStatus().name())
                .isProfileComplete(userProfileRepository.existsByUserEmail(user.getEmail()))
                .profileImage(user.getProfileImage())
                .build();
    }
}
