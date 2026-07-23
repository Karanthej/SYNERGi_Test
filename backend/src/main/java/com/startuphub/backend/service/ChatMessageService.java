package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.AttachmentResponse;
import com.startuphub.backend.dto.response.ChatMessageResponse;
import com.startuphub.backend.dto.response.ReactionResponse;
import com.startuphub.backend.dto.response.ReadReceiptResponse;
import com.startuphub.backend.dto.response.MessageStatusResponse;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatMember;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.chat.ChatMessage;
import com.startuphub.backend.entity.chat.MessageAttachment;
import com.startuphub.backend.entity.chat.MessageReaction;
import com.startuphub.backend.entity.chat.MessageReadReceipt;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatMessageService extends BaseChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final MessageReadReceiptRepository messageReadReceiptRepository;
    private final MessageStatusRepository messageStatusRepository;
    private final StorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.startuphub.backend.repository.CallLogRepository callLogRepository;

    public ChatMessageService(UserRepository userRepository, StartupRepository startupRepository,
            ChatRoomRepository chatRoomRepository, WorkspaceMemberRepository workspaceMemberRepository,
            ChatMemberRepository chatMemberRepository, ChatMessageRepository chatMessageRepository,
            MessageReactionRepository messageReactionRepository,
            MessageAttachmentRepository messageAttachmentRepository,
            MessageReadReceiptRepository messageReadReceiptRepository,
            MessageStatusRepository messageStatusRepository,
            StorageService storageService, SimpMessagingTemplate messagingTemplate,
            com.startuphub.backend.repository.CallLogRepository callLogRepository) {
        super(userRepository, startupRepository, chatRoomRepository, workspaceMemberRepository, chatMemberRepository);
        this.chatMessageRepository = chatMessageRepository;
        this.messageReactionRepository = messageReactionRepository;
        this.messageAttachmentRepository = messageAttachmentRepository;
        this.messageReadReceiptRepository = messageReadReceiptRepository;
        this.messageStatusRepository = messageStatusRepository;
        this.storageService = storageService;
        this.messagingTemplate = messagingTemplate;
        this.callLogRepository = callLogRepository;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getRoomMessages(String clerkId, UUID startupUuid, UUID roomUuid,
            Pageable pageable) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        Page<ChatMessage> messages = chatMessageRepository.findByRoomAndDeletedFalseOrderByCreatedAtDesc(room,
                pageable);

        // Bulk load to prevent N+1
        Map<Long, String> roleMap = chatMemberRepository.findByRoom(room).stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), m -> m.getRole().name()));

        Map<Long, List<MessageReaction>> reactionMap = messages.isEmpty() ? new java.util.HashMap<>()
                : messageReactionRepository.findByMessageIn(messages.getContent()).stream()
                        .collect(Collectors.groupingBy(r -> r.getMessage().getId()));

        return messages.map(msg -> mapMessageToResponseOptimized(msg, room, user, roleMap, reactionMap));
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> searchRoomMessages(String clerkId, UUID startupUuid, UUID roomUuid, String query,
            String filterType, Pageable pageable) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        Page<ChatMessage> messages;
        if (filterType != null) {
            switch (filterType.toUpperCase()) {
                case "MEDIA":
                    messages = chatMessageRepository.findMediaByRoom(room, pageable);
                    break;
                case "DOCUMENTS":
                    messages = chatMessageRepository.findDocumentsByRoom(room, pageable);
                    break;
                case "LINKS":
                    messages = chatMessageRepository.findLinksByRoom(room, pageable);
                    break;
                case "PINNED":
                    messages = chatMessageRepository.findPinnedByRoom(room, pageable);
                    break;
                case "REPLIES":
                    messages = chatMessageRepository.findRepliesByRoom(room, pageable);
                    break;
                default:
                    messages = chatMessageRepository
                            .findByRoomAndContentContainingIgnoreCaseAndDeletedFalseOrderByCreatedAtDesc(room,
                                    query != null ? query : "", pageable);
                    break;
            }
        } else {
            messages = chatMessageRepository
                    .findByRoomAndContentContainingIgnoreCaseAndDeletedFalseOrderByCreatedAtDesc(room,
                            query != null ? query : "", pageable);
        }

        // Bulk load to prevent N+1
        Map<Long, String> roleMap = chatMemberRepository.findByRoom(room).stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), m -> m.getRole().name()));

        Map<Long, List<MessageReaction>> reactionMap = messages.isEmpty() ? new java.util.HashMap<>()
                : messageReactionRepository.findByMessageIn(messages.getContent()).stream()
                        .collect(Collectors.groupingBy(r -> r.getMessage().getId()));

        return messages.map(msg -> mapMessageToResponseOptimized(msg, room, user, roleMap, reactionMap));
    }

    @Transactional
    public ChatMessageResponse sendMessageWithFiles(String clerkId, UUID startupUuid, UUID roomUuid, String content,
            String replyToMessageUuid, Boolean isVoiceNote, Integer voiceNoteDuration, String voiceNoteWaveform,
            List<MultipartFile> files) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        ChatMember member = checkRoomAccess(room, user);

        // Validation
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No files provided");
        }

        for (MultipartFile file : files) {
            if (file.getSize() > 10 * 1024 * 1024) { // 10MB
                throw new BadRequestException("File " + file.getOriginalFilename() + " exceeds the 10MB limit.");
            }
        }

        ChatMessage replyTo = null;
        if (replyToMessageUuid != null) {
            replyTo = chatMessageRepository.findByUuid(UUID.fromString(replyToMessageUuid)).orElse(null);
        }

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(user)
                .content(content != null ? content.trim() : "")
                .replyTo(replyTo)
                .voiceNote(isVoiceNote != null ? isVoiceNote : false)
                .voiceNoteDuration(voiceNoteDuration)
                .voiceNoteWaveform(voiceNoteWaveform)
                .build();

        // Must save message first to generate ID for attachments
        chatMessageRepository.save(message);

        List<MessageAttachment> attachments = new ArrayList<>();
        for (MultipartFile file : files) {
            UUID attachmentUuid = UUID.randomUUID();
            String fileUrl = "/api/v1/workspaces/" + startupUuid + "/chat/rooms/" + roomUuid + "/attachments/"
                    + attachmentUuid;

            storageService.storeFile(startupUuid, attachmentUuid, file);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

            MessageAttachment attachment = MessageAttachment.builder()
                    .uuid(attachmentUuid)
                    .message(message)
                    .fileUrl(fileUrl)
                    .fileName(originalName)
                    .fileType(contentType)
                    .fileSize(file.getSize())
                    .build();
            attachments.add(attachment);
        }

        messageAttachmentRepository.saveAll(attachments);
        message.setAttachments(attachments); // For mapping immediately

        ChatMessageResponse response = mapMessageToResponse(message, room, user);

        // Broadcast to WebSocket clients seamlessly!
        messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString(), response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> getRoomAttachments(String clerkId, UUID startupUuid, UUID roomUuid, String type) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        List<MessageAttachment> allAttachments = messageAttachmentRepository.findByRoomOrderByCreatedAtDesc(room);

        if (type != null && !type.isEmpty()) {
            allAttachments = allAttachments.stream()
                    .filter(a -> {
                        if (type.equalsIgnoreCase("image"))
                            return a.getFileType().startsWith("image/");
                        if (type.equalsIgnoreCase("document"))
                            return !a.getFileType().startsWith("image/");
                        return true;
                    })
                    .collect(Collectors.toList());
        }

        return allAttachments.stream()
                .map(a -> AttachmentResponse.builder()
                        .uuid(a.getUuid().toString())
                        .fileUrl(a.getFileUrl())
                        .fileName(a.getFileName())
                        .fileType(a.getFileType())
                        .fileSize(a.getFileSize())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Resource downloadAttachment(String clerkId, UUID startupUuid, UUID roomUuid, UUID attachmentUuid) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        MessageAttachment attachment = messageAttachmentRepository.findByUuid(attachmentUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        if (!attachment.getMessage().getRoom().getId().equals(room.getId())) {
            throw new BadRequestException("Attachment does not belong to this room");
        }

        String extension = "";
        int i = attachment.getFileName().lastIndexOf('.');
        if (i > 0) {
            extension = attachment.getFileName().substring(i);
        }

        return storageService.loadFileAsResource(startupUuid, attachmentUuid, extension);
    }

    @Transactional
    public void markAsRead(String clerkId, UUID startupUuid, UUID roomUuid, UUID messageUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        ChatMessage message = chatMessageRepository.findByUuid(messageUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getRoom().equals(room)) {
            throw new BadRequestException("Message does not belong to this room");
        }

        MessageReadReceipt receipt = messageReadReceiptRepository.findByRoomAndUser(room, user).orElse(null);
        if (receipt == null) {
            receipt = MessageReadReceipt.builder()
                    .room(room)
                    .user(user)
                    .build();
        }

        receipt.setLastReadMessage(message);
        receipt.setReadAt(java.time.LocalDateTime.now());
        messageReadReceiptRepository.save(receipt);

        ReadReceiptResponse response = ReadReceiptResponse.builder()
                .userUuid(user.getUuid().toString())
                .messageUuid(message.getUuid().toString())
                .messageCreatedAt(message.getCreatedAt())
                .readAt(receipt.getReadAt())
                .build();

        messagingTemplate.convertAndSend("/topic/workspace/" + startupUuid + "/room/" + roomUuid + "/receipts",
                response);
    }

    @Transactional(readOnly = true)
    public List<ReadReceiptResponse> getRoomReceipts(String clerkId, UUID startupUuid, UUID roomUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        return messageReadReceiptRepository.findByRoom(room).stream()
                .map(receipt -> ReadReceiptResponse.builder()
                        .userUuid(receipt.getUser().getUuid().toString())
                        .messageUuid(receipt.getLastReadMessage().getUuid().toString())
                        .messageCreatedAt(receipt.getLastReadMessage().getCreatedAt())
                        .readAt(receipt.getReadAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse togglePinMessage(String clerkId, UUID startupUuid, UUID roomUuid, UUID messageUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        ChatMessage message = chatMessageRepository.findByUuid(messageUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getRoom().equals(room)) {
            throw new BadRequestException("Message does not belong to this room");
        }

        message.setPinned(!message.isPinned());
        chatMessageRepository.save(message);

        ChatMessageResponse response = mapMessageToResponse(message, room, user);

        // Broadcast the update
        messagingTemplate.convertAndSend("/topic/room." + roomUuid.toString() + ".messageUpdate", response);

        return response;
    }

    private ChatMessageResponse mapMessageToResponse(ChatMessage msg, ChatRoom room, User user) {
        String roleStr = "TEAM_MEMBER";
        ChatMember member = chatMemberRepository.findByRoomAndUser(room, msg.getSender()).orElse(null);
        if (member != null) {
            roleStr = member.getRole().name();
        }

        List<MessageReaction> reactionsList = messageReactionRepository.findByMessage(msg);
        return buildMessageResponse(msg, user, roleStr, reactionsList);
    }

    private ChatMessageResponse mapMessageToResponseOptimized(ChatMessage msg, ChatRoom room, User user,
            Map<Long, String> roleMap, Map<Long, List<MessageReaction>> reactionMap) {
        String roleStr = roleMap.getOrDefault(msg.getSender().getId(), "TEAM_MEMBER");
        List<MessageReaction> reactionsList = reactionMap.getOrDefault(msg.getId(), new ArrayList<>());
        return buildMessageResponse(msg, user, roleStr, reactionsList);
    }

    @Transactional
    public void clearChatForUser(String clerkId, UUID startupUuid, UUID roomUuid) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);
        chatMessageRepository.clearChatForUser(room.getId(), user.getId());

        if ("PRIVATE".equals(room.getType())) {
            User otherUser = room.getMembers().stream()
                    .map(com.startuphub.backend.entity.chat.ChatMember::getUser)
                    .filter(u -> !u.getId().equals(user.getId()))
                    .findFirst()
                    .orElse(null);
            if (otherUser != null) {
                callLogRepository.clearCallLogsForUser(room.getStartup().getId(), user.getId(), otherUser.getId(),
                        user.getId());
            }
        }
    }

    private ChatMessageResponse buildMessageResponse(ChatMessage msg, User user, String roleStr,
            List<MessageReaction> reactionsList) {
        Map<String, List<MessageReaction>> groupedReactions = reactionsList.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji));

        List<ReactionResponse> reactions = new ArrayList<>();
        for (Map.Entry<String, List<MessageReaction>> entry : groupedReactions.entrySet()) {
            reactions.add(ReactionResponse.builder()
                    .emoji(entry.getKey())
                    .count(entry.getValue().size())
                    .userUuids(entry.getValue().stream().map(r -> r.getUser().getUuid().toString())
                            .collect(Collectors.toList()))
                    .build());
        }

        List<AttachmentResponse> attachments = (msg.getAttachments() != null ? msg.getAttachments()
                : new ArrayList<MessageAttachment>()).stream()
                .map(a -> AttachmentResponse.builder()
                        .uuid(a.getUuid().toString())
                        .fileUrl(a.getFileUrl())
                        .fileName(a.getFileName())
                        .fileType(a.getFileType())
                        .fileSize(a.getFileSize())
                        .build())
                .collect(Collectors.toList());

        List<MessageStatusResponse> statuses = messageStatusRepository.findByMessage(msg).stream()
                .map(s -> MessageStatusResponse.builder()
                        .userUuid(s.getUser().getUuid().toString())
                        .deliveredAt(s.getDeliveredAt())
                        .readAt(s.getReadAt())
                        .build())
                .collect(Collectors.toList());

        return ChatMessageResponse.builder()
                .uuid(msg.getUuid().toString())
                .content(msg.getContent())
                .senderUuid(msg.getSender().getUuid().toString())
                .senderName(msg.getSender().getFullName())
                .senderUsername(msg.getSender().getUsername())
                .senderAvatarUrl(msg.getSender().getProfileImage())
                .senderRole(roleStr)
                .isPinned(msg.isPinned())
                .isDeleted(msg.isDeleted())
                .isDeletedForMe(msg.getDeletedByUsers().contains(user.getId()))
                .isEdited(msg.isEdited())
                .createdAt(msg.getCreatedAt())
                .reactions(reactions)
                .attachments(attachments)
                .statuses(statuses)
                .replyToMessageUuid(msg.getReplyTo() != null ? msg.getReplyTo().getUuid().toString() : null)
                .replyToContent(msg.getReplyTo() != null ? msg.getReplyTo().getContent() : null)
                .replyToSenderName(msg.getReplyTo() != null ? msg.getReplyTo().getSender().getFullName() : null)
                .replyToSenderUsername(msg.getReplyTo() != null ? msg.getReplyTo().getSender().getUsername() : null)
                .isVoiceNote(msg.isVoiceNote())
                .voiceNoteDuration(msg.getVoiceNoteDuration())
                .voiceNoteWaveform(msg.getVoiceNoteWaveform())
                .build();
    }
}
