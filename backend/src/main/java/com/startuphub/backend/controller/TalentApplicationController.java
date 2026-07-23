package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.response.ApplicationResponse;
import com.startuphub.backend.service.TalentApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/talent")
@RequiredArgsConstructor
@Tag(name = "Talent Applications", description = "Endpoints for talents to apply and manage their applications")
@PreAuthorize("hasRole('TALENT')")
public class TalentApplicationController {

    private final TalentApplicationService talentApplicationService;

    @PostMapping("/startups/{uuid}/apply")
    @Operation(summary = "Apply to Startup", description = "Submit an application to a startup")
    public ResponseEntity<ApiResponse<ApplicationResponse>> apply(
            Authentication authentication,
            @PathVariable UUID uuid,
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse response = talentApplicationService.apply(authentication.getName(), uuid, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Application submitted successfully"));
    }

    @PutMapping("/applications/{appUuid}/withdraw")
    @Operation(summary = "Withdraw Application", description = "Withdraw a pending application")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            Authentication authentication,
            @PathVariable UUID appUuid) {
        talentApplicationService.withdraw(authentication.getName(), appUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Application withdrawn successfully"));
    }

    @GetMapping("/applications")
    @Operation(summary = "Get My Applications", description = "Get a list of all applications submitted by the talent")
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getMyApplications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Page<ApplicationResponse> response = talentApplicationService.getMyApplications(
                authentication.getName(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(response, "Applications fetched successfully"));
    }
    
    @GetMapping("/startups/{uuid}/application-status")
    @Operation(summary = "Get Application Status", description = "Check if the user has applied to this startup")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplicationStatus(
            Authentication authentication,
            @PathVariable UUID uuid) {
        ApplicationResponse response = talentApplicationService.getApplicationForStartup(authentication.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(response, "Status fetched"));
    }
}
