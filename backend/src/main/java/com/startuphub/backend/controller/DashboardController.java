package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.DashboardOverviewResponse;
import com.startuphub.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{startupUuid}/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getDashboard(
            @PathVariable UUID startupUuid, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getOverview(authentication.getName(), startupUuid),
                "Dashboard overview retrieved"
        ));
    }
}
