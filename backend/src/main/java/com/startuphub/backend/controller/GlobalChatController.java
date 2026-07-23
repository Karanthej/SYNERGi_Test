package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.ChatNotificationResponse;
import com.startuphub.backend.service.ChatNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/global-chat")
@RequiredArgsConstructor
public class GlobalChatController {

    private final ChatNotificationService chatNotificationService;

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<ChatNotificationResponse>>> getNotifications(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatNotificationService.getNotifications(authentication.getName()),
                "Unread chat notifications retrieved successfully"
        ));
    }
}
