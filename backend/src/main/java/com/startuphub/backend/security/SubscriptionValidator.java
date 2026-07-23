package com.startuphub.backend.security;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.repository.ChatMemberRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionValidator {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ChatMemberRepository chatMemberRepository;

    @Transactional(readOnly = true)
    public void validateSubscription(String username, String destination) {
        if (destination == null || username == null) {
            throw new SecurityException("Null destination or username");
        }

        User user = userRepository.findByClerkId(username)
                .orElseThrow(() -> new SecurityException("User not found"));

        if (destination.startsWith("/user/")) {
            // E.g. /user/{uuid}/queue/workspace-updates
            String[] parts = destination.split("/");
            if (parts.length >= 3 && parts[2].length() == 36) { // length of UUID is 36
                String targetUuidStr = parts[2];
                try {
                    UUID targetUuid = UUID.fromString(targetUuidStr);
                    if (!user.getUuid().equals(targetUuid)) {
                        log.warn("Unauthorized private queue subscription: User {} tried to subscribe to {}", user.getUuid(), destination);
                        throw new SecurityException("Unauthorized queue subscription");
                    }
                } catch (IllegalArgumentException e) {
                    log.error("Invalid UUID in destination: {}", destination);
                    throw new SecurityException("Invalid UUID in destination");
                }
            }
            // If it doesn't have a UUID as the second path component, it's a standard user destination, allow it.
        } else if (destination.startsWith("/topic/workspace.")) {
            // E.g. /topic/workspace.{uuid}.presence
            String[] parts = destination.split("\\.");
            if (parts.length >= 2) {
                String targetIdStr = parts[1];
                try {
                    UUID workspaceUuid = UUID.fromString(targetIdStr);
                    // WorkspaceMemberRepository existsByStartupUuidAndUserId
                    boolean isMember = workspaceMemberRepository.existsByStartupUuidAndUserId(workspaceUuid, user.getId());
                    if (!isMember) {
                        log.warn("Unauthorized workspace subscription: User {} tried to subscribe to {}", user.getUuid(), destination);
                        throw new SecurityException("Unauthorized workspace subscription");
                    }
                } catch (IllegalArgumentException e) {
                    log.error("Invalid UUID in destination: {}", destination);
                    throw new SecurityException("Invalid UUID in destination");
                }
            }
        } else if (destination.startsWith("/topic/room.")) {
            // E.g. /topic/room.{uuid}
            String[] parts = destination.split("\\.");
            if (parts.length >= 2) {
                String targetUuidStr = parts[1];
                try {
                    UUID roomUuid = UUID.fromString(targetUuidStr);
                    boolean isMember = chatMemberRepository.existsByRoomUuidAndUserId(roomUuid, user.getId());
                    if (!isMember) {
                        log.warn("Unauthorized room subscription: User {} tried to subscribe to {}", user.getUuid(), destination);
                        throw new SecurityException("Unauthorized room subscription");
                    }
                } catch (IllegalArgumentException e) {
                    log.error("Invalid UUID in room destination: {}", destination);
                    throw new SecurityException("Invalid UUID in destination");
                }
            }
        } else if (destination.startsWith("/topic/user.")) {
            // E.g. /topic/user.{uuid}.chat-notifications
            String[] parts = destination.split("\\.");
            if (parts.length >= 2) {
                String targetUuidStr = parts[1];
                try {
                    UUID targetUuid = UUID.fromString(targetUuidStr);
                    if (!user.getUuid().equals(targetUuid)) {
                        log.warn("Unauthorized user topic subscription: User {} tried to subscribe to {}", user.getUuid(), destination);
                        throw new SecurityException("Unauthorized user topic subscription");
                    }
                } catch (IllegalArgumentException e) {
                    log.error("Invalid UUID in destination: {}", destination);
                    throw new SecurityException("Invalid UUID in destination");
                }
            }
        }
    }
}
