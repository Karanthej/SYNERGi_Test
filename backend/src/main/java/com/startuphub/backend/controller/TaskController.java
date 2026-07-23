package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.request.TaskRequest;
import com.startuphub.backend.dto.response.TaskResponse;
import com.startuphub.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{startupUuid}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasks(
            @PathVariable UUID startupUuid, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                taskService.getTasks(authentication.getName(), startupUuid),
                "Tasks retrieved successfully"
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable UUID startupUuid,
            @Valid @RequestBody TaskRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                taskService.createTask(authentication.getName(), startupUuid, request),
                "Task created successfully"
        ));
    }

    @PutMapping("/{taskUuid}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable UUID startupUuid,
            @PathVariable UUID taskUuid,
            @Valid @RequestBody TaskRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                taskService.updateTask(authentication.getName(), startupUuid, taskUuid, request),
                "Task updated successfully"
        ));
    }

    @DeleteMapping("/{taskUuid}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable UUID startupUuid,
            @PathVariable UUID taskUuid,
            Authentication authentication) {
        taskService.deleteTask(authentication.getName(), startupUuid, taskUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Task deleted successfully"));
    }
}
