package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.ChatNotificationResponse;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatMember;
import com.startuphub.backend.entity.chat.ChatMessage;
import com.startuphub.backend.entity.chat.ChatNotification;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import com.startuphub.backend.entity.enums.ChatRole;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.ChatMemberRepository;
import com.startuphub.backend.repository.ChatMessageRepository;
import com.startuphub.backend.repository.ChatNotificationRepository;
import com.startuphub.backend.repository.MessageReadReceiptRepository;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.startuphub.backend.entity.Startup;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatNotificationService {

    private final UserRepository userRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MessageReadReceiptRepository messageReadReceiptRepository;
    private final ChatNotificationRepository chatNotificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ChatNotificationResponse> getNotifications(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<ChatNotification> notifications = chatNotificationRepository.findByRecipientAndIsDeletedFalseOrderByCreatedAtDesc(user);
        
        return notifications.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(String clerkId, UUID notificationUuid) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        chatNotificationRepository.markAsRead(user, notificationUuid);
    }

    @Transactional
    public void markAllAsRead(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        chatNotificationRepository.markAllAsRead(user);
    }

    @Transactional
    public void deleteNotification(String clerkId, UUID notificationUuid) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        // Assuming we fetch it, set isDeleted=true and save
        chatNotificationRepository.findAll().stream()
            .filter(n -> n.getUuid().equals(notificationUuid) && n.getRecipient().getId().equals(user.getId()))
            .findFirst()
            .ifPresent(n -> {
                n.setDeleted(true);
                chatNotificationRepository.save(n);
            });
    }

    @Transactional
    public void createSystemNotification(User recipient, User sender, Startup startup, ChatNotificationType type, String content, String actionUrl) {
        ChatNotification existing = chatNotificationRepository.findByRecipientAndTypeAndActionData(recipient, type, actionUrl)
                .stream().findFirst().orElse(null);

        ChatNotification notif;
        if (existing != null) {
            existing.setCreatedAt(LocalDateTime.now());
            existing.setRead(false);
            existing.setDeleted(false);
            existing.setContent(content);
            notif = chatNotificationRepository.save(existing);
        } else {
            notif = ChatNotification.builder()
                    .recipient(recipient)
                    .sender(sender)
                    .startup(startup)
                    .type(type)
                    .content(content)
                    .actionData(actionUrl)
                    .build();
            notif = chatNotificationRepository.save(notif);
        }

        ChatNotificationResponse dto = toDto(notif);
        messagingTemplate.convertAndSend("/topic/user." + recipient.getUuid().toString() + ".chat-notifications", dto);
    }

    public ChatNotificationResponse toDto(ChatNotification notif) {
        String roleBadge = "";
        if (notif.getSender() != null && notif.getRoom() != null) {
            ChatMember member = chatMemberRepository.findByRoomAndUser(notif.getRoom(), notif.getSender()).orElse(null);
            if (member != null) {
                roleBadge = member.getRole() == ChatRole.OWNER ? "Founder" : "Talent";
            }
        }

        String conversationName = notif.getRoom() != null ? notif.getRoom().getName() : "";
        if (notif.getRoom() != null && notif.getRoom().getType().name().equals("PRIVATE")) {
            conversationName = notif.getRoom().getName();
        }

        String startupUuid = notif.getStartup() != null ? notif.getStartup().getUuid().toString() : (notif.getRoom() != null && notif.getRoom().getStartup() != null ? notif.getRoom().getStartup().getUuid().toString() : null);
        String startupName = notif.getStartup() != null ? notif.getStartup().getName() : (notif.getRoom() != null && notif.getRoom().getStartup() != null ? notif.getRoom().getStartup().getName() : null);
        String startupLogo = notif.getStartup() != null ? notif.getStartup().getLogoUrl() : (notif.getRoom() != null && notif.getRoom().getStartup() != null ? notif.getRoom().getStartup().getLogoUrl() : null);

        return ChatNotificationResponse.builder()
                .messageUuid(notif.getMessage() != null ? notif.getMessage().getUuid().toString() : null)
                .roomUuid(notif.getRoom() != null ? notif.getRoom().getUuid().toString() : null)
                .startupUuid(startupUuid)
                .startupName(startupName)
                .startupLogo(startupLogo)
                .senderName(notif.getSender() != null ? notif.getSender().getFullName() : "System")
                .senderAvatar(notif.getSender() != null ? notif.getSender().getProfileImage() : null)
                .content(notif.getContent())
                .createdAt(notif.getCreatedAt())
                .isRead(notif.isRead())
                .notificationType(notif.getType().name())
                .roleBadge(roleBadge)
                .conversationName(conversationName)
                .actionData(notif.getActionData())
                .build();
    }
}
