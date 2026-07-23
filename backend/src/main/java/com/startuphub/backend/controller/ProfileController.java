package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.request.*;
import com.startuphub.backend.dto.response.ProfileResponse;
import com.startuphub.backend.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Profile & Account", description = "Endpoints for user profile and account management")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @Operation(summary = "Get Full Profile", description = "Returns the user profile.")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(Authentication authentication) {
        ProfileResponse response = profileService.getFullProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Profile fetched successfully"));
    }

    @PutMapping
    @Operation(summary = "Update Profile", description = "Updates the user's profile information.")
    public ResponseEntity<ApiResponse<Void>> updateProfile(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        profileService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Profile updated successfully"));
    }

    // Removed change password, email change, and sessions endpoints as they are handled by Clerk
    @GetMapping("/{uuid}")
    @Operation(summary = "Get Public Profile", description = "Returns the public profile information of a user.")
    public ResponseEntity<ApiResponse<ProfileResponse>> getPublicProfile(@PathVariable String uuid) {
        ProfileResponse response = profileService.getPublicProfile(uuid);
        return ResponseEntity.ok(ApiResponse.success(response, "Public profile fetched successfully"));
    }

    @PostMapping("/image")
    @Operation(summary = "Upload Profile Image", description = "Uploads a new profile image (avatar).")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfileImage(
            Authentication authentication, 
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String url = profileService.uploadProfileImage(authentication.getName(), file);
        return ResponseEntity.ok(ApiResponse.success(Map.of("imageUrl", url), "Profile image uploaded successfully"));
    }

    @DeleteMapping("/image")
    @Operation(summary = "Delete Profile Image", description = "Deletes the current profile image.")
    public ResponseEntity<ApiResponse<Void>> deleteProfileImage(Authentication authentication) {
        profileService.deleteProfileImage(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Profile image deleted successfully"));
    }

    @PostMapping("/cover")
    @Operation(summary = "Upload Cover Image", description = "Uploads a new cover/banner image.")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadCoverImage(
            Authentication authentication, 
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String url = profileService.uploadCoverImage(authentication.getName(), file);
        return ResponseEntity.ok(ApiResponse.success(Map.of("coverImageUrl", url), "Cover image uploaded successfully"));
    }

    @DeleteMapping("/cover")
    @Operation(summary = "Delete Cover Image", description = "Deletes the current cover/banner image.")
    public ResponseEntity<ApiResponse<Void>> deleteCoverImage(Authentication authentication) {
        profileService.deleteCoverImage(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Cover image deleted successfully"));
    }

    @GetMapping("/explore")
    @Operation(summary = "Explore Users", description = "Returns a paginated list of active users matching the search query.")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.startuphub.backend.dto.response.ExploreUserResponse>>> exploreUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? org.springframework.data.domain.Sort.by(sortBy).ascending() 
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(profileService.exploreUsers(search, role, pageable), "Users fetched successfully"));
    }
}
