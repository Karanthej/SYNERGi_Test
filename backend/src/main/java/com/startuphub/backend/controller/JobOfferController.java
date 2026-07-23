package com.startuphub.backend.controller;

import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.request.CreateJobOfferRequest;
import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.JobOfferResponse;
import com.startuphub.backend.service.JobOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/job-offers")
@RequiredArgsConstructor
public class JobOfferController {

    private final JobOfferService jobOfferService;

    @PostMapping
    @PreAuthorize("hasRole('FOUNDER')")
    public ResponseEntity<ApiResponse<List<JobOfferResponse>>> createJobOffers(
            Principal principal,
            @RequestBody CreateJobOfferRequest request) {
        
        List<JobOfferResponse> responses = jobOfferService.createJobOffers(principal.getName(), request.getTalentUuid(), request.getStartupUuids());
        return ResponseEntity.ok(ApiResponse.success(responses, "Job offers sent successfully"));
    }

    @GetMapping("/talent")
    @PreAuthorize("hasRole('TALENT')")
    public ResponseEntity<ApiResponse<List<JobOfferResponse>>> getTalentJobOffers(Principal principal) {
        List<JobOfferResponse> responses = jobOfferService.getTalentJobOffers(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(responses, "Fetched talent job offers"));
    }

    @GetMapping("/founder")
    @PreAuthorize("hasRole('FOUNDER')")
    public ResponseEntity<ApiResponse<List<JobOfferResponse>>> getFounderJobOffers(Principal principal) {
        List<JobOfferResponse> responses = jobOfferService.getFounderJobOffers(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(responses, "Fetched founder job offers"));
    }

    @PostMapping("/{uuid}/reject")
    @PreAuthorize("hasRole('TALENT')")
    public ResponseEntity<ApiResponse<Void>> rejectJobOffer(
            Principal principal,
            @PathVariable String uuid) {
        
        jobOfferService.rejectJobOffer(principal.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Job offer rejected"));
    }

    @PostMapping("/{uuid}/apply")
    @PreAuthorize("hasRole('TALENT')")
    public ResponseEntity<ApiResponse<Void>> applyToJobOffer(
            Principal principal,
            @PathVariable String uuid,
            @RequestBody ApplicationRequest request) {
        
        jobOfferService.applyToJobOffer(principal.getName(), uuid, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Applied to job offer successfully"));
    }

    @DeleteMapping("/{uuid}")
    @PreAuthorize("hasRole('FOUNDER')")
    public ResponseEntity<ApiResponse<Void>> deleteJobOffer(
            Principal principal,
            @PathVariable String uuid) {
        
        jobOfferService.deleteJobOffer(principal.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Job offer deleted"));
    }
}
