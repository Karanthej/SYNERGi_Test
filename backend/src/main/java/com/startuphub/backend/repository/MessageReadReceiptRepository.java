package com.startuphub.backend.repository;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.chat.MessageReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, Long> {
    Optional<MessageReadReceipt> findByRoomAndUser(ChatRoom room, User user);
    java.util.List<MessageReadReceipt> findByRoom(ChatRoom room);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM MessageReadReceipt r WHERE r.room = :room")
    void deleteByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room);
}
