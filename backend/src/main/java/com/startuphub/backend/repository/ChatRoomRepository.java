package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.enums.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByUuid(UUID uuid);
    List<ChatRoom> findByStartup(Startup startup);
    Optional<ChatRoom> findByStartupAndType(Startup startup, ChatRoomType type);

    @Query("SELECT r FROM ChatRoom r " +
           "WHERE r.startup = :startup AND r.type = :type " +
           "AND EXISTS (SELECT cm1 FROM ChatMember cm1 WHERE cm1.room = r AND cm1.user = :user1) " +
           "AND EXISTS (SELECT cm2 FROM ChatMember cm2 WHERE cm2.room = r AND cm2.user = :user2)")
    List<ChatRoom> findPrivateRoomsBetweenUsers(@Param("startup") Startup startup, @Param("type") ChatRoomType type, @Param("user1") User user1, @Param("user2") User user2);
}
