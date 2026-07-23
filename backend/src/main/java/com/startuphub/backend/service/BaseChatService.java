package com.startuphub.backend.service;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatMember;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.ChatMemberRepository;
import com.startuphub.backend.repository.ChatRoomRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;

import java.util.UUID;

public abstract class BaseChatService {

    protected final UserRepository userRepository;
    protected final StartupRepository startupRepository;
    protected final ChatRoomRepository chatRoomRepository;
    protected final WorkspaceMemberRepository workspaceMemberRepository;
    protected final ChatMemberRepository chatMemberRepository;

    protected BaseChatService(UserRepository userRepository,
                              StartupRepository startupRepository,
                              ChatRoomRepository chatRoomRepository,
                              WorkspaceMemberRepository workspaceMemberRepository,
                              ChatMemberRepository chatMemberRepository) {
        this.userRepository = userRepository;
        this.startupRepository = startupRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.chatMemberRepository = chatMemberRepository;
    }

    protected User getUserByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
    
    protected Startup getStartup(UUID startupUuid) {
        return startupRepository.findByUuid(startupUuid).orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
    }
    
    protected ChatRoom getRoom(UUID roomUuid, UUID startupUuid) {
        ChatRoom room = chatRoomRepository.findByUuid(roomUuid).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        if (!room.getStartup().getUuid().equals(startupUuid)) {
            throw new BadRequestException("Room does not belong to this workspace");
        }
        return room;
    }
    
    protected void checkWorkspaceAccess(Startup startup, User user) {
        if (startup.getFounder().getId().equals(user.getId())) {
            return;
        }
        if (!workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, user, WorkspaceMemberStatus.ACTIVE)) {
            throw new BadRequestException("Unauthorized access to workspace");
        }
    }
    
    protected ChatMember checkRoomAccess(ChatRoom room, User user) {
        ChatMember member = chatMemberRepository.findByRoomAndUser(room, user).orElse(null);
        if (member == null) {
            throw new BadRequestException("Unauthorized access to chat room");
        }
        return member;
    }
}
