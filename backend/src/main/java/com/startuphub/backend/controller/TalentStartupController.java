package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.ExploreStartupResponse;
import com.startuphub.backend.entity.enums.CommitmentType;
import com.startuphub.backend.entity.enums.StartupStage;
import com.startuphub.backend.entity.enums.WorkType;
import com.startuphub.backend.service.TalentStartupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/talent/startups")
@RequiredArgsConstructor
@Tag(name = "Talent Startups", description = "Endpoints for talent to explore and bookmark startups")
@PreAuthorize("hasRole('TALENT')")
public class TalentStartupController {

    private final TalentStartupService talentStartupService;

    @GetMapping("/explore")
    @Operation(summary = "Explore Startups", description = "Search and filter published startups")
    public ResponseEntity<ApiResponse<Page<ExploreStartupResponse>>> exploreStartups(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) StartupStage stage,
            @RequestParam(required = false) CommitmentType commitment,
            @RequestParam(required = false) WorkType workType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ExploreStartupResponse> result = talentStartupService.exploreStartups(
                authentication.getName(), search, industry, stage, commitment, workType, pageable);

        return ResponseEntity.ok(ApiResponse.success(result, "Startups fetched successfully"));
    }

    @GetMapping("/{uuid}")
    @Operation(summary = "Get Startup Details", description = "Get detailed view of a published startup")
    public ResponseEntity<ApiResponse<ExploreStartupResponse>> getStartupDetails(
            Authentication authentication,
            @PathVariable UUID uuid) {
        ExploreStartupResponse response = talentStartupService.getStartupDetails(authentication.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(response, "Startup details fetched successfully"));
    }

    @PostMapping("/{uuid}/bookmark")
    @Operation(summary = "Bookmark Startup", description = "Bookmark a startup")
    public ResponseEntity<ApiResponse<Void>> bookmarkStartup(
            Authentication authentication,
            @PathVariable UUID uuid) {
        talentStartupService.bookmarkStartup(authentication.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Startup bookmarked successfully"));
    }

    @DeleteMapping("/{uuid}/bookmark")
    @Operation(summary = "Remove Bookmark", description = "Remove bookmark from a startup")
    public ResponseEntity<ApiResponse<Void>> unbookmarkStartup(
            Authentication authentication,
            @PathVariable UUID uuid) {
        talentStartupService.unbookmarkStartup(authentication.getName(), uuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Bookmark removed successfully"));
    }

    @GetMapping("/bookmarks")
    @Operation(summary = "Get Bookmarked Startups", description = "Get paginated list of bookmarked startups")
    public ResponseEntity<ApiResponse<Page<ExploreStartupResponse>>> getBookmarkedStartups(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
            
        Pageable pageable = PageRequest.of(page, size);
        Page<ExploreStartupResponse> result = talentStartupService.getBookmarkedStartups(authentication.getName(), pageable);
        
        return ResponseEntity.ok(ApiResponse.success(result, "Bookmarks fetched successfully"));
    }
}
