package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.FounderDashboardAnalyticsResponse;
import com.startuphub.backend.dto.response.TalentDashboardAnalyticsResponse;
import com.startuphub.backend.service.GlobalDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class GlobalDashboardController {

    private final GlobalDashboardService dashboardService;

    @GetMapping("/founder")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FOUNDER')")
    public ResponseEntity<ApiResponse<FounderDashboardAnalyticsResponse>> getFounderAnalytics(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getFounderAnalytics(auth.getName()), "Analytics retrieved"));
    }

    @GetMapping("/talent")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('TALENT')")
    public ResponseEntity<ApiResponse<TalentDashboardAnalyticsResponse>> getTalentAnalytics(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getTalentAnalytics(auth.getName()), "Analytics retrieved"));
    }
}

