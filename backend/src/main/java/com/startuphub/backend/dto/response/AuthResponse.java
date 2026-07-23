package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserDetailsDto user;
    
    @Data
    @Builder
    public static class UserDetailsDto {
        private String uuid;
        private String fullName;
        private String username;
        private String email;
        private String role;
        private String accountStatus;
        
        @com.fasterxml.jackson.annotation.JsonProperty("isProfileComplete")
        private boolean isProfileComplete;
        private String profileImage;
    }
}
