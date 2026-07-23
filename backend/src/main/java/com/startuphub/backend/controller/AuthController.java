package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;

import com.startuphub.backend.dto.response.AuthResponse;
import com.startuphub.backend.service.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user session management")
public class AuthController {

    private final AuthService authService;

    // --- USER DATA ---

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the profile of the currently authenticated user.")
    public ResponseEntity<ApiResponse<AuthResponse.UserDetailsDto>> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new com.startuphub.backend.exception.UnauthorizedException("User is not authenticated");
        }
        AuthResponse.UserDetailsDto user = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(user, "User fetched successfully"));
    }

    @PostMapping("/sync")
    @Operation(summary = "Sync Clerk User", description = "Syncs and auto-creates the user based on Clerk authentication.")
    public ResponseEntity<ApiResponse<AuthResponse.UserDetailsDto>> syncUser(
            Authentication authentication,
            @Valid @RequestBody com.startuphub.backend.dto.request.SyncUserRequest request) {
        if (authentication == null) {
            throw new com.startuphub.backend.exception.UnauthorizedException("User is not authenticated");
        }
        
        String clerkId;
        if (authentication.getCredentials() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            clerkId = jwt.getSubject();
        } else if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            clerkId = jwt.getSubject();
        } else {
            clerkId = authentication.getName();
        }
        
        AuthResponse.UserDetailsDto user = authService.syncUser(clerkId, request);
        return ResponseEntity.ok(ApiResponse.success(user, "User synced successfully"));
    }
}
