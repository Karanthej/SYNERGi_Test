package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.ChatMemberResponse;
import com.startuphub.backend.dto.response.ChatRoomResponse;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatMember;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.chat.ChatMessage;
import com.startuphub.backend.entity.chat.MessageAttachment;
import com.startuphub.backend.entity.chat.MessageReadReceipt;
import com.startuphub.backend.entity.enums.ChatRoomType;
import com.startuphub.backend.entity.enums.ChatRole;
import com.startuphub.backend.entity.enums.WorkspaceRole;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import com.startuphub.backend.entity.chat.ChatNotification;
import com.startuphub.backend.dto.response.ChatNotificationResponse;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.listener.UserPresenceListener;
import com.startuphub.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatRoomService extends BaseChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final MessageReadReceiptRepository messageReadReceiptRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final StorageService storageService;
    private final UserPresenceListener userPresenceListener;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatNotificationRepository chatNotificationRepository;
    private final ChatNotificationService chatNotificationService;

    @Autowired
    public ChatRoomService(UserRepository userRepository, StartupRepository startupRepository,
                           ChatRoomRepository chatRoomRepository, WorkspaceMemberRepository workspaceMemberRepository,
                           ChatMemberRepository chatMemberRepository, ChatMessageRepository chatMessageRepository,
                           MessageReadReceiptRepository messageReadReceiptRepository,
                           MessageReactionRepository messageReactionRepository,
                           MessageAttachmentRepository messageAttachmentRepository,
                           StorageService storageService,
                           UserPresenceListener userPresenceListener,
                           SimpMessagingTemplate messagingTemplate,
                           ChatNotificationRepository chatNotificationRepository,
                           ChatNotificationService chatNotificationService) {
        super(userRepository, startupRepository, chatRoomRepository, workspaceMemberRepository, chatMemberRepository);
        this.chatMessageRepository = chatMessageRepository;
        this.messageReadReceiptRepository = messageReadReceiptRepository;
        this.messageReactionRepository = messageReactionRepository;
        this.messageAttachmentRepository = messageAttachmentRepository;
        this.storageService = storageService;
        this.userPresenceListener = userPresenceListener;
        this.messagingTemplate = messagingTemplate;
        this.chatNotificationRepository = chatNotificationRepository;
        this.chatNotificationService = chatNotificationService;
    }



    private long getUnreadCount(ChatRoom room, User user) {
        MessageReadReceipt receipt = messageReadReceiptRepository.findByRoomAndUser(room, user).orElse(null);
        if (receipt != null && receipt.getLastReadMessage() != null) {
            return chatMessageRepository.countByRoomAndSenderNotAndCreatedAtAfter(room, user, receipt.getLastReadMessage().getCreatedAt());
        }
        return chatMessageRepository.countByRoomAndSenderNot(room, user);
    }

@Transactional(readOnly = true)
    public List<ChatRoomResponse> getWorkspaceRooms(String clerkId, UUID startupUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        return chatRoomRepository.findByStartup(startup).stream()
                .filter(room -> chatMemberRepository.existsByRoomAndUser(room, user))
                .map(room -> {
                    String otherName = null;
                    String otherUuid = null;
                    String otherUsername = null;
                    String otherAvatar = null;
                    String otherRole = null;

                    if (room.getType() == ChatRoomType.PRIVATE) {
                        List<ChatMember> members = chatMemberRepository.findByRoom(room);
                        ChatMember otherMember = members.stream()
                                .filter(m -> !m.getUser().getId().equals(user.getId()))
                                .findFirst().orElse(null);
                        
                        if (otherMember != null) {
                            otherName = otherMember.getUser().getFullName();
                            otherUuid = otherMember.getUser().getUuid().toString();
                            otherUsername = otherMember.getUser().getUsername();
                            otherAvatar = otherMember.getUser().getProfileImage();
                            otherRole = otherMember.getRole().name();
                        }
                    }

                    return ChatRoomResponse.builder()
                        .uuid(room.getUuid().toString())
                        .type(room.getType().name())
                        .name(room.getName())
                        .memberCount(chatMemberRepository.findByRoom(room).size())
                        .createdAt(room.getCreatedAt())
                        .otherMemberName(otherName)
                        .otherMemberUuid(otherUuid)
                        .otherMemberUsername(otherUsername)
                        .otherMemberAvatarUrl(otherAvatar)
                        .otherMemberRole(otherRole)
                        .description(room.getDescription())
                        .iconUrl(room.getIconUrl())
                        .colorTheme(room.getColorTheme())
                        .visibility(room.getVisibility())
                        .isArchived(room.isArchived())
                        .unreadCount(getUnreadCount(room, user))
                        .build();
                })
                .collect(Collectors.toList());
    }

@Transactional
    public ChatRoomResponse getOrCreatePrivateChat(String clerkId, UUID startupUuid, UUID targetUserUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        User targetUser = userRepository.findByUuid(targetUserUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));
        checkWorkspaceAccess(startup, targetUser);

        if (user.getId().equals(targetUser.getId())) {
            throw new BadRequestException("Cannot create private chat with yourself");
        }

        List<ChatRoom> privateRooms = chatRoomRepository.findPrivateRoomsBetweenUsers(startup, ChatRoomType.PRIVATE, user, targetUser);
        ChatRoom privateRoom = privateRooms.isEmpty() ? null : privateRooms.get(0);

        if (privateRoom == null) {
            privateRoom = ChatRoom.builder()
                    .startup(startup)
                    .type(ChatRoomType.PRIVATE)
                    .name("Private Chat")
                    .build();
            chatRoomRepository.save(privateRoom);

            WorkspaceRole userRole = workspaceMemberRepository.findByStartupAndUser(startup, user)
                    .map(com.startuphub.backend.entity.WorkspaceMember::getRole)
                    .orElse(WorkspaceRole.TEAM_MEMBER);
            
            WorkspaceRole targetRole = workspaceMemberRepository.findByStartupAndUser(startup, targetUser)
                    .map(com.startuphub.backend.entity.WorkspaceMember::getRole)
                    .orElse(WorkspaceRole.TEAM_MEMBER);

            ChatMember member1 = ChatMember.builder()
                    .room(privateRoom)
                    .user(user)
                    .role(ChatRole.MEMBER)
                    .build();

            ChatMember member2 = ChatMember.builder()
                    .room(privateRoom)
                    .user(targetUser)
                    .role(ChatRole.MEMBER)
                    .build();

            chatMemberRepository.saveAll(List.of(member1, member2));

            messagingTemplate.convertAndSend("/topic/workspace." + startupUuid + ".rooms", 
                String.format("{\"type\":\"ROOM_CREATED\",\"roomUuid\":\"%s\"}", privateRoom.getUuid()));
        }

        String otherRole = workspaceMemberRepository.findByStartupAndUser(startup, targetUser)
                .map(com.startuphub.backend.entity.WorkspaceMember::getRole).map(Enum::name).orElse("TEAM_MEMBER");

        return ChatRoomResponse.builder()
                .uuid(privateRoom.getUuid().toString())
                .type(privateRoom.getType().name())
                .name(privateRoom.getName())
                .memberCount(2)
                .createdAt(privateRoom.getCreatedAt())
                .otherMemberName(targetUser.getFullName())
                .otherMemberUuid(targetUser.getUuid().toString())
                .otherMemberUsername(targetUser.getUsername())
                .otherMemberAvatarUrl(targetUser.getProfileImage())
                .otherMemberRole(otherRole)
                .isArchived(privateRoom.isArchived())
                .unreadCount(getUnreadCount(privateRoom, user))
                .build();
    }

@Transactional
    public ChatRoomResponse createGroup(String clerkId, UUID startupUuid, String name, String description, List<UUID> memberUuids) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom groupRoom = ChatRoom.builder()
                .startup(startup)
                .type(ChatRoomType.GROUP)
                .name(name)
                .description(description)
                .visibility("PRIVATE_GROUP")
                .build();
        
        chatRoomRepository.save(groupRoom);

        ChatMember owner = ChatMember.builder()
                .room(groupRoom)
                .user(user)
                .role(ChatRole.OWNER)
                .build();
        chatMemberRepository.save(owner);

        if (memberUuids != null) {
            for (UUID mUuid : memberUuids) {
                User mUser = userRepository.findByUuid(mUuid).orElse(null);
                if (mUser != null && !mUser.getId().equals(user.getId()) && workspaceMemberRepository.findByStartupAndUser(startup, mUser).isPresent()) {
                    ChatMember cm = ChatMember.builder()
                            .room(groupRoom)
                            .user(mUser)
                            .role(ChatRole.MEMBER)
                            .build();
                    chatMemberRepository.save(cm);

                    // Notify
                    ChatNotification notification = ChatNotification.builder()
                            .recipient(mUser)
                            .sender(user)
                            .room(groupRoom)
                            .type(ChatNotificationType.GROUP_CREATED)
                            .content("Added you to a new group: " + name)
                            .build();
                    chatNotificationRepository.save(notification);
                    ChatNotificationResponse dto = chatNotificationService.toDto(notification);
                    messagingTemplate.convertAndSend("/topic/user." + mUser.getUuid().toString() + ".chat-notifications", dto);
                }
            }
        }

        ChatRoomResponse response = ChatRoomResponse.builder()
                .uuid(groupRoom.getUuid().toString())
                .type(groupRoom.getType().name())
                .name(groupRoom.getName())
                .description(groupRoom.getDescription())
                .memberCount(chatMemberRepository.findByRoom(groupRoom).size())
                .createdAt(groupRoom.getCreatedAt())
                .isArchived(false)
                .unreadCount(0L)
                .build();

        messagingTemplate.convertAndSend("/topic/workspace." + startupUuid + ".rooms", 
            String.format("{\"type\":\"ROOM_CREATED\",\"roomUuid\":\"%s\"}", groupRoom.getUuid()));

        return response;
    }

@Transactional
    public void deleteGroup(String clerkId, UUID startupUuid, UUID roomUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = chatRoomRepository.findByUuid(roomUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (room.getType() != ChatRoomType.GROUP) {
            throw new BadRequestException("Only group rooms can be deleted");
        }
        if (room.getType() == ChatRoomType.GENERAL) {
            throw new BadRequestException("General chat cannot be deleted");
        }

        ChatMember currentMember = chatMemberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this room"));

        if (currentMember.getRole() != ChatRole.OWNER) {
            throw new BadRequestException("Only the group owner can delete the group");
        }

        // Manual cascades to prevent foreign key constraint violations
        messageReadReceiptRepository.deleteByRoom(room);
        messageReactionRepository.deleteByRoom(room);
        messageAttachmentRepository.deleteByRoom(room);
        chatMemberRepository.deleteByRoom(room);
        chatMessageRepository.deleteDeletionsByRoomId(room.getId());
        chatMessageRepository.deleteByRoom(room);
        
        chatRoomRepository.delete(room);

        messagingTemplate.convertAndSend("/topic/workspace." + startupUuid + ".rooms", 
            String.format("{\"type\":\"ROOM_DELETED\",\"roomUuid\":\"%s\"}", roomUuid));
    }

@Transactional
    public ChatRoomResponse updateGroup(String clerkId, UUID startupUuid, UUID roomUuid, String name, String description, Boolean isArchived) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = chatRoomRepository.findByUuid(roomUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (room.getType() != ChatRoomType.GROUP) {
            throw new BadRequestException("Only group rooms can be updated");
        }
        if (room.getType() == ChatRoomType.GENERAL) {
            throw new BadRequestException("General chat cannot be updated");
        }

        ChatMember currentMember = chatMemberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this room"));

        if (currentMember.getRole() != ChatRole.OWNER && currentMember.getRole() != ChatRole.ADMIN) {
            throw new BadRequestException("Only admins can update the group");
        }

        if (name != null && !name.trim().isEmpty()) room.setName(name);
        if (description != null) room.setDescription(description);
        if (isArchived != null) {
            if (isArchived && currentMember.getRole() != ChatRole.OWNER) {
                 throw new BadRequestException("Only owner can archive group");
            }
            room.setArchived(isArchived);
        }

        chatRoomRepository.save(room);

        messagingTemplate.convertAndSend("/topic/room." + roomUuid, 
            String.format("{\"type\":\"ROOM_UPDATED\",\"roomUuid\":\"%s\"}", roomUuid));

        return ChatRoomResponse.builder()
                .uuid(room.getUuid().toString())
                .type(room.getType().name())
                .name(room.getName())
                .description(room.getDescription())
                .iconUrl(room.getIconUrl())
                .memberCount(chatMemberRepository.findByRoom(room).size())
                .createdAt(room.getCreatedAt())
                .isArchived(room.isArchived())
                .unreadCount(getUnreadCount(room, user))
                .build();
    }

@Transactional
    public ChatRoomResponse updateGroupIcon(String clerkId, UUID startupUuid, UUID roomUuid, MultipartFile file) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = chatRoomRepository.findByUuid(roomUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (room.getType() != ChatRoomType.GROUP && room.getType() != ChatRoomType.GENERAL) {
            throw new BadRequestException("Only groups and general chat can have an icon");
        }

        ChatMember currentMember = chatMemberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this room"));

        if (currentMember.getRole() != ChatRole.OWNER && currentMember.getRole() != ChatRole.ADMIN) {
            throw new BadRequestException("Only admins can update the group icon");
        }

        if (file == null || file.isEmpty()) {
            room.setIconUrl(null);
        } else {
            if (file.getSize() > 5 * 1024 * 1024) {
                throw new BadRequestException("File exceeds the 5MB limit.");
            }
            if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
                throw new BadRequestException("File must be an image");
            }

            UUID iconUuid = UUID.randomUUID();
            storageService.storeFile(startupUuid, iconUuid, file);
            String fileUrl = "/api/v1/workspaces/" + startupUuid + "/chat/rooms/" + roomUuid + "/attachments/" + iconUuid;
            room.setIconUrl(fileUrl);
            
            ChatMessage dummyMessage = ChatMessage.builder()
                    .room(room)
                    .sender(user)
                    .content("Group icon was updated.")
                    .build();
            chatMessageRepository.save(dummyMessage);
            
            MessageAttachment attachment = MessageAttachment.builder()
                    .uuid(iconUuid)
                    .message(dummyMessage)
                    .fileUrl(fileUrl)
                    .fileName("group_icon_" + iconUuid + ".png")
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();
            messageAttachmentRepository.save(attachment);
        }

        chatRoomRepository.save(room);

        return ChatRoomResponse.builder()
                .uuid(room.getUuid().toString())
                .type(room.getType().name())
                .name(room.getName())
                .description(room.getDescription())
                .iconUrl(room.getIconUrl())
                .memberCount(chatMemberRepository.findByRoom(room).size())
                .createdAt(room.getCreatedAt())
                .isArchived(room.isArchived())
                .unreadCount(getUnreadCount(room, user))
                .build();
    }

@Transactional
    public void addGroupMember(String clerkId, UUID startupUuid, UUID roomUuid, UUID targetUserUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = chatRoomRepository.findByUuid(roomUuid).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        
        ChatMember currentMember = chatMemberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this room"));

        if (room.getType() == ChatRoomType.GENERAL) {
            throw new BadRequestException("Members are managed automatically for General Chat");
        }

        if (currentMember.getRole() == ChatRole.MEMBER) {
            throw new BadRequestException("Only admins can add members");
        }

        User targetUser = userRepository.findByUuid(targetUserUuid).orElseThrow(() -> new ResourceNotFoundException("Target user not found"));
        checkWorkspaceAccess(startup, targetUser);

        if (chatMemberRepository.existsByRoomAndUser(room, targetUser)) {
            throw new BadRequestException("User is already in the group");
        }

        ChatMember cm = ChatMember.builder()
                .room(room)
                .user(targetUser)
                .role(ChatRole.MEMBER)
                .build();
        chatMemberRepository.save(cm);

        messagingTemplate.convertAndSend("/topic/room." + room.getUuid(), 
            String.format("{\"type\":\"MEMBER_ADDED\",\"userUuid\":\"%s\",\"name\":\"%s\"}", 
            targetUser.getUuid(), targetUser.getFullName()));
    }

@Transactional
    public void removeGroupMember(String clerkId, UUID startupUuid, UUID roomUuid, UUID targetUserUuid) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = chatRoomRepository.findByUuid(roomUuid).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        
        ChatMember currentMember = chatMemberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this room"));

        if (room.getType() == ChatRoomType.GENERAL) {
            throw new BadRequestException("Members cannot be removed from General Chat");
        }

        User targetUser = userRepository.findByUuid(targetUserUuid).orElseThrow(() -> new ResourceNotFoundException("Target user not found"));
        
        ChatMember targetMember = chatMemberRepository.findByRoomAndUser(room, targetUser)
                .orElseThrow(() -> new BadRequestException("Target user is not in the group"));

        // If trying to remove someone else, must be admin
        if (!user.getId().equals(targetUser.getId())) {
            if (currentMember.getRole() == ChatRole.MEMBER) {
                 throw new BadRequestException("Only admins can remove members");
            }
            if (targetMember.getRole() == ChatRole.OWNER) {
                 throw new BadRequestException("Cannot remove the owner");
            }
            if (currentMember.getRole() == ChatRole.ADMIN && targetMember.getRole() == ChatRole.ADMIN) {
                 throw new BadRequestException("Admins cannot remove other admins");
            }
        } else if (currentMember.getRole() == ChatRole.OWNER) {
             throw new BadRequestException("Owner cannot leave the group. Delete it instead or transfer ownership.");
        }

        chatMemberRepository.delete(targetMember);
        
        messagingTemplate.convertAndSend("/topic/room." + room.getUuid(), 
            String.format("{\"type\":\"MEMBER_REMOVED\",\"userUuid\":\"%s\",\"name\":\"%s\"}", 
            targetUser.getUuid(), targetUser.getFullName()));
    }

@Transactional
    public void updateGroupMemberRole(String clerkId, UUID startupUuid, UUID roomUuid, UUID targetUserUuid, String roleStr) {
        User user = getUserByClerkId(clerkId);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        ChatRoom room = chatRoomRepository.findByUuid(roomUuid).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        
        ChatMember currentMember = chatMemberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this room"));

        if (currentMember.getRole() != ChatRole.OWNER) {
            throw new BadRequestException("Only the owner can change roles");
        }
        
        if (room.getType() == ChatRoomType.GENERAL) {
            throw new BadRequestException("Roles cannot be changed in General Chat");
        }

        User targetUser = userRepository.findByUuid(targetUserUuid).orElseThrow(() -> new ResourceNotFoundException("Target user not found"));
        
        ChatMember targetMember = chatMemberRepository.findByRoomAndUser(room, targetUser)
                .orElseThrow(() -> new BadRequestException("Target user is not in the group"));

        try {
            ChatRole newRole = ChatRole.valueOf(roleStr.toUpperCase());
            if (newRole == ChatRole.OWNER) {
                 throw new BadRequestException("Cannot transfer ownership this way");
            }
            targetMember.setRole(newRole);
            chatMemberRepository.save(targetMember);
            
            messagingTemplate.convertAndSend("/topic/room." + room.getUuid(), 
                String.format("{\"type\":\"MEMBER_ROLE_UPDATED\",\"userUuid\":\"%s\",\"role\":\"%s\"}", 
                targetUser.getUuid(), newRole.name()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role");
        }
    }

@Transactional(readOnly = true)
    public ChatRoomResponse getRoomInfo(String clerkId, UUID startupUuid, UUID roomUuid) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        String otherName = null;
        String otherUuid = null;
        String otherUsername = null;
        String otherAvatar = null;
        String otherRole = null;

        if (room.getType() == ChatRoomType.PRIVATE) {
            List<ChatMember> members = chatMemberRepository.findByRoom(room);
            ChatMember otherMember = members.stream()
                    .filter(m -> !m.getUser().getId().equals(user.getId()))
                    .findFirst().orElse(null);
            
            if (otherMember != null) {
                otherName = otherMember.getUser().getFullName();
                otherUuid = otherMember.getUser().getUuid().toString();
                otherUsername = otherMember.getUser().getUsername();
                otherAvatar = otherMember.getUser().getProfileImage();
                otherRole = otherMember.getRole().name();
            }
        }

        return ChatRoomResponse.builder()
                .uuid(room.getUuid().toString())
                .type(room.getType().name())
                .name(room.getName())
                .memberCount(chatMemberRepository.findByRoom(room).size())
                .createdAt(room.getCreatedAt())
                .otherMemberName(otherName)
                .otherMemberUuid(otherUuid)
                .otherMemberUsername(otherUsername)
                .otherMemberAvatarUrl(otherAvatar)
                .otherMemberRole(otherRole)
                .unreadCount(getUnreadCount(room, user))
                .build();
    }

@Transactional(readOnly = true)
    public List<ChatMemberResponse> getRoomMembers(String clerkId, UUID startupUuid, UUID roomUuid) {
        User user = getUserByClerkId(clerkId);
        ChatRoom room = getRoom(roomUuid, startupUuid);
        checkRoomAccess(room, user);

        return chatMemberRepository.findByRoom(room).stream()
                .map(member -> {
                    boolean isOnline = userPresenceListener.isOnline(member.getUser().getClerkId());
                    return ChatMemberResponse.builder()
                        .userUuid(member.getUser().getUuid().toString())
                        .fullName(member.getUser().getFullName())
                        .username(member.getUser().getUsername())
                        .profileImage(member.getUser().getProfileImage())
                        .role(member.getRole().name())
                        .joinedAt(member.getJoinedAt())
                        .isOnline(isOnline)
                        .lastSeen(member.getUser().getLastSeen())
                        .build();
                })
                .collect(Collectors.toList());
    }
}
