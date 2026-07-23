package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.response.StartupResponse;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.service.StartupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/founder/startups")
@RequiredArgsConstructor
@Tag(name = "Founder Startups", description = "Endpoints for founders to manage their startups")
@PreAuthorize("hasRole('FOUNDER')")
public class StartupController {

    private final StartupService startupService;

    @GetMapping
    @Operation(summary = "Get My Startups", description = "Returns all startups created by the logged-in founder")
    public ResponseEntity<ApiResponse<List<StartupResponse>>> getMyStartups(Authentication authentication) {
        List<StartupResponse> startups = startupService.getMyStartups(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(startups, "Startups fetched successfully"));
    }

    @GetMapping("/{uuid}")
    @Operation(summary = "Get Startup by UUID", description = "Returns a specific startup by its UUID")
    public ResponseEntity<ApiResponse<StartupResponse>> getStartup(
            Authentication authentication, 
            @PathVariable UUID uuid) {
        StartupResponse startup = startupService.getStartupByUuid(authentication.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(startup, "Startup fetched successfully"));
    }

    @PostMapping
    @Operation(summary = "Create Startup", description = "Creates a new startup (Draft or Published)")
    public ResponseEntity<ApiResponse<StartupResponse>> createStartup(
            Authentication authentication, 
            @Valid @RequestBody StartupRequest request) {
        StartupResponse startup = startupService.createStartup(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(startup, "Startup created successfully"));
    }

    @PutMapping("/{uuid}")
    @Operation(summary = "Update Startup", description = "Updates an existing startup")
    public ResponseEntity<ApiResponse<StartupResponse>> updateStartup(
            Authentication authentication, 
            @PathVariable UUID uuid,
            @Valid @RequestBody StartupRequest request) {
        StartupResponse startup = startupService.updateStartup(authentication.getName(), uuid, request);
        return ResponseEntity.ok(ApiResponse.success(startup, "Startup updated successfully"));
    }

    @DeleteMapping("/{uuid}")
    @Operation(summary = "Delete Startup", description = "Soft deletes a startup")
    public ResponseEntity<ApiResponse<Void>> deleteStartup(
            Authentication authentication, 
            @PathVariable UUID uuid) {
        startupService.deleteStartup(authentication.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Startup deleted successfully"));
    }

    @PutMapping("/{uuid}/status")
    @Operation(summary = "Update Startup Status", description = "Changes status to DRAFT, PUBLISHED, or ARCHIVED")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            Authentication authentication, 
            @PathVariable UUID uuid,
            @RequestParam StartupStatus status) {
        startupService.updateStatus(authentication.getName(), uuid, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Startup status updated to " + status));
    }
}
