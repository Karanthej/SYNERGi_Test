package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.request.MeetingRequest;
import com.startuphub.backend.dto.response.MeetingResponse;
import com.startuphub.backend.service.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{startupUuid}/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping
    public ResponseEntity<ApiResponse<MeetingResponse>> createMeeting(
            @PathVariable UUID startupUuid,
            @RequestBody MeetingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                meetingService.createMeeting(authentication.getName(), startupUuid, request),
                "Meeting created successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MeetingResponse>>> getMeetings(
            @PathVariable UUID startupUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                meetingService.getMeetings(authentication.getName(), startupUuid),
                "Meetings retrieved successfully"
        ));
    }

    @GetMapping("/{meetingUuid}")
    public ResponseEntity<ApiResponse<MeetingResponse>> getMeeting(
            @PathVariable UUID startupUuid,
            @PathVariable UUID meetingUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                meetingService.getMeeting(authentication.getName(), startupUuid, meetingUuid),
                "Meeting retrieved successfully"
        ));
    }

    @PostMapping("/{meetingUuid}/join")
    public ResponseEntity<ApiResponse<Void>> joinMeeting(
            @PathVariable UUID startupUuid,
            @PathVariable UUID meetingUuid,
            Authentication authentication) {
        meetingService.joinMeeting(authentication.getName(), startupUuid, meetingUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Joined meeting successfully"));
    }

    @PostMapping("/{meetingUuid}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveMeeting(
            @PathVariable UUID startupUuid,
            @PathVariable UUID meetingUuid,
            Authentication authentication) {
        meetingService.leaveMeeting(authentication.getName(), startupUuid, meetingUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Left meeting successfully"));
    }

    @PostMapping("/{meetingUuid}/end")
    public ResponseEntity<ApiResponse<Void>> endMeeting(
            @PathVariable UUID startupUuid,
            @PathVariable UUID meetingUuid,
            Authentication authentication) {
        meetingService.endMeeting(authentication.getName(), startupUuid, meetingUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Meeting ended successfully"));
    }
}
