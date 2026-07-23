package com.startuphub.backend.repository;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatMember;
import com.startuphub.backend.entity.chat.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    List<ChatMember> findByRoom(ChatRoom room);
    Optional<ChatMember> findByRoomAndUser(ChatRoom room, User user);
    boolean existsByRoomAndUser(ChatRoom room, User user);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) > 0 FROM ChatMember m WHERE m.room.uuid = :roomUuid AND m.user.id = :userId")
    boolean existsByRoomUuidAndUserId(@org.springframework.data.repository.query.Param("roomUuid") java.util.UUID roomUuid, @org.springframework.data.repository.query.Param("userId") Long userId);
    
    List<ChatMember> findByUser(User user);
    List<ChatMember> findByRoomStartupAndUser(com.startuphub.backend.entity.Startup startup, User user);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ChatMember m WHERE m.room = :room")
    void deleteByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room);
}
