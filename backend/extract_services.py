import re
import os

input_file = r"k:\startup\backend\src\main\java\com\startuphub\backend\service\ChatService.java"
output_dir = r"k:\startup\backend\src\main\java\com\startuphub\backend\service"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# BaseChatService is already created!
# Let's create ChatRoomService.java and ChatMessageService.java

room_methods = ["getWorkspaceRooms", "getOrCreatePrivateChat", "createGroup", "deleteGroup", "updateGroup", "updateGroupIcon", "addGroupMember", "removeGroupMember", "updateGroupMemberRole", "getRoomInfo", "getRoomMembers"]
message_methods = ["getRoomMessages", "searchRoomMessages", "sendMessageWithFiles", "getRoomAttachments", "downloadAttachment", "markAsRead", "getRoomReceipts"]

# Actually, parsing java methods with regex is impossible to get 100% right with nested braces.
# Since we need to extract exact methods, we'll write a brace counting parser.

def extract_method(content, method_name):
    # Find the start of the method (e.g. public XYZ methodName(...) or private XYZ methodName(...) or @Transactional...)
    # The method start index is before the annotations.
    # Usually methods are preceded by @Transactional
    pattern = r'(?:@[A-Za-z0-9_]+\s*(?:\([^)]*\))?\s*)*\s*(?:public|private|protected)\s+(?:[\w<>\?\[\]\s]+)\s+' + method_name + r'\s*\('
    match = re.search(pattern, content)
    if not match:
        return ""
    
    start_idx = match.start()
    
    # Now find the first '{' after match.end()
    idx = match.end()
    while idx < len(content) and content[idx] != '{':
        idx += 1
        
    brace_count = 1
    idx += 1
    while idx < len(content) and brace_count > 0:
        if content[idx] == '{':
            brace_count += 1
        elif content[idx] == '}':
            brace_count -= 1
        idx += 1
        
    return content[start_idx:idx]

chat_room_content = """package com.SYNERGI.backend.service;

import com.SYNERGI.backend.dto.response.ChatMemberResponse;
import com.SYNERGI.backend.dto.response.ChatRoomResponse;
import com.SYNERGI.backend.entity.Startup;
import com.SYNERGI.backend.entity.User;
import com.SYNERGI.backend.entity.chat.ChatMember;
import com.SYNERGI.backend.entity.chat.ChatRoom;
import com.SYNERGI.backend.entity.chat.ChatMessage;
import com.SYNERGI.backend.entity.chat.MessageAttachment;
import com.SYNERGI.backend.entity.chat.MessageReadReceipt;
import com.SYNERGI.backend.entity.enums.ChatRoomType;
import com.SYNERGI.backend.entity.enums.ChatRole;
import com.SYNERGI.backend.entity.enums.WorkspaceRole;
import com.SYNERGI.backend.exception.BadRequestException;
import com.SYNERGI.backend.exception.ResourceNotFoundException;
import com.SYNERGI.backend.listener.UserPresenceListener;
import com.SYNERGI.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
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

    public ChatRoomService(UserRepository userRepository, StartupRepository startupRepository,
                           ChatRoomRepository chatRoomRepository, WorkspaceMemberRepository workspaceMemberRepository,
                           ChatMemberRepository chatMemberRepository, ChatMessageRepository chatMessageRepository,
                           MessageReadReceiptRepository messageReadReceiptRepository,
                           MessageReactionRepository messageReactionRepository,
                           MessageAttachmentRepository messageAttachmentRepository,
                           StorageService storageService,
                           UserPresenceListener userPresenceListener) {
        super(userRepository, startupRepository, chatRoomRepository, workspaceMemberRepository, chatMemberRepository);
        this.chatMessageRepository = chatMessageRepository;
        this.messageReadReceiptRepository = messageReadReceiptRepository;
        this.messageReactionRepository = messageReactionRepository;
        this.messageAttachmentRepository = messageAttachmentRepository;
        this.storageService = storageService;
        this.userPresenceListener = userPresenceListener;
    }

"""

chat_message_content = """package com.SYNERGI.backend.service;

import com.SYNERGI.backend.dto.response.AttachmentResponse;
import com.SYNERGI.backend.dto.response.ChatMessageResponse;
import com.SYNERGI.backend.dto.response.ReactionResponse;
import com.SYNERGI.backend.dto.response.ReadReceiptResponse;
import com.SYNERGI.backend.entity.Startup;
import com.SYNERGI.backend.entity.User;
import com.SYNERGI.backend.entity.chat.ChatMember;
import com.SYNERGI.backend.entity.chat.ChatRoom;
import com.SYNERGI.backend.entity.chat.ChatMessage;
import com.SYNERGI.backend.entity.chat.MessageAttachment;
import com.SYNERGI.backend.entity.chat.MessageReaction;
import com.SYNERGI.backend.entity.chat.MessageReadReceipt;
import com.SYNERGI.backend.exception.BadRequestException;
import com.SYNERGI.backend.exception.ResourceNotFoundException;
import com.SYNERGI.backend.repository.*;
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
    private final StorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessageService(UserRepository userRepository, StartupRepository startupRepository,
                              ChatRoomRepository chatRoomRepository, WorkspaceMemberRepository workspaceMemberRepository,
                              ChatMemberRepository chatMemberRepository, ChatMessageRepository chatMessageRepository,
                              MessageReactionRepository messageReactionRepository,
                              MessageAttachmentRepository messageAttachmentRepository,
                              MessageReadReceiptRepository messageReadReceiptRepository,
                              StorageService storageService, SimpMessagingTemplate messagingTemplate) {
        super(userRepository, startupRepository, chatRoomRepository, workspaceMemberRepository, chatMemberRepository);
        this.chatMessageRepository = chatMessageRepository;
        this.messageReactionRepository = messageReactionRepository;
        this.messageAttachmentRepository = messageAttachmentRepository;
        this.messageReadReceiptRepository = messageReadReceiptRepository;
        this.storageService = storageService;
        this.messagingTemplate = messagingTemplate;
    }

"""

room_methods_str = "\n\n".join([extract_method(content, "getUnreadCount")] + [extract_method(content, m) for m in room_methods])
msg_methods_str = "\n\n".join([extract_method(content, m) for m in message_methods] + [extract_method(content, "mapMessageToResponse"), extract_method(content, "mapMessageToResponseOptimized"), extract_method(content, "buildMessageResponse")])

with open(os.path.join(output_dir, "ChatRoomService.java"), 'w', encoding='utf-8') as f:
    f.write(chat_room_content + room_methods_str + "\n}\n")

with open(os.path.join(output_dir, "ChatMessageService.java"), 'w', encoding='utf-8') as f:
    f.write(chat_message_content + msg_methods_str + "\n}\n")

print("Created ChatRoomService.java and ChatMessageService.java")
