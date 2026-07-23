package com.startuphub.backend.controller;

import com.startuphub.backend.dto.request.CallAnalyticsDto;
import com.startuphub.backend.service.CallLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/calls/{callId}/analytics")
@RequiredArgsConstructor
public class CallAnalyticsController {

    private final CallLogService callLogService;

    @PostMapping
    public ResponseEntity<?> saveAnalytics(
            @PathVariable UUID workspaceId,
            @PathVariable UUID callId,
            @RequestBody CallAnalyticsDto dto) {
        callLogService.saveAnalytics(callId, dto);
        return ResponseEntity.ok().build();
    }
}
