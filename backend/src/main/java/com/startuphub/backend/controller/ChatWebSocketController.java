package com.startuphub.backend.controller;

import com.startuphub.backend.dto.request.*;
import com.startuphub.backend.dto.response.ChatMessageResponse;
import com.startuphub.backend.dto.response.ChatNotificationResponse;
import com.startuphub.backend.dto.response.ReactionResponse;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.*;
import com.startuphub.backend.entity.enums.ChatRole;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.entity.enums.PresenceStatus;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import com.startuphub.backend.listener.UserPresenceListener;
import com.startuphub.backend.service.ChatNotificationService;

import com.startuphub.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final MessageReadReceiptRepository messageReadReceiptRepository;
    private final MessageStatusRepository messageStatusRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SimpUserRegistry simpUserRegistry;
    private final UserPresenceListener userPresenceListener;
    private final ChatNotificationRepository chatNotificationRepository;
    private final ChatNotificationService chatNotificationService;

    @GetMapping("/api/v1/debug/ws-users")
    public List<String> getWsUsers() {
        return simpUserRegistry.getUsers().stream()
            .map(u -> u.getName() + " - sessions: " + u.getSessions().size())
            .collect(Collectors.toList());
    }

    @MessageMapping("/chat.sendMessage/{roomUuid}")
    @Transactional
    public void sendMessage(@DestinationVariable UUID roomUuid, SendMessageRequest request, Authentication authentication) {
        log.info("Received chat.sendMessage for room {}, content: '{}'", roomUuid, request.getContent());
        if (!isAuthenticated(authentication)) {
            log.warn("Authentication failed or is null: {}", authentication);
            return;
        }
        User sender = getUserByClerkId(authentication.getName());
        ChatRoom room = getRoom(roomUuid);
        ChatMember member = getMember(room, sender);
        
        if (sender == null) log.warn("Sender is null for email {}", authentication.getName());
        if (room == null) log.warn("Room is null for uuid {}", roomUuid);
        if (member == null && sender != null && room != null) log.warn("Member is null for room {} and sender {}", roomUuid, sender.getId());
        
        if (sender == null || room == null || member == null) return;
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            log.warn("Message content is empty");
            return;
        }

        ChatMessage replyTo = null;
        if (request.getReplyToMessageUuid() != null) {
            replyTo = chatMessageRepository.findByUuid(UUID.fromString(request.getReplyToMessageUuid())).orElse(null);
        }

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(request.getContent().trim())
                .replyTo(replyTo)
                .voiceNote(request.isVoiceNote())
                .voiceNoteDuration(request.getVoiceNoteDuration())
                .build();

        chatMessageRepository.save(message);
        log.info("Saved message {} to DB, broadcasting...", message.getUuid());
        broadcastMessage(roomUuid, message, member.getRole(), request.getTempUuid(), ChatNotificationType.NEW_MESSAGE, null);
    }

    @MessageMapping("/chat.editMessage/{roomUuid}")
    @Transactional
    public void editMessage(@DestinationVariable UUID roomUuid, EditMessageRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User sender = getUserByClerkId(authentication.getName());
        ChatRoom room = getRoom(roomUuid);
        ChatMember member = getMember(room, sender);
        if (sender == null || room == null || member == null) return;
        if (request.getContent() == null || request.getContent().trim().isEmpty()) return;

        ChatMessage message = chatMessageRepository.findByUuid(UUID.fromString(request.getMessageUuid())).orElse(null);
        if (message == null || message.isDeleted() || !message.getSender().getId().equals(sender.getId())) return;

        // 15 minute edit rule
        if (ChronoUnit.MINUTES.between(message.getCreatedAt(), LocalDateTime.now()) > 15) return;

        message.setContent(request.getContent().trim());
        message.setEdited(true);
        chatMessageRepository.save(message);

        broadcastMessage(roomUuid, message, member.getRole(), null, null, null);
    }

    @MessageMapping("/chat.deleteMessage/{roomUuid}")
    @Transactional
    public void deleteMessage(@DestinationVariable UUID roomUuid, DeleteMessageRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        ChatRoom room = getRoom(roomUuid);
        ChatMember member = getMember(room, user);
        if (user == null || room == null || member == null) return;

        ChatMessage message = chatMessageRepository.findByUuid(UUID.fromString(request.getMessageUuid())).orElse(null);
        if (message == null || message.isDeleted()) return;

        // Only original sender or Founder can delete
        if (!message.getSender().getId().equals(user.getId()) && member.getRole() != ChatRole.OWNER) {
            return;
        }

        if (request.isDeleteForEveryone()) {
            // 15-minute rule for Delete for Everyone unless Founder
            if (member.getRole() != ChatRole.OWNER && ChronoUnit.MINUTES.between(message.getCreatedAt(), LocalDateTime.now()) > 15) {
                return;
            }
            message.setDeleted(true);
        } else {
            // Delete for me
            message.getDeletedByUsers().add(user.getId());
        }
        
        chatMessageRepository.save(message);

        // Broadcast the update if deleted for everyone
        if (request.isDeleteForEveryone()) {
            ChatMember senderMember = chatMemberRepository.findByRoomAndUser(room, message.getSender()).orElse(null);
            ChatRole senderRole = senderMember != null ? senderMember.getRole() : ChatRole.MEMBER;
            broadcastMessage(roomUuid, message, senderRole, null, null, null);
        }
    }

    @MessageMapping("/chat.reactMessage/{roomUuid}")
    @Transactional
    public void reactMessage(@DestinationVariable UUID roomUuid, ReactionRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        ChatRoom room = getRoom(roomUuid);
        ChatMember member = getMember(room, user);
        if (user == null || room == null || member == null) return;

        ChatMessage message = chatMessageRepository.findByUuid(UUID.fromString(request.getMessageUuid())).orElse(null);
        if (message == null || message.isDeleted()) return;

        // Replace or toggle reaction
        List<MessageReaction> userReactions = messageReactionRepository.findByMessage(message).stream()
            .filter(r -> r.getUser().getId().equals(user.getId()))
            .collect(Collectors.toList());
            
        boolean isNew = false;
        if (!userReactions.isEmpty()) {
            MessageReaction existing = userReactions.get(0);
            if (existing.getEmoji().equals(request.getEmoji())) {
                // Same emoji, toggle off
                messageReactionRepository.delete(existing);
            } else {
                // Different emoji, replace
                existing.setEmoji(request.getEmoji());
                messageReactionRepository.save(existing);
            }
        } else {
            // New reaction
            MessageReaction reaction = MessageReaction.builder()
                    .message(message)
                    .user(user)
                    .emoji(request.getEmoji())
                    .build();
            messageReactionRepository.save(reaction);
            isNew = true;
        }

        // Fetch fresh to build response correctly
        ChatMember senderMember = chatMemberRepository.findByRoomAndUser(room, message.getSender()).orElse(null);
        ChatRole senderRole = senderMember != null ? senderMember.getRole() : ChatRole.MEMBER;
        broadcastMessage(roomUuid, message, senderRole, null, isNew ? ChatNotificationType.REACTION : null, user);
    }

    @MessageMapping("/chat.typing/{roomUuid}")
    @Transactional
    public void typingStatus(@DestinationVariable UUID roomUuid, TypingRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        if (user == null) return;
        
        ChatRoom room = getRoom(roomUuid);
        if (room == null) return;
        ChatMember member = getMember(room, user);
        if (member == null) {
            log.warn("Unauthorized typing broadcast attempt by user {} in room {}", user.getEmail(), roomUuid);
            return;
        }
        
        // Simple broadcast. Payload: { "userUuid": "...", "name": "...", "isTyping": true/false }
        String payload = String.format("{\"type\":\"typing\",\"userUuid\":\"%s\",\"name\":\"%s\",\"isTyping\":%b}", 
                user.getUuid().toString(), user.getFullName(), request.isTyping());
        messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString(), payload);
    }

    @MessageMapping("/chat.activity/{roomUuid}")
    @Transactional
    public void activityStatus(@DestinationVariable UUID roomUuid, ActivityRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        if (user == null) return;
        
        ChatRoom room = getRoom(roomUuid);
        if (room == null) return;
        ChatMember member = getMember(room, user);
        if (member == null) {
            log.warn("Unauthorized activity broadcast attempt by user {} in room {}", user.getEmail(), roomUuid);
            return;
        }
        
        String payload = String.format("{\"type\":\"activity\",\"userUuid\":\"%s\",\"name\":\"%s\",\"activityType\":\"%s\"}", 
                user.getUuid().toString(), user.getFullName(), request.getType());
        messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString(), payload);
    }

    @MessageMapping("/presence/setStatus")
    @Transactional
    public void setPresenceStatus(UpdatePresenceRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        if (user == null) return;

        try {
            PresenceStatus newStatus = PresenceStatus.valueOf(request.getStatus());
            user.setPresenceStatus(newStatus);
            userRepository.save(user);
            userPresenceListener.broadcastPresence(user, true); // true because they are connected if they are sending this message
        } catch (IllegalArgumentException e) {
            log.warn("Invalid presence status received: {}", request.getStatus());
        }
    }

    @MessageMapping("/chat.messageDelivered/{roomUuid}")
    @Transactional
    public void messageDelivered(@DestinationVariable UUID roomUuid, MarkReadRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        if (user == null) return;

        ChatMessage message = chatMessageRepository.findByUuid(UUID.fromString(request.getMessageUuid())).orElse(null);
        if (message == null) return;

        MessageStatus status = messageStatusRepository.findByMessageAndUser(message, user)
                .orElse(MessageStatus.builder()
                        .message(message)
                        .user(user)
                        .build());
        
        if (status.getDeliveredAt() == null) {
            status.setDeliveredAt(LocalDateTime.now());
            try {
                messageStatusRepository.save(status);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Ignore concurrent insert of message status
            }

            String payload = String.format("{\"type\":\"statusUpdate\",\"messageUuid\":\"%s\",\"userUuid\":\"%s\",\"status\":\"DELIVERED\",\"timestamp\":\"%s\"}",
                    message.getUuid().toString(), user.getUuid().toString(), status.getDeliveredAt().toString());
            messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString(), payload);
        }
    }

    @MessageMapping("/chat.markRead/{roomUuid}")
    @Transactional
    public void markRead(@DestinationVariable UUID roomUuid, MarkReadRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        ChatRoom room = getRoom(roomUuid);
        if (user == null || room == null) return;

        ChatMember member = getMember(room, user);
        if (member == null) {
            log.warn("Unauthorized read receipt broadcast attempt by user {} in room {}", user.getEmail(), roomUuid);
            return;
        }

        ChatMessage lastMessage = null;
        if (request.getMessageUuid() != null) {
            lastMessage = chatMessageRepository.findByUuid(UUID.fromString(request.getMessageUuid())).orElse(null);
        }
        
        if (lastMessage == null) {
            // Find the last message in the room
            lastMessage = chatMessageRepository.findTopByRoomOrderByCreatedAtDesc(room).orElse(null);
        }

        if (lastMessage != null) {
            // Keep the old watermark logic for backward compatibility
            MessageReadReceipt receipt = messageReadReceiptRepository.findByRoomAndUser(room, user).orElse(null);
            if (receipt == null) {
                receipt = MessageReadReceipt.builder()
                        .room(room)
                        .user(user)
                        .lastReadMessage(lastMessage)
                        .readAt(LocalDateTime.now())
                        .build();
            } else {
                receipt.setLastReadMessage(lastMessage);
                receipt.setReadAt(LocalDateTime.now());
            }
            messageReadReceiptRepository.save(receipt);
        }

        // Find all unread messages in this room (messages sent by others)
        List<ChatMessage> unreadMessages = chatMessageRepository.findByRoom(room).stream()
            .filter(m -> !m.getSender().getId().equals(user.getId()))
            .collect(Collectors.toList());

        for (ChatMessage msg : unreadMessages) {
            MessageStatus status = messageStatusRepository.findByMessageAndUser(msg, user)
                    .orElse(MessageStatus.builder()
                            .message(msg)
                            .user(user)
                            .build());

            if (status.getReadAt() == null) {
                if (status.getDeliveredAt() == null) {
                    status.setDeliveredAt(LocalDateTime.now());
                }
                status.setReadAt(LocalDateTime.now());
                try {
                    messageStatusRepository.save(status);
                } catch (org.springframework.dao.DataIntegrityViolationException e) {
                    // Ignore concurrent insert of message status
                }

                String payload = String.format("{\"type\":\"statusUpdate\",\"messageUuid\":\"%s\",\"userUuid\":\"%s\",\"status\":\"READ\",\"timestamp\":\"%s\"}",
                        msg.getUuid().toString(), user.getUuid().toString(), status.getReadAt().toString());
                messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString(), payload);
            }
        }
        
        if (lastMessage != null) {
            // Also send legacy payload just in case
            String legacyPayload = String.format("{\"type\":\"readReceipt\",\"userUuid\":\"%s\",\"lastReadMessageUuid\":\"%s\"}", 
                    user.getUuid().toString(), lastMessage.getUuid().toString());
            messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString(), legacyPayload);
        }
    }

    @MessageMapping("/chat.pinMessage/{roomUuid}")
    @Transactional
    public void pinMessage(@DestinationVariable UUID roomUuid, PinMessageRequest request, Authentication authentication) {
        if (!isAuthenticated(authentication)) return;
        User user = getUserByClerkId(authentication.getName());
        ChatRoom room = getRoom(roomUuid);
        ChatMember member = getMember(room, user);
        if (user == null || room == null || member == null) return;

        // Only owner can pin messages
        if (member.getRole() != ChatRole.OWNER) return;

        ChatMessage message = chatMessageRepository.findByUuid(UUID.fromString(request.getMessageUuid())).orElse(null);
        if (message == null || message.isDeleted()) return;

        message.setPinned(request.isPinned());
        chatMessageRepository.save(message);

        ChatMember senderMember = chatMemberRepository.findByRoomAndUser(room, message.getSender()).orElse(null);
        ChatRole senderRole = senderMember != null ? senderMember.getRole() : ChatRole.MEMBER;
        broadcastMessage(roomUuid, message, senderRole, null, null, null);
    }

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated();
    }

    private User getUserByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId).orElse(null);
    }

    private ChatRoom getRoom(UUID roomUuid) {
        return chatRoomRepository.findByUuid(roomUuid).orElse(null);
    }

    private ChatMember getMember(ChatRoom room, User user) {
        if (room == null || user == null) return null;
        
        boolean isFounder = room.getStartup().getFounder().getId().equals(user.getId());
        if (!isFounder) {
            boolean isActive = workspaceMemberRepository.existsByStartupAndUserAndStatus(
                room.getStartup(), user, WorkspaceMemberStatus.ACTIVE);
            if (!isActive) return null;
        }

        return chatMemberRepository.findByRoomAndUser(room, user).orElse(null);
    }

    private void broadcastMessage(UUID roomUuid, ChatMessage message, ChatRole senderRole, String tempUuid, ChatNotificationType triggerType, User reactor) {
        List<MessageReaction> reactionsList = messageReactionRepository.findByMessage(message);
        
        Map<String, List<MessageReaction>> groupedReactions = reactionsList.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji));
                
        List<ReactionResponse> reactions = new ArrayList<>();
        for (Map.Entry<String, List<MessageReaction>> entry : groupedReactions.entrySet()) {
            reactions.add(ReactionResponse.builder()
                    .emoji(entry.getKey())
                    .count(entry.getValue().size())
                    .userUuids(entry.getValue().stream().map(r -> r.getUser().getUuid().toString()).collect(Collectors.toList()))
                    .build());
        }

        ChatMessageResponse response = ChatMessageResponse.builder()
                .uuid(message.getUuid().toString())
                .tempUuid(tempUuid)
                .content(message.getContent())
                .senderUuid(message.getSender().getUuid().toString())
                .senderName(message.getSender().getFullName())
                .senderAvatarUrl(message.getSender().getProfileImage())
                .senderRole(senderRole.name())
                .isPinned(message.isPinned())
                .isDeleted(message.isDeleted())
                .isDeletedForMe(false) // Broadcast payload; frontend will check deletedBy array if needed, or we just rely on the REST API to filter it out on load. Wait, if we send isDeletedForMe=false, the person who deleted it might see it. So let's send it based on message.getDeletedByUsers(). Wait, we are broadcasting to everyone. So everyone gets the same response.
                .isEdited(message.isEdited())
                .createdAt(message.getCreatedAt())
                .reactions(reactions)
                .statuses(new ArrayList<>())
                .replyToMessageUuid(message.getReplyTo() != null ? message.getReplyTo().getUuid().toString() : null)
                .replyToContent(message.getReplyTo() != null ? message.getReplyTo().getContent() : null)
                .replyToSenderName(message.getReplyTo() != null ? message.getReplyTo().getSender().getFullName() : null)
                .isVoiceNote(message.isVoiceNote())
                .voiceNoteDuration(message.getVoiceNoteDuration())
                .voiceNoteWaveform(message.getVoiceNoteWaveform())
                .build();

        messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString(), response);

        if (triggerType == null) return; // No notification for edits/deletes/removals

        // Broadcast to global chat notifications topic
        if (triggerType == ChatNotificationType.NEW_MESSAGE) {
            List<ChatMember> activeMembers = chatMemberRepository.findByRoom(message.getRoom());
            
            ChatNotificationType baseType = ChatNotificationType.NEW_MESSAGE;
            if (message.isVoiceNote()) baseType = ChatNotificationType.VOICE_NOTE;
            else if (message.getReplyTo() != null) baseType = ChatNotificationType.REPLY;
            else if (message.getContent() != null && message.getContent().contains("@")) {
                baseType = ChatNotificationType.MENTION;
            }

            for (ChatMember chatMember : activeMembers) {
                if (!chatMember.getUser().getId().equals(message.getSender().getId())) {
                    ChatNotificationType finalType = baseType;
                    if (baseType == ChatNotificationType.MENTION && !message.getContent().contains("@" + chatMember.getUser().getUsername())) {
                        finalType = ChatNotificationType.NEW_MESSAGE; 
                    }

                    ChatNotification notification = ChatNotification.builder()
                            .recipient(chatMember.getUser())
                            .sender(message.getSender())
                            .room(message.getRoom())
                            .message(message)
                            .type(finalType)
                            .content(message.getContent())
                            .build();

                    chatNotificationRepository.save(notification);
                    ChatNotificationResponse dto = chatNotificationService.toDto(notification);
                    messagingTemplate.convertAndSend("/topic/user." + chatMember.getUser().getUuid().toString() + ".chat-notifications", dto);
                }
            }
        } else if (triggerType == ChatNotificationType.REACTION && reactor != null) {
            // Notify the original message sender if they aren't the one reacting
            if (!message.getSender().getId().equals(reactor.getId())) {
                ChatNotification notification = ChatNotification.builder()
                        .recipient(message.getSender())
                        .sender(reactor)
                        .room(message.getRoom())
                        .message(message)
                        .type(ChatNotificationType.REACTION)
                        .content("Reacted to your message")
                        .build();

                chatNotificationRepository.save(notification);
                ChatNotificationResponse dto = chatNotificationService.toDto(notification);
                messagingTemplate.convertAndSend("/topic/user." + message.getSender().getUuid().toString() + ".chat-notifications", dto);
            }
        }
    }
}
