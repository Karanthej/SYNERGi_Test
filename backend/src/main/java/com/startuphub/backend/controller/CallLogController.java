package com.startuphub.backend.controller;

import com.startuphub.backend.dto.request.CallLogRequest;
import com.startuphub.backend.dto.response.CallLogResponse;
import com.startuphub.backend.service.CallLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/calls")
@RequiredArgsConstructor
public class CallLogController {

    private final CallLogService callLogService;

    @PostMapping
    public ResponseEntity<CallLogResponse> logCall(
            @PathVariable UUID workspaceId,
            @RequestBody CallLogRequest request) {
        return ResponseEntity.ok(callLogService.logCall(workspaceId, request));
    }

    @GetMapping("/user/{user1Id}/with/{user2Id}")
    public ResponseEntity<List<CallLogResponse>> getCallHistory(
            @PathVariable UUID workspaceId,
            @PathVariable UUID user1Id,
            @PathVariable UUID user2Id) {
        return ResponseEntity.ok(callLogService.getCallHistory(workspaceId, user1Id, user2Id));
    }

    @GetMapping
    public ResponseEntity<List<CallLogResponse>> getWorkspaceCalls(
            @PathVariable UUID workspaceId) {
        return ResponseEntity.ok(callLogService.getWorkspaceCalls(workspaceId));
    }
}

