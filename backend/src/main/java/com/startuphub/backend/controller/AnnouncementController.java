package com.startuphub.backend.controller;

import com.startuphub.backend.dto.request.AnnouncementRequest;
import com.startuphub.backend.dto.response.AnnouncementResponse;
import com.startuphub.backend.security.CustomUserDetails;
import com.startuphub.backend.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{startupUuid}/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncements(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID startupUuid) {
        return ResponseEntity.ok(announcementService.getAnnouncements(userDetails.getUsername(), startupUuid));
    }

    @PostMapping
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID startupUuid,
            @Valid @RequestBody AnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.createAnnouncement(userDetails.getUsername(), startupUuid, request));
    }

    @DeleteMapping("/{announcementUuid}")
    public ResponseEntity<Void> deleteAnnouncement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID startupUuid,
            @PathVariable UUID announcementUuid) {
        announcementService.deleteAnnouncement(userDetails.getUsername(), startupUuid, announcementUuid);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{announcementUuid}/pin")
    public ResponseEntity<AnnouncementResponse> togglePin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID startupUuid,
            @PathVariable UUID announcementUuid,
            @RequestParam boolean isPinned) {
        return ResponseEntity.ok(announcementService.togglePin(userDetails.getUsername(), startupUuid, announcementUuid, isPinned));
    }
}
