package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.ApplicationResponse;
import com.startuphub.backend.entity.enums.ApplicationStatus;
import com.startuphub.backend.service.FounderApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/founder")
@RequiredArgsConstructor
@Tag(name = "Founder Applications", description = "Endpoints for founders to manage applications")
@PreAuthorize("hasRole('FOUNDER')")
public class FounderApplicationController {

    private final FounderApplicationService founderApplicationService;

    @GetMapping("/startups/{uuid}/applications")
    @Operation(summary = "Get Startup Applications", description = "Get a list of applications for a specific startup")
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getStartupApplications(
            Authentication authentication,
            @PathVariable UUID uuid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ApplicationResponse> response = founderApplicationService.getStartupApplications(
                authentication.getName(), uuid, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(response, "Applications fetched successfully"));
    }

    @GetMapping("/applications/{appUuid}")
    @Operation(summary = "Get Application Details", description = "Get details of a specific application")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplicationDetails(
            Authentication authentication,
            @PathVariable UUID appUuid) {
        ApplicationResponse response = founderApplicationService.getApplicationDetails(authentication.getName(), appUuid);
        return ResponseEntity.ok(ApiResponse.success(response, "Application details fetched successfully"));
    }

    @PutMapping("/applications/{appUuid}/status")
    @Operation(summary = "Update Application Status", description = "Update the status of an application")
    public ResponseEntity<ApiResponse<Void>> updateApplicationStatus(
            Authentication authentication,
            @PathVariable UUID appUuid,
            @RequestParam ApplicationStatus status) {
        founderApplicationService.updateApplicationStatus(authentication.getName(), appUuid, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Application status updated successfully"));
    }
}
