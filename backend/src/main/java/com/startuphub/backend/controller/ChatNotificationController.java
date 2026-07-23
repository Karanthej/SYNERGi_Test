package com.startuphub.backend.controller;

import com.startuphub.backend.dto.response.ChatNotificationResponse;
import com.startuphub.backend.service.ChatNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat/notifications")
@RequiredArgsConstructor
public class ChatNotificationController {

    private final ChatNotificationService chatNotificationService;

    @GetMapping
    public ResponseEntity<List<ChatNotificationResponse>> getNotifications(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(chatNotificationService.getNotifications(authentication.getName()));
    }

    @PutMapping("/{uuid}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID uuid, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        chatNotificationService.markAsRead(authentication.getName(), uuid);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        chatNotificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID uuid, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        chatNotificationService.deleteNotification(authentication.getName(), uuid);
        return ResponseEntity.ok().build();
    }
}
