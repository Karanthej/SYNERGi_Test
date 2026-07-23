package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.WorkspaceMemberResponse;
import com.startuphub.backend.dto.response.WorkspaceResponse;
import com.startuphub.backend.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getMyWorkspaces(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                workspaceService.getMyWorkspaces(authentication.getName()),
                "Workspaces retrieved successfully"
        ));
    }

    @GetMapping("/{uuid}/members")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>> getWorkspaceMembers(
            @PathVariable UUID uuid, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                workspaceService.getWorkspaceMembers(authentication.getName(), uuid),
                "Workspace members retrieved successfully"
        ));
    }

    @DeleteMapping("/{uuid}/members/{memberUuid}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID uuid, @PathVariable UUID memberUuid, Authentication authentication) {
        workspaceService.removeMember(authentication.getName(), uuid, memberUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }
}
